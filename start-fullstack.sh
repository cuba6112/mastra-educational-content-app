#!/usr/bin/env bash

# Educational Content Generation App - Full Stack Startup Script
# Starts both backend (Mastra + Inngest) and frontend (Next.js) servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to cleanup on exit
cleanup() {
    print_warning "🛑 Shutting down all servers..."
    
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        print_info "Stopping Mastra server..."
        kill $BACKEND_PID
        wait $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$INNGEST_PID" ] && kill -0 $INNGEST_PID 2>/dev/null; then
        print_info "Stopping Inngest server..."
        kill $INNGEST_PID
        wait $INNGEST_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        print_info "Stopping frontend server..."
        kill $FRONTEND_PID
        wait $FRONTEND_PID 2>/dev/null
    fi
    
    # Kill any remaining processes
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "mastra dev" 2>/dev/null || true
    pkill -f "inngest" 2>/dev/null || true
    
    print_status "✅ Full stack shutdown complete."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

print_header "🚀 Starting Educational Content Generation Full Stack..."
echo ""

# Check prerequisites
print_info "📋 Checking prerequisites..."

if ! command -v node >/dev/null 2>&1; then
    print_error "❌ Node.js is not installed. Please install Node.js 20.9.0 or higher."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
print_info "✅ Node.js version: $NODE_VERSION"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "⚠️  .env file not found in root directory"
    print_warning "Please ensure you have configured your OpenRouter API key"
    print_info "Creating basic .env file..."
    cat > .env << EOF
# Educational Content Generation App - Environment Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openrouter/sonoma-sky-alpha
DATABASE_URL=postgresql://localhost:5432/mastra
PORT=5001
NODE_ENV=development
SCHEDULE_CRON_EXPRESSION=0 9 * * *
SCHEDULE_CRON_TIMEZONE=America/Los_Angeles
EOF
    print_warning "Please update .env file with your actual OpenRouter API key"
fi

# Check if frontend exists
if [ ! -d "frontend" ]; then
    print_error "❌ Frontend directory not found."
    print_info "Creating frontend directory and installing dependencies..."
    mkdir -p frontend
    cd frontend
    npm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
    cd ..
fi

# Install dependencies
print_info "📦 Installing dependencies..."

# Backend dependencies
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
fi

# Frontend dependencies  
cd frontend
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
fi
cd ..

print_status "🎯 Starting servers..."
echo ""

# Start Backend (Mastra + Inngest) in background
print_info "🔧 Starting backend servers (Mastra + Inngest)..."

# Start Mastra server
print_info "🚀 Starting Mastra server..."
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for Mastra to initialize
sleep 3

# Start Inngest server
print_info "🔄 Starting Inngest workflow server..."
./scripts/inngest.sh > /tmp/inngest.log 2>&1 &
INNGEST_PID=$!

# Wait for backend to initialize
print_info "⏳ Waiting for backend to initialize..."
sleep 10

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "❌ Backend failed to start. Check logs:"
    cat /tmp/backend.log | tail -20
    exit 1
fi

# Test backend connectivity
print_info "🔍 Testing backend connectivity..."
for i in {1..30}; do
    if curl -s http://localhost:5001/api > /dev/null 2>&1; then
        print_status "✅ Backend is running on http://localhost:5001"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "⚠️  Backend may not be fully ready yet..."
        print_info "Backend logs:"
        tail -10 /tmp/backend.log
    fi
    sleep 2
done

# Start Frontend in background
print_info "🎨 Starting frontend server..."
cd frontend
# Clear Next.js cache for clean start
rm -rf .next
# Force frontend to use port 3001 since Inngest uses 3000
PORT=3001 npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to initialize
print_info "⏳ Waiting for frontend to initialize..."
sleep 8

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "❌ Frontend failed to start. Check logs:"
    cat /tmp/frontend.log | tail -20
    exit 1
fi

# Test frontend connectivity (check port 3001 specifically)
print_info "🔍 Testing frontend connectivity..."
FRONTEND_PORT=""
if curl -s http://localhost:3001/ > /dev/null 2>&1; then
    FRONTEND_PORT=3001
    print_status "✅ Frontend is running on http://localhost:3001"
else
    print_warning "⚠️  Frontend may not be fully ready yet..."
fi

if [ -z "$FRONTEND_PORT" ]; then
    print_warning "⚠️  Frontend may not be fully ready yet..."
    print_info "Frontend logs:"
    tail -10 /tmp/frontend.log
fi

echo ""
print_header "🎉 Full Stack is operational!"
echo ""

print_info "📊 Server Status:"
print_info "  • Backend API:      http://localhost:5001/api"
print_info "  • Frontend App:     http://localhost:3001"
print_info "  • Mastra Server:    http://localhost:5001"
print_info "  • Inngest Server:   http://localhost:3000 (internal)"
echo ""

print_info "🧪 Quick Tests:"
print_info "  • Backend Health:   curl http://localhost:5001/api"
print_info "  • Frontend Access:  open http://localhost:3001"
echo ""

print_info "📖 Usage:"
print_info "  1. Open the frontend URL in your browser"
print_info "  2. Fill in the content generation form:"
print_info "     - Content Topic (e.g., 'Advanced JavaScript Programming')"
print_info "     - Target Audience (e.g., 'Intermediate developers')"
print_info "     - Target Word Count (1,000-100,000)"
print_info "  3. Click 'Generate Content' to start the workflow"
print_info "  4. Monitor real-time progress in the frontend"
print_info "  5. Access generated content when workflow completes"
echo ""

print_info "🔍 Monitoring logs:"
print_info "  • Backend logs:     tail -f /tmp/backend.log"
print_info "  • Frontend logs:    tail -f /tmp/frontend.log"
echo ""

print_info "⚙️  Configuration:"
print_info "  • Environment:      .env (update OPENROUTER_API_KEY)"
print_info "  • Database:         PostgreSQL on default port 5432"
print_info "  • Backend Config:   src/mastra/index.ts"
print_info "  • Frontend Config:  frontend/src/app/page.tsx"
echo ""

print_warning "💡 Press Ctrl+C to stop all servers"
echo ""

# Keep script running and monitor processes
print_info "🔄 Monitoring services (press Ctrl+C to stop)..."
while true; do
    sleep 5
    
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "❌ Mastra server stopped unexpectedly"
        echo "Mastra logs:"
        cat /tmp/backend.log | tail -20
        exit 1
    fi
    
    if ! kill -0 $INNGEST_PID 2>/dev/null; then
        print_error "❌ Inngest server stopped unexpectedly"
        echo "Inngest logs:"
        cat /tmp/inngest.log | tail -20
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "❌ Frontend stopped unexpectedly"
        echo "Frontend logs:"
        cat /tmp/frontend.log | tail -20
        exit 1
    fi
    
    # Optional: Show a heartbeat every 30 seconds
    if [ $(($(date +%s) % 30)) -eq 0 ]; then
        print_info "💓 Services running normally..."
    fi
done