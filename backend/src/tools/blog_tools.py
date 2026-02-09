"""Tools for blog creation: outlines, reviews, and word stats."""

import json
from src.utils.word_count import calculate_stats
from src.services.session_manager import session_manager, WorkflowPhase, PlanningContext


async def create_outline(
    topic: str,
    audience: str,
    technical_level: str,
    key_points: list[str] | None = None,
    style: str = "tutorial",
) -> str:
    """Generate a structured blog post outline based on planning context."""
    key_points_section = ""
    if key_points:
        key_points_section = "\n".join(f"- {point}" for point in key_points)
        key_points_section = f"\n### Key Points to Cover\n{key_points_section}\n"

    outline = f"""# Blog Post Outline

## Topic
{topic}

## Target Audience
{audience} ({technical_level} level)

## Writing Style
{style}
{key_points_section}
## Structure

### Title
[Create a clear, specific title that includes the key technology/concept]

### Introduction (2-3 paragraphs)
- **Hook**: Start with a relatable problem or interesting observation
- **Context**: Why this topic matters now, current challenges
- **Preview**: What readers will learn (2-4 key takeaways)

### Section 1: Foundation
**Purpose**: Establish core concepts
- Key terminology and definitions
- Core principles or patterns
- Simple illustrative example

### Section 2: Implementation
**Purpose**: Show practical application
- Step-by-step implementation
- Design decisions and tradeoffs
- Common pitfalls to avoid

### Section 3: Advanced Topics
**Purpose**: Elevate beyond basics
- Performance considerations
- Scaling strategies
- Best practices

### Section 4: Integration (Optional)
**Purpose**: Connect to the larger ecosystem
- Integration with other tools
- Deployment considerations
- Monitoring and debugging

### Conclusion
- **Summary**: Recap key points
- **Next Steps**: Further learning resources, suggested experiments
- **Call to Action**: Try the examples, share experiences

## Metadata
- **Target audience**: {audience} ({technical_level})
- **Style**: {style}
- **Estimated reading time**: TBD after drafting
"""
    return outline


async def review_draft(
    content: str,
    target_audience: str = "developers",
    technical_level: str = "intermediate",
) -> str:
    """Review a blog post draft across 4 dimensions. Returns structured JSON feedback."""
    # This returns a structured prompt/template - the actual AI review
    # happens in the agent conversation loop where the LLM evaluates the content
    review = {
        "dimensions": {
            "technical_accuracy": {
                "description": "Code correctness, best practices, outdated patterns, terminology",
                "checklist": [
                    "Code examples are syntactically correct",
                    "No deprecated APIs or outdated patterns",
                    "Technical terminology used correctly",
                    "Version numbers included for libraries",
                    "Caveats and limitations mentioned",
                ],
            },
            "clarity_and_structure": {
                "description": "Logical flow, transitions, progressive complexity",
                "checklist": [
                    "Introduction sets proper expectations",
                    "Concepts build progressively",
                    "Transitions between sections are smooth",
                    "Headers are descriptive and scannable",
                    "One idea per paragraph",
                ],
            },
            "audience_fit": {
                "description": f"Appropriate for {target_audience} at {technical_level} level",
                "checklist": [
                    "Complexity matches target level",
                    "Jargon is explained when needed",
                    "Prerequisites are stated",
                    "Pacing is appropriate",
                    "Examples are relatable to audience",
                ],
            },
            "polish": {
                "description": "Grammar, formatting, consistency",
                "checklist": [
                    "No typos or grammatical issues",
                    "Code formatting is consistent",
                    "Consistent voice and tone",
                    "Proper markdown formatting",
                    "Code blocks have language identifiers",
                ],
            },
        },
        "content_stats": calculate_stats(content),
        "content_preview": content[:500] + "..." if len(content) > 500 else content,
    }
    return json.dumps(review, indent=2)


async def start_drafting(
    session_id: str,
    topic: str,
    audience: str,
    technical_level: str = "intermediate",
    target_length: str = "5",
    style: str = "tutorial",
    key_points: list[str] | None = None,
    reference_urls: list[str] | None = None,
) -> str:
    """Save planning context and transition to drafting phase."""
    ctx = PlanningContext(
        topic=topic,
        personas=[audience],
        technical_level=technical_level,
        target_length=target_length,
        style=style,
        key_points=key_points or [],
        reference_urls=reference_urls or [],
    )
    session_manager.update_session(session_id, planning_context=ctx)
    session_manager.update_phase(session_id, WorkflowPhase.DRAFTING)
    return "Phase transitioned to drafting. Now create an outline and write the full blog post draft."


async def start_review(session_id: str) -> str:
    """Transition from drafting to reviewing phase."""
    session = session_manager.get_session(session_id)
    if not session:
        return "Error: Session not found"
    session_manager.update_phase(session_id, WorkflowPhase.REVIEWING)
    return "Phase transitioned to reviewing. Now review the draft using the review_draft tool."


async def get_word_stats(content: str) -> str:
    """Get word count, character count, and estimated reading time."""
    stats = calculate_stats(content)
    return json.dumps(stats)
