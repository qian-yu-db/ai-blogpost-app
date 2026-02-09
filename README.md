# AI Blog Post App

A full-stack web application powered by Claude AI to help you plan, draft, review, and export technical blog posts for Medium or Substack.

## Features

- **Chat-First UX** — Conversational AI agent guides you through planning, drafting, and reviewing your blog post
- **Artifacts Panel** — Real-time outline, draft editor (CodeMirror), review suggestions, and export stats displayed alongside the chat
- **Multi-Session Support** — Work on up to 3 blog posts concurrently, switch between them seamlessly
- **Review & Fix** — AI-generated review suggestions with one-click apply, or ask the agent to fix all remaining issues
- **Export** — Download as Markdown or PDF from any stage once a draft exists
- **Dark/Light Theme** — Toggle between dark and light modes

## Tech Stack

| Frontend | Backend |
|----------|---------|
| React 19 + TypeScript | FastAPI + Uvicorn |
| Vite 7 | Anthropic Claude API (agentic tool-calling) |
| Tailwind CSS 4 | SSE streaming |
| Zustand (state management) | WeasyPrint (PDF export) |
| Radix UI + CodeMirror | |

## Prerequisites

- Node.js 18+
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- Anthropic API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-blogpost-app.git
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

## Project Structure

```
ai-blogpost-app/
├── backend/
│   ├── src/
│   │   ├── api/routes/     # Session & chat SSE endpoints
│   │   ├── api/models/     # Pydantic models
│   │   ├── prompts/        # Phase-based agent system prompts
│   │   ├── services/       # Agent service, session manager
│   │   ├── tools/          # Reference & blog tool implementations
│   │   └── utils/          # File parser, word count
│   └── tests/              # 62 pytest tests
├── frontend/
│   ├── src/
│   │   ├── api/            # REST client + SSE stream
│   │   ├── components/
│   │   │   ├── artifacts/  # Outline, Draft, Review, Export viewers
│   │   │   ├── interactive/# Chat panel, message input
│   │   │   ├── layout/     # Sidebar, main area
│   │   │   └── shared/     # Markdown renderer, error boundary
│   │   ├── stores/         # Zustand stores (session, chat, draft, nav)
│   │   ├── lib/            # Shared utilities (export helpers)
│   │   └── contexts/       # Theme context
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
