#!/bin/bash
set -e

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null || true
    echo "Services stopped."
}

trap cleanup SIGINT SIGTERM

echo ">> Checking for existing processes on ports..."
# Kill process on port 8000 (Backend)
if lsof -i :8000 -t >/dev/null; then
    echo "Killing process on port 8000..."
    lsof -i :8000 -t | xargs kill -9
fi

# Kill process on port 3000 (Frontend)
if lsof -i :3000 -t >/dev/null; then
    echo "Killing process on port 3000..."
    lsof -i :3000 -t | xargs kill -9
fi

# Kill next dev lock if exists
if [ -f "web/.next/dev/lock" ]; then
    echo "Removing Next.js dev lock..."
    rm "web/.next/dev/lock"
fi

echo "Starting CRM System Locally..."

# Backend Setup & Run
echo ">> Setting up Backend..."
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

echo "Ensuring dependencies are installed..."
pip install -r requirements.txt > /dev/null

echo ">> Starting Gateway Service (Port 8000)..."
# Using exec to replace the shell process isn't right here if we want to run frontend too, so background it.
uvicorn services.gateway.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Frontend Setup & Run
echo ">> Setting up Frontend..."
cd web
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ">> Starting Frontend (Port 3000)..."
npm run dev &
FRONTEND_PID=$!

echo "=================================================="
echo "CRM System is up and running!"
echo "Backend: http://localhost:8000/docs"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop all services."
echo "=================================================="

wait
