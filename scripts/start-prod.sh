#!/bin/bash
# Start Sangati in production mode (single server serving both API and frontend)
set -e

echo "=== Sangati Production Start ==="

cd "$(dirname "$0")/.."

# Build frontend
echo "Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ..

# Start backend (serves frontend from dist/)
echo "Starting server..."
cd backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "=== Sangati is running ==="
echo "Open: http://localhost:8000"
echo ""

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
