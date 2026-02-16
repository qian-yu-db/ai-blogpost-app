"""Agent service using Claude with tool-calling agentic loop."""

from typing import AsyncIterator
import json
import logging
import anthropic

from src.config import (
    ANTHROPIC_API_KEY,
    ANTHROPIC_BASE_URL,
    ANTHROPIC_AUTH_TOKEN,
    CLAUDE_MODEL,
    SKILL_DIR,
)
from src.services.session_manager import (
    session_manager,
    WorkflowPhase,
    PlanningContext,
)
from src.prompts import get_planning_prompt, get_drafting_prompt, get_review_prompt
from src.tools import get_tool_definitions, execute_tool

logger = logging.getLogger(__name__)


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    """Create async Anthropic client with Databricks AI Gateway or direct API."""
    if ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN:
        return anthropic.AsyncAnthropic(
            base_url=ANTHROPIC_BASE_URL,
            api_key=ANTHROPIC_AUTH_TOKEN,
        )
    return anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)


def load_skill_content() -> str:
    """Load the tech-blog-helper skill instructions."""
    skill_md = SKILL_DIR / "SKILL.md"
    guidelines = SKILL_DIR / "references" / "blog_writing_guidelines.md"
    template = SKILL_DIR / "references" / "blog_outline_template.md"

    parts = []
    if skill_md.exists():
        parts.append(skill_md.read_text())
    if guidelines.exists():
        parts.append(f"\n## Writing Guidelines\n\n{guidelines.read_text()}")
    if template.exists():
        parts.append(f"\n## Outline Template\n\n{template.read_text()}")

    return "\n".join(parts)


def _get_system_prompt(phase: WorkflowPhase) -> str:
    """Get the system prompt for a given workflow phase."""
    prompts = {
        WorkflowPhase.PLANNING: get_planning_prompt,
        WorkflowPhase.DRAFTING: get_drafting_prompt,
        WorkflowPhase.REVIEWING: get_review_prompt,
        WorkflowPhase.EXPORTING: get_drafting_prompt,  # reuse drafting prompt for export phase
    }
    return prompts[phase]()


