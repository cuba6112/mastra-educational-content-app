# Mastra Educational Content App

An AI-driven educational content generator built with the Mastra framework, Inngest for workflows, and a Next.js frontend. The system orchestrates multiple agents and tools to research topics, draft long-form content, review results, track progress, and export polished PDFs.

## Prerequisites

- Node.js >= 20.9
- npm (ships with Node)
- Optional: PostgreSQL instance if you do not want to use the default local connection string `postgresql://localhost:5432/mastra`
- API access for OpenRouter or OpenAI (set `OPENROUTER_API_KEY` or `OPENAI_API_KEY`)

## Initial Setup

1. Install backend dependencies:
   ```bash
   npm install
   ```
2. Copy environment defaults and add API keys:
   ```bash
   cp .env.example .env
   # Edit .env and set OPENROUTER_API_KEY or OPENAI_API_KEY
   # Optionally set DATABASE_URL if you are not using the local PostgreSQL default
   ```
3. (Optional) Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Running the Backend

The backend exposes Mastra (port `5001`) and the Inngest real-time server (port `3000`). You can start both with the helper script:

```bash
./start-backend.sh
```

The script checks prerequisites, loads `.env`, starts `npm run dev` (Mastra), and launches Inngest via `./scripts/inngest.sh`.

To run the services manually instead:

```bash
# Terminal 1 – Mastra API (http://localhost:5001)
npm run dev

# Terminal 2 – Inngest dev server (http://localhost:3000)
./scripts/inngest.sh
```

### Useful Backend Commands

```bash
npm run check     # Typecheck with TypeScript
npm run build     # Production build of the Mastra bundle
npm run format    # Auto-format *.ts files with Prettier
```

## Running the Frontend

The Next.js app lives under `frontend/` and consumes the backend API. By default the client will call the same origin as the page is served from; supply `NEXT_PUBLIC_API_BASE_URL` when the API runs on another host/port.

```bash
cd frontend

# Use the backend on http://localhost:5001
export NEXT_PUBLIC_API_BASE_URL="http://localhost:5001"

npm run dev -- --port 4000   # serve frontend at http://localhost:4000
```

Visit `http://localhost:4000` in your browser to access the UI. Adjust the port if `4000` is in use.

### Frontend Commands

```bash
npm run lint   # ESLint (passes with the current TypeScript settings)
npm run build  # Production Next.js build
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `OPENROUTER_API_KEY` | API key for OpenRouter models. Required unless `OPENAI_API_KEY` is configured. Set this to default all agents/tools to OpenRouter. |
| `OPENAI_API_KEY` | API key for OpenAI-compatible providers (optional alternative to OpenRouter). Used only when `OPENROUTER_API_KEY` is not present. |
| `DATABASE_URL` | PostgreSQL connection string used by Mastra storage. Defaults to `postgresql://localhost:5432/mastra`. |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend-only. When set, overrides the backend origin used by the Next.js app. |
| `SCHEDULE_CRON_EXPRESSION` / `SCHEDULE_CRON_TIMEZONE` | Optional cron schedule overrides for the daily workflow trigger. |

## Model Providers

Agents and tools automatically use OpenRouter when `OPENROUTER_API_KEY` is present in `.env`. If that key is missing they fall back to `OPENAI_API_KEY` (when supplied) or error if neither credential is available. No extra configuration is required beyond exporting the desired key(s).

## Development Workflow

1. Start the backend (Mastra + Inngest).
2. Run the frontend dev server pointing to the backend API.
3. Kick off a workflow from the UI and monitor progress in real time.
4. Generated PDFs are written to `generated_books/`; workflow progress snapshots live under `workflow_progress/`.

## Troubleshooting

- **Missing API keys:** `start-backend.sh` will refuse to run without updating `.env`.
- **Port conflicts:** Mastra uses `5001`, Inngest `3000`, and the recommended frontend port is `4000`. Free the ports or change them as needed.
- **Progress stuck in "in progress":** Ensure the backend logs do not show failures; the workflow now records failures in the progress tracker.
