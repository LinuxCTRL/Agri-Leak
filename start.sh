#!/bin/bash

# Start backend server in background
echo "Starting backend server..."
uv run uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend server in background
echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for Ctrl+C
echo "Both servers started. Press Ctrl+C to stop both."
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep script running
wait
