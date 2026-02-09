# AI Blog Post App

A full-stack agentic web app to help plan, draft, and publish technical blog posts for Medium or Substack.

## Project Structure

```
ai-blogpost-app/
├── backend/          # FastAPI + Anthropic Claude API
├── frontend/         # React + TypeScript + Vite
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
- `src/api/routes/session.py` - Session management (create, get, delete, transition)
- `src/api/routes/chat.py` - SSE message streaming endpoint
- `src/api/models/` - Pydantic models (session, chat)
- `src/services/agent_service.py` - Agentic tool-calling loop (max 10 iterations)
- `src/services/session_manager.py` - In-memory session state
- `src/prompts/` - Phase-based system prompts (planning, drafting, review agents)
- `src/tools/` - Tool implementations (reference_tools, blog_tools)
- `src/utils/` - Utilities (file_parser, word_count)

### Frontend
- `src/App.tsx` - Main app layout (sidebar + main area)
- `src/stores/` - Zustand stores:
  - `sessionStore.ts` - Session ID, phase, planning context
  - `chatStore.ts` - Messages, streaming state, queued messages
  - `draftStore.ts` - Outline, draft content, suggestions, stats
  - `navigationStore.ts` - Sidebar collapse, active artifact view
  - `sessionListStore.ts` - Multi-session slots, save/load/validate
- `src/api/client.ts` - REST API client (session, export, stats, files)
- `src/api/stream.ts` - SSE streaming client
- `src/components/interactive/` - Chat panel, message input, message display
- `src/components/artifacts/` - Artifact viewers (outline, draft, review, export)
- `src/components/layout/` - Sidebar and main area layout
- `src/components/shared/` - Markdown renderer, error boundary
- `src/lib/export.ts` - Shared download/export utilities
- `src/contexts/ThemeContext.tsx` - Dark/light theme

### SSE Event Types
`text`, `tool_use`, `tool_result`, `phase_change`, `outline`, `draft_chunk`, `review`, `done`

### Workflow Phases
`planning` → `drafting` → `reviewing` → `exporting`

## App Features

**Chat-First UX:**
- Conversational interface to guide blog post creation
- AI agent collects topic, audience, style, references through dialogue
- Real-time streaming responses with tool activity indicators

**Artifacts Panel (right side):**
- Outline viewer — generated outline from planning phase
- Draft viewer — CodeMirror editor / markdown preview with download buttons (MD/PDF)
- Review viewer — Suggestions with apply/dismiss, "Ask Agent to Fix" button, download draft
- Export panel — Word count stats, download Markdown/PDF

**Session Management:**
- Up to 3 concurrent sessions
- Session switching with backend validation (auto-recovers if backend restarted)
- Sessions persisted to localStorage with save/restore

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
- Tool names must match exactly between backend registry and frontend TOOL_LABELS
