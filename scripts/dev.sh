#!/bin/bash

# Start both frontend and backend development servers

trap 'kill 0' EXIT

# Store the project root directory (resolve once at startup)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Starting AI Blog Post App..."
echo ""

# Start backend (set DYLD_LIBRARY_PATH for WeasyPrint PDF export on macOS)
echo "Starting backend on http://localhost:8000..."
cd "$PROJECT_ROOT/backend"
if [ -d "/opt/homebrew/lib" ]; then
  export DYLD_LIBRARY_PATH="/opt/homebrew/lib${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
fi
uv run uvicorn src.main:app --reload --port 8000 &

# Wait for backend to be ready
sleep 2

# Start frontend
echo "Starting frontend on http://localhost:5173..."
cd "$PROJECT_ROOT/frontend"
npm run dev &

echo ""
echo "Both servers are running!"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