def _format_sse(event: str, data: dict) -> str:
    """Format a Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def run_agentic_session(session_id: str, user_message: str) -> AsyncIterator[str]:
    """Run an agentic conversation turn with tool use.

    Streams SSE events:
    - text: streamed text content
    - tool_use: when the model wants to call a tool
    - tool_result: result of a tool call
    - phase_change: when workflow phase changes
    - outline: when an outline is generated
    - draft_chunk: when draft content is generated
    - review: when review feedback is generated
    - done: when the turn is complete
    """
    client = get_anthropic_client()
    session = session_manager.get_session(session_id)
    if not session:
        yield _format_sse("text", {"content": "Error: Session not found"})
        yield _format_sse("done", {})
        return

    # Add user message to display history (for frontend)
    session_manager.add_message(session_id, "user", user_message)

    system_prompt = _get_system_prompt(session.workflow_phase)
    tools = get_tool_definitions(phase=session.workflow_phase.value)

    # Build API messages: prior turns from api_messages + new user message
    if session.api_messages:
        messages = list(session.api_messages)
        messages.append({"role": "user", "content": user_message})
    else:
        # First turn: no prior api_messages
        messages = [{"role": "user", "content": user_message}]

    # Agentic loop: keep going until we get a final response (no more tool calls)
    max_iterations = 10
    for _ in range(max_iterations):
        # Stream the response using async client
        full_text = ""
        tool_use_blocks = []

        async with client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=8192,
            system=system_prompt,
            messages=messages,
            tools=tools,
        ) as stream:
            async for event in stream:
                if hasattr(event, "type"):
                    if event.type == "content_block_delta":
                        if hasattr(event.delta, "text"):
                            full_text += event.delta.text
                            # Always send text for the chat
                            yield _format_sse("text", {"content": event.delta.text})
                            # Also send as draft_chunk during drafting phase
                            if session.workflow_phase == WorkflowPhase.DRAFTING:
                                yield _format_sse("draft_chunk", {"content": event.delta.text})

        response = await stream.get_final_message()

        # Collect tool use blocks from the response
        for block in response.content:
            if block.type == "tool_use":
                tool_use_blocks.append(block)

        if not tool_use_blocks:
            # No tool calls — this is the final response
            # Append to messages so api_messages history is complete
            if full_text:
                messages.append({"role": "assistant", "content": full_text})
                session_manager.add_message(session_id, "assistant", full_text)

                # If drafting phase, store the draft content
                if session.workflow_phase == WorkflowPhase.DRAFTING:
                    session_manager.update_session(session_id, draft_content=full_text)
            break

        # Process tool calls
        # Build the assistant message content (text + tool_use blocks)
        assistant_content = []
        for block in response.content:
            if block.type == "text":
                assistant_content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                assistant_content.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })

        messages.append({"role": "assistant", "content": assistant_content})

        # Execute tools and build tool results
        tool_results = []
        for tool_block in tool_use_blocks:
            yield _format_sse("tool_use", {
                "tool": tool_block.name,
                "input": tool_block.input,
            })

            try:
                result = await execute_tool(tool_block.name, tool_block.input, session_id=session_id)
            except Exception as e:
                logger.error(f"Tool {tool_block.name} failed: {e}")
                result = f"Error executing {tool_block.name}: {str(e)}"

            yield _format_sse("tool_result", {
                "tool": tool_block.name,
                "result": result[:500] if len(result) > 500 else result,
            })

            # Special handling for phase-transition and artifact tools
            if tool_block.name == "start_drafting":
                # Reload session to get updated phase, refresh tools and prompt
                session = session_manager.get_session(session_id)
                system_prompt = _get_system_prompt(session.workflow_phase)
                tools = get_tool_definitions(phase=session.workflow_phase.value)
                yield _format_sse("phase_change", {
                    "phase": session.workflow_phase.value,
                    "topic": session.planning_context.topic,
                })
            elif tool_block.name == "start_review":
                session = session_manager.get_session(session_id)
                system_prompt = _get_system_prompt(session.workflow_phase)
                tools = get_tool_definitions(phase=session.workflow_phase.value)
                yield _format_sse("phase_change", {"phase": session.workflow_phase.value})
            elif tool_block.name == "create_outline":
                yield _format_sse("outline", {"content": result})
            elif tool_block.name == "revise_draft":
                # Emit draft_updated event with new content
                session = session_manager.get_session(session_id)
                if session:
                    yield _format_sse("draft_updated", {"content": session.draft_content})
            elif tool_block.name == "finish_review":
                session = session_manager.get_session(session_id)
                system_prompt = _get_system_prompt(session.workflow_phase)
                tools = get_tool_definitions(phase=session.workflow_phase.value)
                yield _format_sse("phase_change", {"phase": session.workflow_phase.value})
            elif tool_block.name == "review_draft":
                try:
                    yield _format_sse("review", {"suggestions": json.loads(result)})
                except json.JSONDecodeError:
                    logger.warning("review_draft returned non-JSON, sending as text")

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_block.id,
                "content": result,
            })

        messages.append({"role": "user", "content": tool_results})

        # Store the assistant text if any
        if full_text:
            session_manager.add_message(session_id, "assistant", full_text)

        # Reset for next iteration
        full_text = ""
        tool_use_blocks = []

    # Persist full API message history (including tool_use/tool_result) for agent memory
    session_manager.add_api_messages(session_id, messages)

    yield _format_sse("done", {})


async def generate_from_session(session_id: str) -> AsyncIterator[str]:
    """Generate a draft from the session's planning context using the agentic loop."""
    session = session_manager.get_session(session_id)
    if not session:
        yield "Error: Session not found"
        return

    # Transition to drafting phase
    session_manager.update_phase(session_id, WorkflowPhase.DRAFTING)

    ctx = session.planning_context
    prompt = f"""Based on the planning conversation, generate a complete blog post draft.

Here's the planning context:
- **Topic**: {ctx.topic or ctx.abstract or 'See conversation history'}
- **Audience**: {', '.join(ctx.personas) if ctx.personas else 'developers'}
- **Technical Level**: {ctx.technical_level}
- **Target Length**: {ctx.target_length} minutes reading time
- **Style**: {ctx.style}
"""
    if ctx.key_points:
        prompt += f"- **Key Points**: {', '.join(ctx.key_points)}\n"
    if ctx.reference_urls:
        prompt += f"- **References**: {', '.join(ctx.reference_urls)}\n"
    if ctx.code_content:
        prompt += f"\n**Code Reference:**\n```\n{ctx.code_content}\n```\n"

    prompt += "\nStart by creating an outline, then write the full draft."

    async for event in run_agentic_session(session_id, prompt):
        yield event


