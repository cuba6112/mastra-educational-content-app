Educational Content Generation App
An intelligent educational content generation system built with the Mastra framework that creates comprehensive learning materials using AI agents. This application automatically generates detailed educational outlines, writes content, reviews quality, and produces professional PDF documents.

Features
🧠 AI-Powered Content Creation

Generates comprehensive educational outlines with structured chapters and sections
Creates detailed content for each section using specialized writing agents
Performs quality review and ensures educational standards
📚 Comprehensive Learning Materials

Supports topics for various skill levels (beginner to advanced)
Generates 60,000+ word educational guides by default
Structured content with chapters, sections, and subsections
🔄 Intelligent Workflow System

Multi-step content generation workflow
Progress tracking throughout the creation process
Chunked content generation for better quality and management
📄 Professional Output

Generates HTML and PDF versions of educational content
Saves completed materials to generated_books/ directory
Professional formatting and structure
🛠 Built-in Tools

Web scraping capabilities for research
Wikipedia research integration
PDF generation with professional formatting
Progress tracking and monitoring
Prerequisites
Node.js 20.9.0 or higher
PostgreSQL database (automatically provided in Replit)
OpenAI API key for AI content generation
Installation
1. Clone the Repository
git clone https://github.com/cuba6112/mastra-educational-content-app.git
cd mastra-educational-content-app
2. Install Dependencies
npm install
3. Environment Setup
Create a .env file in the root directory with the following variables:

# Required: OpenRouter API Key for content generation
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openrouter/sonoma-sky-alpha
# Database (automatically configured in Replit)
DATABASE_URL=your_postgresql_connection_string
Getting an OpenRouter API Key:
Visit OpenRouter API Keys
Sign in to your OpenRouter account
Create a new API key
Copy the key and add it to your .env file
4. Database Setup
The application uses PostgreSQL for storage. In Replit, this is automatically configured. For local development:

# Push database schema (run this after first setup)
npm run db:push
Running the Application
Development Mode
npm run dev
This will start:

Mastra development server on http://localhost:5000
Inngest server for workflow management
Database connections and storage
Build for Production
npm run build
Usage
Using the API
Once the server is running, you can trigger the educational content generation workflow:

curl -X POST http://localhost:5000/api/workflows/improvedEducationalContentWorkflow/start-async \
  -H 'Content-Type: application/json' \
  -d '{
    "inputData": {
      "topic": "Advanced JavaScript Programming",
      "targetAudience": "Intermediate developers",
      "targetWordCount": 60000
    },
    "runtimeContext": {}
  }'
Parameters
topic (string): The educational topic to create content for

Default: "Advanced JavaScript Programming"
Examples: "Machine Learning Fundamentals", "Web Development Basics", "Data Science with Python"
targetAudience (string): Target audience for the content

Default: "Intermediate developers"
Examples: "Beginners", "Advanced practitioners", "Students"
targetWordCount (number): Total word count for the generated content

Default: 60000
Recommended: 30000-100000 depending on topic complexity
Testing in Replit
If using Replit, you can test the workflow using the Playground tab:

Open the Playground tab in your Replit workspace
Select the improvedEducationalContentWorkflow
Enter your desired parameters
Click "Run" to start content generation
Generated Output
The application creates comprehensive educational materials including:

Detailed Outline: Structured chapters and sections
Full Content: 60,000+ words of educational material
Quality Review: AI-reviewed content for educational standards
PDF Document: Professional formatted learning guide
Progress Tracking: Real-time generation progress
Generated files are saved to the generated_books/ directory with timestamped filenames.

Project Structure
src/
├── mastra/
│   ├── agents/                    # AI agents for content generation
│   │   ├── ideaGenerationAgent.ts # Generates outlines and ideas
│   │   ├── writingAgent.ts        # Creates detailed content
│   │   └── reviewAgent.ts         # Reviews and improves content
│   ├── tools/                     # Specialized tools
│   │   ├── chunkedContentGenerationTool.ts # Manages content generation
│   │   ├── pdfGenerationTool.ts   # Creates PDF documents
│   │   ├── progressTrackingTool.ts # Tracks workflow progress
│   │   ├── webScrapingTool.ts     # Web research capabilities
│   │   └── wikipediaResearchTool.ts # Wikipedia integration
│   ├── workflows/                 # Main workflow definitions
│   │   └── improvedEducationalContentWorkflow.ts # Primary workflow
│   ├── storage/                   # Database configuration
│   └── index.ts                   # Main Mastra configuration
└── triggers/                      # Event triggers (Slack, Telegram)
Development
Code Formatting
# Check formatting
npm run check:format
# Auto-format code
npm run format
Type Checking
npm run check
Adding New Features
The application is built on Mastra's modular architecture:

Agents: Add new AI agents in src/mastra/agents/
Tools: Create specialized tools in src/mastra/tools/
Workflows: Define new workflows in src/mastra/workflows/
Logging
The application includes extensive logging throughout all components. Check the Mastra development server logs for detailed execution information.

API Endpoints
GET / - Health check and application info
POST /api/workflows/{workflowId}/start-async - Start workflow execution
GET /api/tools/{toolId}/execute - Execute individual tools
Various MCP server endpoints for tool testing
Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
License
This project is licensed under the ISC License. See the package.json file for details.

Support
For issues and questions:

Check the generated logs in the Mastra development server
Review the workflow execution in the Playground tab
Open an issue on GitHub with detailed error information
Built with ❤️ using Mastra Framework