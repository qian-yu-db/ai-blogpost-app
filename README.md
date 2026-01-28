# AI Blog Post App

A full-stack web application powered by Claude AI to help you plan, draft, and publish technical blog posts for Medium or Substack.

## Features

- **Planning Tab** - Define your blog post with abstract, target audience, technical level, length, and writing style. Add references like code files or documentation links.
- **Drafting Tab** - Interactive editor with AI-powered feedback, grammar/spelling suggestions, and word count statistics.
- **Publish Tab** - Preview your final draft and export to Markdown or PDF.

## Tech Stack

| Frontend | Backend |
|----------|---------|
| React 19 + TypeScript | FastAPI + Uvicorn |
| Vite | Anthropic Claude API |
| Tailwind CSS | WeasyPrint (PDF export) |
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
│   │   ├── api/routes/     # API endpoints
│   │   ├── api/models/     # Pydantic models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── api/            # API client
│   └── package.json
├── scripts/
│   └── dev.sh              # Development script
└── tech-blog-helper/       # Blog writing skill
```

## License

MIT