async def stream_draft(
    abstract: str,
    personas: list[str],
    technical_level: str,
    target_length: str,
    style: str,
    code_content: str = "",
    reference_urls: list[str] | None = None,
) -> AsyncIterator[str]:
    """Stream a blog post draft using Claude. Kept for backward compat with /api/draft/generate."""
    client = get_anthropic_client()

    length_map = {
        "1": "short (1-2 minutes, ~300 words)",
        "3": "medium-short (3 minutes, ~600 words)",
        "5": "medium (5 minutes, ~1000 words)",
        "10": "long (10 minutes, ~2000 words)",
        "15": "very long (15+ minutes, ~3000+ words)",
    }
    target_desc = length_map.get(target_length, f"{target_length} minutes")

    tokens_map = {
        "1": 2048,
        "3": 4096,
        "5": 6000,
        "10": 8192,
        "15": 16384,
    }
    max_tokens = tokens_map.get(target_length, 8192)

    user_prompt = f"""Write a complete blog post based on these requirements:

**Abstract/Topic:** {abstract}

**Target Audience:** {', '.join(personas)}

**Technical Level:** {technical_level}

**Target Length:** {target_desc}

**Writing Style:** {style}
"""

    if code_content:
        user_prompt += f"""
**Code References:**
```
{code_content}
```
"""

    if reference_urls:
        user_prompt += f"""
**Reference URLs:** {', '.join(reference_urls)}
"""

    user_prompt += """

Now write the complete blog post in Markdown format. Start with the title and write the full article."""

    skill_content = load_skill_content()
    system_prompt = f"""You are an expert technical blog writer.

{skill_content}

## Markdown Formatting Rules
1. Use fenced code blocks with language identifiers
2. Add blank lines before and after headings and code blocks
3. Use proper heading hierarchy
4. Aim for ~70% prose and ~30% code"""

    async with client.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def get_feedback(content: str, feedback_type: str = "comprehensive") -> list[dict]:
    """Get feedback suggestions for a draft. Kept for backward compat with /api/feedback/review."""
    client = get_anthropic_client()

    feedback_prompts = {
        "grammar": "Focus only on grammar and spelling errors.",
        "style": "Focus on writing style, tone, and readability improvements.",
        "technical": "Focus on technical accuracy, code correctness, and best practices.",
        "comprehensive": "Provide comprehensive feedback on grammar, style, and technical accuracy.",
    }

    prompt = f"""Review the following blog post and provide specific, actionable suggestions.

{feedback_prompts.get(feedback_type, feedback_prompts["comprehensive"])}

Return your response as a JSON array of suggestion objects with these fields:
- type: "grammar", "style", or "technical"
- message: Brief description of the issue and fix
- line_start: Line number where issue starts (1-indexed, or null if general)
- line_end: Line number where issue ends (1-indexed, or null if general)
- original: The original text (if applicable, or null)
- replacement: Suggested replacement text (if applicable, or null)

Blog Post Content:
```markdown
{content}
```

Respond with ONLY the JSON array, no additional text."""

    response = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)
