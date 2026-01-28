# AI Blog Post App

A full-stack agentic web app to help plan, draft, and publish technical blog posts for Medium or Substack.

## Project Structure

```
ai-blogpost-app/
├── backend/          # FastAPI + Anthropic Claude API
├── frontend/         # React + TypeScript + Vite
├── scripts/          # Development scripts
└── tech-blog-helper/ # Claude skill for blog drafting
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7 for build tooling
- Tailwind CSS 4 for styling
- Radix UI for components
- CodeMirror for markdown editing

**Backend:**
- FastAPI + Uvicorn
- Anthropic SDK for Claude API
- WeasyPrint for PDF export

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

## Backend Structure

- `src/main.py` - FastAPI app entry point
- `src/api/routes/` - API endpoints (draft, feedback, export, files)
- `src/api/models/` - Pydantic models (planning, drafting, export)
- `src/services/` - Business logic (agent_service, export_service)
- `src/utils/` - Utilities (file_parser, word_count)

## Frontend Structure

- `src/App.tsx` - Main app with tab navigation
- `src/components/planning/` - Planning tab components
- `src/components/drafting/` - Drafting tab components
- `src/components/publish/` - Publish tab components
- `src/components/ui/` - Shared UI components
- `src/contexts/` - React contexts (BlogContext, ThemeContext)
- `src/api/client.ts` - API client

## App Features

**Planning Tab:**
- Blog abstract/outline input
- Target reader persona selection
- Technical detail level menu
- Post length selector
- Writing style options
- Reference/resource input (files, links)
- Generate draft button

**Drafting Tab:**
- Interactive draft editor
- AI feedback and recommendations
- Grammar/spelling/reference fixes
- Word count statistics

**Publish Tab:**
- Final draft preview
- Export to Markdown or PDF

## Development Guidelines

- Use `uv` for Python environment management
- Use `uv run` to execute Python code
- Keep `pyproject.toml` minimal
- Avoid excessive try/except blocks
- Use `./tech-blog-helper/SKILL.md` for blog writing guidance
