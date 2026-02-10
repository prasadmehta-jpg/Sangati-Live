#!/bin/bash
# Start Sangati in development mode (backend + frontend separately)
set -e

echo "=== Sangati Development Start ==="

# Start backend
echo "Starting backend..."
cd "$(dirname "$0")/../backend"
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt
echo "Backend starting on http://localhost:8000"
python run.py &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd "$(dirname "$0")/../frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
echo "Frontend starting on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Sangati is running ==="
echo "Dashboard: http://localhost:5173"
echo "API:       http://localhost:8000/api/health"
echo "API Docs:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
