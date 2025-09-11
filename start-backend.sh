#!/usr/bin/env bash

# Educational Content Generation App - Backend Starter Script
# This script starts both Mastra and Inngest servers required for the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down servers..."
    if [ ! -z "$MASTRA_PID" ] && kill -0 $MASTRA_PID 2>/dev/null; then
        print_info "Stopping Mastra server (PID: $MASTRA_PID)..."
        kill $MASTRA_PID
    fi
    if [ ! -z "$INNGEST_PID" ] && kill -0 $INNGEST_PID 2>/dev/null; then
        print_info "Stopping Inngest server (PID: $INNGEST_PID)..."
        kill $INNGEST_PID
    fi
    print_status "Backend shutdown complete."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

print_status "🚀 Starting Educational Content Generation Backend..."
echo ""

# Check prerequisites
print_info "📋 Checking prerequisites..."

if ! command_exists node; then
    print_error "❌ Node.js is not installed. Please install Node.js 20.9.0 or higher."
    exit 1
fi

if ! command_exists npm; then
    print_error "❌ npm is not installed. Please install npm."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
print_info "✅ Node.js version: $NODE_VERSION"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "⚠️  .env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "📝 Please edit .env file and add your API keys before running again."
        print_warning "Required: OPENROUTER_API_KEY or OPENAI_API_KEY"
        exit 1
    else
        print_error "❌ No .env.example file found. Cannot create .env file."
        exit 1
    fi
fi

# Check for API keys
if ! grep -q "^OPENROUTER_API_KEY=.*[^_here]$" .env; then
    print_warning "⚠️  No valid OpenRouter API key found in .env file."
    print_warning "Please add OPENROUTER_API_KEY to your .env file."
    print_info "Get OpenRouter API key: https://openrouter.ai/keys"
fi

# Check if ports are available
print_info "🔍 Checking ports availability..."

if ! check_port 5001; then
    print_error "❌ Port 5001 is already in use. Please stop the service using this port."
    print_info "Check what's using port 5001: lsof -i :5001"
    exit 1
fi

if ! check_port 3000; then
    print_error "❌ Port 3000 is already in use. Please stop the service using this port."
    print_info "Check what's using port 3000: lsof -i :3000"
    exit 1
fi

print_info "✅ Ports 5001 and 3000 are available"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "⚠️  node_modules not found. Installing dependencies..."
    npm install
fi

print_status "🎯 Starting servers..."
echo ""

# Start Mastra server in background
print_info "🚀 Starting Mastra development server on port 5001..."
npm run dev > /tmp/mastra.log 2>&1 &
MASTRA_PID=$!

# Wait for Mastra server to start
print_info "⏳ Waiting for Mastra server to initialize..."
sleep 5

# Check if Mastra server is running
if ! kill -0 $MASTRA_PID 2>/dev/null; then
    print_error "❌ Mastra server failed to start. Check logs:"
    cat /tmp/mastra.log
    exit 1
fi

# Test Mastra server
if curl -s http://localhost:5001/ > /dev/null 2>&1; then
    print_status "✅ Mastra server is running on http://localhost:5001"
else
    print_warning "⚠️  Mastra server may not be fully ready yet..."
fi

# Start Inngest server in background
print_info "🔄 Starting Inngest workflow server on port 3000..."
./scripts/inngest.sh > /tmp/inngest.log 2>&1 &
INNGEST_PID=$!

# Wait for Inngest server to start
print_info "⏳ Waiting for Inngest server to initialize..."
sleep 8

# Check if Inngest server is running
if ! kill -0 $INNGEST_PID 2>/dev/null; then
    print_error "❌ Inngest server failed to start. Check logs:"
    cat /tmp/inngest.log
    exit 1
fi

print_status "✅ Inngest server is running on port 3000"
echo ""

# Display status
print_status "🎉 Backend is fully operational!"
echo ""
print_info "📊 Server Status:"
print_info "  • Mastra Server:    http://localhost:5001/ (PID: $MASTRA_PID)"
print_info "  • Inngest Server:   http://localhost:3000/ (PID: $INNGEST_PID)"
print_info "  • API Endpoint:     http://localhost:5001/api"
print_info "  • Mastra Playground: http://localhost:5001"
echo ""

print_info "🧪 Quick Tests:"
print_info "  • Health Check:     curl http://localhost:5001/"
print_info "  • API Status:       curl http://localhost:5001/api"
echo ""

print_info "📖 Usage Examples:"
print_info "  • Start Workflow:"
echo -e "    ${CYAN}curl -X POST http://localhost:5001/api/workflows/improvedEducationalContentWorkflow/start-async \\${NC}"
echo -e "    ${CYAN}  -H 'Content-Type: application/json' \\${NC}"
echo -e "    ${CYAN}  -d '{\"inputData\":{\"topic\":\"JavaScript Basics\",\"targetAudience\":\"Beginners\",\"targetWordCount\":5000},\"runtimeContext\":{}}'${NC}"
echo ""

print_status "🔍 Monitoring logs:"
print_info "  • Mastra logs:      tail -f /tmp/mastra.log"
print_info "  • Inngest logs:     tail -f /tmp/inngest.log"
echo ""

print_warning "💡 Press Ctrl+C to stop all servers"
echo ""

# Keep script running and monitor processes
while true; do
    sleep 5
    
    # Check if processes are still running
    if ! kill -0 $MASTRA_PID 2>/dev/null; then
        print_error "❌ Mastra server stopped unexpectedly"
        cat /tmp/mastra.log | tail -20
        exit 1
    fi
    
    if ! kill -0 $INNGEST_PID 2>/dev/null; then
        print_error "❌ Inngest server stopped unexpectedly"
        cat /tmp/inngest.log | tail -20
        exit 1
    fi
done