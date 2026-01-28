from typing import AsyncIterator
import anthropic

from src.config import ANTHROPIC_API_KEY, CLAUDE_MODEL, SKILL_DIR


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


async def stream_draft(
    abstract: str,
    personas: list[str],
    technical_level: str,
    target_length: str,
    style: str,
    code_content: str = "",
    reference_urls: list[str] | None = None,
) -> AsyncIterator[str]:
    """Stream a blog post draft using Claude."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    skill_content = load_skill_content()

    length_map = {
        "1": "short (1-2 minutes, ~300 words)",
        "3": "medium-short (3 minutes, ~600 words)",
        "5": "medium (5 minutes, ~1000 words)",
        "10": "long (10 minutes, ~2000 words)",
        "15": "very long (15+ minutes, ~3000+ words)",
    }
    target_desc = length_map.get(target_length, f"{target_length} minutes")

    prompt = f"""You are a technical blog writer. Create a complete blog post based on the following inputs.

## Instructions
{skill_content}

## User Requirements

**Abstract/Topic:**
{abstract}

**Target Audience:** {', '.join(personas)}

**Technical Level:** {technical_level}

**Target Length:** {target_desc}

**Writing Style:** {style}
"""

    if code_content:
        prompt += f"""
**Code References:**
```
{code_content}
```
"""

    if reference_urls:
        prompt += f"""
**Reference URLs:** {', '.join(reference_urls)}
"""

    prompt += """

## Task
Write the complete blog post in Markdown format. Include:
1. A compelling title
2. An engaging introduction
3. Well-structured body sections with code examples where appropriate
4. A conclusion with key takeaways

Start writing the blog post now:"""

    with client.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


async def get_feedback(content: str, feedback_type: str = "comprehensive") -> list[dict]:
    """Get feedback suggestions for a draft."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

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

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    import json

    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)
