#!/usr/bin/env bash

# Quick Start Script for Educational Content Generator
# Simple version for development

set -e

echo "🚀 Starting Educational Content Generator..."

# Start backend in background
echo "Starting backend on port 5001..."
npm run dev &
BACKEND_PID=$!

# Wait for backend
sleep 5

# Start frontend in background
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend
sleep 3

echo ""
echo "✅ Services Started!"
echo ""
echo "🌐 Frontend: http://localhost:3000 (or next available port)"
echo "🔧 Backend:  http://localhost:5001/api" 
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "mastra dev" 2>/dev/null || true
    echo "Done!"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Wait for processes
wait