#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Stopping EduFuture services..."
    kill $BACKEND_PID
    exit
}

# Trap Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT

echo "🚀 Starting EduFuture Project..."

# 1. Start FastAPI Backend
echo "Starting Backend (FastAPI)..."
./venv/bin/python -m uvicorn backend.main:app --reload &
BACKEND_PID=$!

# 2. Start React Frontend
echo "Starting Frontend (React)..."
cd frontend
npm run dev
