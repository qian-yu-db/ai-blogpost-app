# AI Blog Post App

A full-stack web application powered by Claude AI to help you plan, draft, review, and export technical blog posts for Medium or Substack. Features an iterative review loop, sci-fi animated dark theme, and multi-session management.

## Features

- **Chat-First UX** — Conversational AI agent guides you through planning, drafting, and reviewing your blog post with real-time streaming
- **Artifacts Panel** — Real-time outline, draft editor (CodeMirror), review suggestions, and export stats displayed alongside the chat
- **Iterative Review Loop** — AI can revise drafts automatically, or upload your own fixed `.md` file and request a new review
- **Multi-Session Support** — Work on up to 10 blog posts concurrently with auto-generated labels, bulk cleanup, and session persistence
- **Export** — Download as Markdown or PDF with word count, character count, and estimated reading time
- **Sci-Fi Dark Theme** — Animated background beams (Aceternity UI), gradient accents, entrance animations, with light mode fallback

## Tech Stack

| Frontend | Backend |
|----------|---------|
| React 19 + TypeScript | FastAPI + Uvicorn |
| Vite 7 | Anthropic Claude API (agentic tool-calling) |
| Tailwind CSS 4 | SSE streaming |
| Zustand (state management) | WeasyPrint (PDF export) |
| Radix UI + CodeMirror | In-memory session manager |
| Motion (Framer Motion) | Phase-based system prompts |
| remark-gfm (Markdown tables) | |

## Prerequisites

- Node.js 18+
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Anthropic API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/qian-yu-db/ai-blogpost-app.git
   cd ai-blogpost-app
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   uv sync
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   ```

## Running the App

Start both servers with one command:
```bash
./scripts/dev.sh
```

Or run them separately:

**Backend** (http://localhost:8000):
```bash
cd backend && uv run uvicorn src.main:app --reload --port 8000
```

**Frontend** (http://localhost:5173):
```bash
cd frontend && npm run dev
```

## Workflow

The app follows a 4-phase workflow, each with dedicated AI agent prompts and tools:

1. **Planning** — Chat with the agent about your topic, audience, style, and references. The agent collects context and generates an outline.
2. **Drafting** — Approve the outline to trigger full draft generation. The agent writes the complete blog post with code examples.
3. **Reviewing** — The agent reviews the draft across 4 dimensions (technical accuracy, clarity, audience fit, polish). You can:
   - Apply individual suggestions with one click
   - Ask the agent to "Revise All" automatically
   - Upload a manually revised `.md` file
   - Request a new review after edits
4. **Exporting** — Download the final draft as Markdown or PDF with word count stats.

## Project Structure

```
ai-blogpost-app/
├── backend/
│   ├── src/
│   │   ├── api/routes/     # Session, chat SSE, export, file upload endpoints
│   │   ├── api/models/     # Pydantic models
│   │   ├── prompts/        # Phase-based agent system prompts
│   │   ├── services/       # Agent service (tool-calling loop), session manager
│   │   ├── tools/          # Reference tools, blog tools (10 tools total)
│   │   └── utils/          # File parser, word count
│   └── tests/              # 62 pytest tests
├── frontend/
│   ├── src/
│   │   ├── api/            # REST client + SSE stream parser
│   │   ├── components/
│   │   │   ├── artifacts/  # Outline, Draft, Review, Export viewers
│   │   │   ├── interactive/# Chat panel, message input, tool activity
│   │   │   ├── layout/     # Sidebar (workflow stepper, sessions), main area
│   │   │   ├── shared/     # Markdown renderer, error boundary
│   │   │   └── ui/         # Background beams, shadcn/ui primitives
│   │   ├── stores/         # Zustand stores (session, chat, draft, nav, sessionList)
│   │   ├── lib/            # Export utilities
│   │   └── contexts/       # Theme context (dark default)
│   └── vitest.config.ts    # 44 vitest tests
├── scripts/
│   └── dev.sh              # Start both servers
└── .claude/skills/         # Blog writing skill & references
```

## Testing

```bash
# Backend (62 tests)
cd backend && uv run pytest tests/ -v

# Frontend (44 tests)
cd frontend && npx vitest run

# TypeScript type check
cd frontend && npx tsc --noEmit
```

## License

MIT
