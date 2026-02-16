# AI Blog Post App

A full-stack agentic web app to help plan, draft, review, and export technical blog posts for Medium or Substack.

## Project Structure

```
ai-blogpost-app/
├── backend/          # FastAPI + Anthropic Claude API
├── frontend/         # React + TypeScript + Vite + Framer Motion
├── scripts/          # Development scripts
└── .claude/skills/   # Claude skills (tech-blog-helper)
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7 for build tooling
- Tailwind CSS 4 for styling
- Radix UI for components
- CodeMirror for markdown editing
- Zustand for state management
- Motion (Framer Motion) for animated backgrounds
- remark-gfm for GitHub Flavored Markdown (tables, strikethrough)

**Backend:**
- FastAPI + Uvicorn
- Anthropic SDK for Claude API (agentic tool-calling loop)
- WeasyPrint for PDF export
- SSE streaming for real-time responses

## Quick Start

Run both servers:
```bash
./scripts/dev.sh
```

Or individually:

**Backend** (port 8000):
```bash
cd backend && uv run uvicorn src.main:app --reload --port 8000
```

**Frontend** (port 5173):
```bash
cd frontend && npm run dev
```

## Architecture

### Backend
- `src/main.py` - FastAPI app entry point with CORS
- `src/api/routes/session.py` - Session management (create, get, delete, transition, update-draft)
- `src/api/routes/chat.py` - SSE message streaming endpoint
- `src/api/models/` - Pydantic models (session, chat)
- `src/services/agent_service.py` - Agentic tool-calling loop (max 10 iterations)
- `src/services/session_manager.py` - In-memory session state
- `src/prompts/` - Phase-based system prompts (planning, drafting, review agents)
- `src/tools/` - Tool implementations (reference_tools, blog_tools)
- `src/utils/` - Utilities (file_parser, word_count)

### Backend Tools
| Tool | Phase | Description |
|------|-------|-------------|
| `fetch_url` | planning, drafting, reviewing | Fetch readable content from a URL |
| `fetch_databricks_docs` | planning, drafting, reviewing | Search Databricks documentation |
| `parse_code_file` | planning, drafting | Parse uploaded code files |
| `start_drafting` | planning | Transition to drafting phase, save planning context |
| `create_outline` | drafting | Generate structured blog post outline |
| `start_review` | drafting | Transition to reviewing phase |
| `review_draft` | reviewing | Review draft across 4 dimensions |
| `revise_draft` | reviewing | Replace draft with revised content |
| `finish_review` | reviewing | Transition to exporting phase |
| `get_word_stats` | drafting, reviewing, exporting | Word count, char count, read time |

### Frontend
- `src/App.tsx` - Main app layout (sidebar + animated background + main area)
- `src/stores/` - Zustand stores:
  - `sessionStore.ts` - Session ID, phase, planning context
  - `chatStore.ts` - Messages, streaming state, queued messages
  - `draftStore.ts` - Outline, draft content, suggestions, review summary, stats
  - `navigationStore.ts` - Sidebar collapse, active artifact view
  - `sessionListStore.ts` - Multi-session slots (up to 10), save/load/validate, bulk cleanup
- `src/api/client.ts` - REST API client (session, export, stats, files, updateDraft)
- `src/api/stream.ts` - SSE streaming client
- `src/components/interactive/` - Chat panel, message input, message display
- `src/components/artifacts/` - Artifact viewers (outline, draft, review, export)
- `src/components/layout/` - Sidebar and main area layout
- `src/components/shared/` - Markdown renderer (with remark-gfm), error boundary
- `src/components/ui/background-beams.tsx` - Aceternity UI animated background
- `src/lib/export.ts` - Shared download/export utilities
- `src/contexts/ThemeContext.tsx` - Dark/light theme (defaults to dark)

### SSE Event Types
`text`, `tool_use`, `tool_result`, `phase_change`, `outline`, `draft_chunk`, `review`, `draft_updated`, `done`

### Workflow Phases
`planning` → `drafting` → `reviewing` → `exporting`

Phase transitions are triggered by backend tools (`start_drafting`, `start_review`, `finish_review`), not manual frontend actions.

## App Features

**Chat-First UX:**
- Conversational interface to guide blog post creation
- AI agent collects topic, audience, style, references through dialogue
- Real-time streaming responses with tool activity indicators
- Animated bouncing dots typing indicator

**Artifacts Panel (right side):**
- Outline viewer — generated outline from planning phase, "Approve & Continue" button
- Draft viewer — CodeMirror editor / markdown preview with debounced backend sync
- Review viewer — Suggestions with apply/dismiss, "Revise All", "Upload Revised Draft", "Request New Review", downloadable review summary
- Export panel — Word count stats, download Markdown/PDF

**Iterative Review Loop:**
- Agent can revise drafts using the `revise_draft` tool (real-time `draft_updated` SSE event)
- Upload a manually revised `.md` file via the Review panel
- Request a new review after edits — the agent re-reviews using `review_draft`
- Review summary is stored and downloadable even after suggestions are resolved

**Session Management:**
- Up to 10 concurrent sessions with auto-generated labels from topic
- Rich session cards with phase badge, relative time, word count
- Bulk cleanup: "Clear all except current", "Clear older than 1 day/week"
- Individual delete on every session (auto-creates new session on last delete)
- Session switching with backend validation (awaits validation before allowing sends)
- Sessions persisted to localStorage with save/restore

**Visual Theme:**
- Sci-fi dark theme with Aceternity UI Background Beams (animated cyan-purple SVG gradients)
- Inter + JetBrains Mono fonts
- Gradient brand title, animated workflow stepper with progress line
- Entrance animations on chat messages, severity-colored review cards
- Light mode supported (beams toned down)

## Testing

**Backend** (62 tests):
```bash
cd backend && uv run pytest tests/ -v
```

**Frontend** (44 tests, 7 files):
```bash
cd frontend && npx vitest run
```

**TypeScript type check:**
```bash
cd frontend && npx tsc --noEmit
```

## Development Guidelines

- Use `uv` for Python environment management
- Use `uv run` to execute Python code
- Keep `pyproject.toml` minimal
- Avoid excessive try/except blocks
- Backend returns `session_id`/`workflow_phase`, frontend uses `id`/`phase` — mapping in client.ts
- Tool names must match exactly between backend registry and frontend TOOL_LABELS in `ToolActivityCard.tsx`
- Phase transitions happen via backend tools, not frontend — add new tools to `PHASE_TOOLS` in `backend/src/tools/__init__.py`
- New SSE events must be added to both `backend/src/services/agent_service.py` and `frontend/src/types/index.ts` + `frontend/src/api/stream.ts`
- Session validation is blocking (awaited) on init to prevent race conditions with stale localStorage sessions
