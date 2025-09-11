# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mastra-based educational content creation system that uses AI agents and workflows to generate comprehensive educational materials. The project leverages the Mastra framework for agent orchestration, Inngest for workflow execution, and various AI tools for content generation, research, and PDF creation.

## Development Commands

### Core Development
- `npm run dev` - Start the Mastra development server
- `npm run build` - Build the project for production
- `npm run check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run check:format` - Check code formatting

### Inngest Workflow Development
- `./scripts/inngest.sh` - Start Inngest development server with proper configuration
- The script automatically configures Postgres or SQLite storage based on `DATABASE_URL`

### Environment Setup
- Node.js version 20.9.0 or higher is required
- PostgreSQL database required (configured via `DATABASE_URL`)
- Environment variables should be in `.env` or `.env.development`

## Architecture Overview

### Core Components

The project follows a modular Mastra architecture:

**Main Entry Point**: `src/mastra/index.ts` - Configures the Mastra instance with storage, workflows, agents, tools, and server settings.

**Storage Layer**: `src/mastra/storage/index.ts` - Shared PostgreSQL storage instance using `@mastra/pg`.

**Workflow System**: Located in `src/mastra/workflows/`
- `improvedEducationalContentWorkflow.ts` - Main workflow for educational content creation
- Workflows are registered with Inngest and can be scheduled via cron expressions

**Agent System**: Located in `src/mastra/agents/`
- `ideaGenerationAgent.ts` - Generates educational content ideas and outlines
- `writingAgent.ts` - Creates detailed written content
- `reviewAgent.ts` - Reviews and improves generated content

**Tool System**: Located in `src/mastra/tools/`
- `wikipediaResearchTool.ts` - Research tool for gathering information
- `webScrapingTool.ts` - Web scraping capabilities
- `pdfGenerationTool.ts` - PDF document generation
- `aiServiceTool.ts` - AI service integrations
- `chunkedContentGenerationTool.ts` - Large content generation in chunks
- `progressTrackingTool.ts` - Workflow progress tracking

**Triggers**: Located in `src/triggers/`
- `slackTriggers.ts` - Slack integration triggers
- `telegramTriggers.ts` - Telegram bot triggers

### Framework Constraints

**Important Limitations** (enforced by sanity checks in `src/mastra/index.ts`):
- Maximum 1 workflow allowed (UI limitation)
- Maximum 1 agent registered at a time (UI limitation)

### Inngest Integration

The project uses Inngest for workflow orchestration:
- Workflows are exposed via `/api/inngest` endpoint
- Supports real-time workflow monitoring
- Cron-based scheduling is configured for daily content generation
- Default schedule: 9 AM daily (configurable via `SCHEDULE_CRON_EXPRESSION` and `SCHEDULE_CRON_TIMEZONE`)

### MCP Server Integration

Tools are exposed via MCP (Model Context Protocol) servers:
- All tools are bundled under `allTools` MCP server
- Enables tool discovery and execution through standardized protocol

## Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (defaults to `postgresql://localhost:5432/mastra`)
- `NODE_ENV` - Environment setting (affects logging configuration)
- `PORT` - Server port (defaults to 5001)
- `SCHEDULE_CRON_EXPRESSION` - Cron expression for workflow scheduling (defaults to `0 9 * * *`)
- `SCHEDULE_CRON_TIMEZONE` - Timezone for cron scheduling (defaults to `America/Los_Angeles`)

### Bundler Configuration

The project includes specific bundler settings for external dependencies:
- External modules: `@slack/web-api`, `inngest`, `inngest/hono`, `hono`, `hono/streaming`
- Sourcemaps enabled for debugging

### TypeScript Configuration

- Target: ES2022
- Module system: ES2022 with bundler resolution
- Strict type checking enabled
- Source files in `src/` directory
- No emit (build handled by Mastra bundler)

## Development Workflow

### Adding New Tools
1. Create tool file in `src/mastra/tools/`
2. Import and register in `src/mastra/index.ts` under MCP server tools
3. Tools will be automatically available to agents and workflows

### Adding New Agents
1. Create agent file in `src/mastra/agents/`
2. Register in `src/mastra/index.ts` agents configuration
3. Note: Only one agent can be active due to UI constraints

### Adding New Workflows
1. Create workflow file in `src/mastra/workflows/`
2. Register in `src/mastra/index.ts` workflows configuration
3. Note: Only one workflow can be active due to UI constraints
4. For cron scheduling, use `registerCronWorkflow()` function

### Error Handling

The system includes comprehensive error handling:
- `MastraError` handling with non-retriable error conversion
- Zod validation errors are treated as non-retriable
- Production logging with structured JSON format
- Request/response logging middleware

### Database Integration

Uses PostgreSQL with `@mastra/pg` for:
- Workflow state persistence
- Agent memory storage
- Progress tracking
- Real-time updates via pub/sub channels