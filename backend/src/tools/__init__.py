"""Tool registry for the blog assistant agent."""

from src.tools.reference_tools import fetch_url, fetch_databricks_docs, parse_code_file
from src.tools.blog_tools import create_outline, review_draft, get_word_stats, start_drafting, start_review, revise_draft, finish_review

# Tool registry: maps tool names to (callable, description, input_schema)
TOOL_REGISTRY: dict[str, dict] = {
    "fetch_url": {
        "fn": fetch_url,
        "description": "Fetch and extract readable content from a URL. Returns the main text content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "The URL to fetch content from"},
            },
            "required": ["url"],
        },
    },
    "fetch_databricks_docs": {
        "fn": fetch_databricks_docs,
        "description": "Search Databricks documentation for a topic. Uses the llms.txt index to find relevant doc pages, then fetches the most relevant ones.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The topic or keyword to search for in Databricks docs"},
            },
            "required": ["query"],
        },
    },
    "parse_code_file": {
        "fn": parse_code_file,
        "description": "Parse a code file (Python, notebook, or text) from the uploads directory and return its content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {"type": "string", "description": "Name of the uploaded file to parse"},
            },
            "required": ["filename"],
        },
    },
    "start_drafting": {
        "fn": start_drafting,
        "description": "Transition from planning to drafting phase. Call this when the user confirms they are ready to start writing. Saves the planning summary and begins the drafting phase.",
        "input_schema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "The blog post topic and unique angle"},
                "audience": {"type": "string", "description": "Target audience description"},
                "technical_level": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                    "description": "Technical depth level",
                },
                "target_length": {
                    "type": "string",
                    "enum": ["1", "3", "5", "10", "15"],
                    "description": "Target reading time in minutes",
                },
                "style": {
                    "type": "string",
                    "enum": ["tutorial", "deep-dive", "opinion", "case-study", "comparison"],
                    "description": "Writing style",
                },
                "key_points": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Key sections or points to cover",
                },
            },
            "required": ["topic", "audience", "technical_level"],
        },
        "inject_session_id": True,
    },
    "create_outline": {
        "fn": create_outline,
        "description": "Generate a structured blog post outline based on planning context. Returns a markdown outline.",
        "input_schema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Main blog topic"},
                "audience": {"type": "string", "description": "Target audience description"},
                "technical_level": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                    "description": "Technical depth level",
                },
                "key_points": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Key points or sections to include",
                },
                "style": {
                    "type": "string",
                    "enum": ["tutorial", "deep-dive", "opinion", "case-study", "comparison"],
                    "description": "Writing style",
                },
            },
            "required": ["topic", "audience", "technical_level"],
        },
    },
    "review_draft": {
        "fn": review_draft,
        "description": "Review a blog post draft across 4 dimensions: technical accuracy, clarity & structure, audience fit, and polish. Returns structured feedback.",
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "The markdown blog post content to review"},
                "target_audience": {"type": "string", "description": "Who the post is written for"},
                "technical_level": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                    "description": "Expected technical depth",
                },
            },
            "required": ["content"],
        },
    },
    "start_review": {
        "fn": start_review,
        "description": "Transition from drafting to reviewing phase. Call this after completing the full blog post draft to begin the review process.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
        "inject_session_id": True,
    },
    "revise_draft": {
        "fn": revise_draft,
        "description": "Replace the current draft with revised content. Use this after applying fixes or improvements to the blog post.",
        "input_schema": {
            "type": "object",
            "properties": {
                "revised_content": {"type": "string", "description": "The full revised markdown content"},
                "revision_notes": {"type": "string", "description": "Brief summary of what was changed"},
            },
            "required": ["revised_content"],
        },
        "inject_session_id": True,
    },
    "finish_review": {
        "fn": finish_review,
        "description": "Transition from reviewing to exporting phase. Call this after completing the review and providing the final summary to indicate the blog post is ready for export.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
        "inject_session_id": True,
    },
    "get_word_stats": {
        "fn": get_word_stats,
        "description": "Get word count, character count, and estimated reading time for content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "The text content to analyze"},
            },
            "required": ["content"],
        },
    },
}


# Tools available per workflow phase
PHASE_TOOLS: dict[str, list[str]] = {
    "planning": ["fetch_url", "fetch_databricks_docs", "parse_code_file", "start_drafting"],
    "drafting": ["fetch_url", "fetch_databricks_docs", "parse_code_file", "create_outline", "get_word_stats", "start_review"],
    "reviewing": ["review_draft", "get_word_stats", "revise_draft", "fetch_url", "fetch_databricks_docs", "finish_review"],
    "exporting": ["get_word_stats"],
}


def get_tool_definitions(phase: str | None = None) -> list[dict]:
    """Return tool definitions in Anthropic API format, optionally filtered by phase."""
    if phase and phase in PHASE_TOOLS:
        allowed = PHASE_TOOLS[phase]
        registry = {k: v for k, v in TOOL_REGISTRY.items() if k in allowed}
    else:
        registry = TOOL_REGISTRY

    return [
        {
            "name": name,
            "description": info["description"],
            "input_schema": info["input_schema"],
        }
        for name, info in registry.items()
    ]


async def execute_tool(name: str, input_data: dict, session_id: str | None = None) -> str:
    """Execute a tool by name with given input. Returns result as string."""
    tool_info = TOOL_REGISTRY.get(name)
    if not tool_info:
        return f"Unknown tool: {name}"
    fn = tool_info["fn"]
    # Inject session_id for tools that need it
    if tool_info.get("inject_session_id") and session_id:
        input_data = {**input_data, "session_id": session_id}
    result = await fn(**input_data)
    if isinstance(result, str):
        return result
    import json
    return json.dumps(result)
