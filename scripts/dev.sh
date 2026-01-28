#!/bin/bash

# Start both frontend and backend development servers

trap 'kill 0' EXIT

echo "Starting AI Blog Post App..."
echo ""

# Start backend
echo "Starting backend on http://localhost:8000..."
cd "$(dirname "$0")/../backend"
uv run uvicorn src.main:app --reload --port 8000 &

# Wait for backend to be ready
sleep 2

# Start frontend
echo "Starting frontend on http://localhost:5173..."
cd "$(dirname "$0")/../frontend"
npm run dev &

echo ""
echo "Both servers are running!"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
