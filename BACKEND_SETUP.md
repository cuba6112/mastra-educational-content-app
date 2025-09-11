# 🚀 Backend Setup Guide

## One-Command Backend Start

I've created a comprehensive bash script that starts the entire backend system with proper monitoring, error handling, and status reporting.

### Quick Start

```bash
./start-backend.sh
```

That's it! This single command will:

## ✨ What the Script Does

### 🔍 **Pre-flight Checks**
- ✅ Verifies Node.js and npm installation
- ✅ Checks if required ports (5001, 3000) are available  
- ✅ Creates `.env` from template if missing
- ✅ Validates API key configuration
- ✅ Ensures dependencies are installed

### 🚀 **Server Management**
- 🎯 Starts Mastra development server (port 5001)
- 🔄 Starts Inngest workflow server (port 3000)
- ⏳ Waits for proper initialization
- ✅ Verifies both servers are operational

### 📊 **Monitoring & Logging**
- 📈 Real-time process monitoring
- 📝 Automatic log file management (`/tmp/mastra.log`, `/tmp/inngest.log`)
- 🎨 Color-coded status output
- ⚠️ Automatic restart if processes fail

### 🛡️ **Error Handling**
- 🔧 Graceful shutdown on Ctrl+C
- 🚨 Automatic cleanup of background processes
- 📋 Detailed error messages with troubleshooting tips
- 🔄 Process health monitoring

## 📋 Script Output Example

```bash
$ ./start-backend.sh

[2025-09-11 14:05:01] 🚀 Starting Educational Content Generation Backend...

[2025-09-11 14:05:01] 📋 Checking prerequisites...
[2025-09-11 14:05:01] ✅ Node.js version: 24.5.0
[2025-09-11 14:05:01] 🔍 Checking ports availability...
[2025-09-11 14:05:01] ✅ Ports 5001 and 3000 are available
[2025-09-11 14:05:01] 🎯 Starting servers...

[2025-09-11 14:05:01] 🚀 Starting Mastra development server on port 5001...
[2025-09-11 14:05:01] ⏳ Waiting for Mastra server to initialize...
[2025-09-11 14:05:06] ✅ Mastra server is running on http://localhost:5001

[2025-09-11 14:05:06] 🔄 Starting Inngest workflow server on port 3000...
[2025-09-11 14:05:06] ⏳ Waiting for Inngest server to initialize...
[2025-09-11 14:05:14] ✅ Inngest server is running on port 3000

[2025-09-11 14:05:14] 🎉 Backend is fully operational!

📊 Server Status:
  • Mastra Server:     http://localhost:5001/ (PID: 12345)
  • Inngest Server:    http://localhost:3000/ (PID: 12346)
  • API Endpoint:      http://localhost:5001/api
  • Mastra Playground: http://localhost:5001

🧪 Quick Tests:
  • Health Check:      curl http://localhost:5001/
  • API Status:        curl http://localhost:5001/api

📖 Usage Examples:
  • Start Workflow:
    curl -X POST http://localhost:5001/api/workflows/improvedEducationalContentWorkflow/start-async \
      -H 'Content-Type: application/json' \
      -d '{"inputData":{"topic":"JavaScript Basics","targetAudience":"Beginners","targetWordCount":5000},"runtimeContext":{}}'

🔍 Monitoring logs:
  • Mastra logs:       tail -f /tmp/mastra.log
  • Inngest logs:      tail -f /tmp/inngest.log

💡 Press Ctrl+C to stop all servers
```

## 🔧 Manual Alternative

If you prefer to start servers manually:

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
./scripts/inngest.sh
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Check what's using the ports
lsof -i :5001
lsof -i :3000

# Kill processes if needed
kill -9 $(lsof -t -i:5001)
kill -9 $(lsof -t -i:3000)
```

### Missing API Key
The script will detect missing OpenRouter API key and provide instructions:
```bash
⚠️  No valid OpenRouter API key found in .env file.
Please add OPENROUTER_API_KEY to your .env file.
Get OpenRouter API key: https://openrouter.ai/keys
```

### View Logs
```bash
# Real-time Mastra logs
tail -f /tmp/mastra.log

# Real-time Inngest logs  
tail -f /tmp/inngest.log
```

## 🎯 Key Features

- **🔄 Process Management**: Automatic background process handling
- **📊 Health Monitoring**: Continuous process health checks
- **🛡️ Graceful Shutdown**: Clean exit with proper process cleanup
- **📝 Comprehensive Logging**: Detailed logs for debugging
- **🎨 Color-Coded Output**: Easy-to-read status information
- **⚡ Fast Startup**: Optimized initialization sequence
- **🔧 Error Recovery**: Helpful error messages and recovery suggestions

## 🏁 Summary

The `start-backend.sh` script provides a professional, production-ready way to start your Educational Content Generation backend with:

✅ **One command to rule them all**  
✅ **Comprehensive error handling**  
✅ **Real-time monitoring**  
✅ **Professional logging**  
✅ **Graceful shutdown**  
✅ **Detailed status reporting**

Just run `./start-backend.sh` and you're ready to generate educational content!