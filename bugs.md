# Bug Findings

> All issues below have been addressed in this pass.

## Slack webhook crashes when channel metadata is unavailable
- **Location:** `src/triggers/slackTriggers.ts:293`
- **Impact:** Fatal runtime error for some incoming Slack events.
- **Details:** When `conversations.info` fails (common for private channels or insufficient scopes), `payload.channel` stays undefined. The subsequent call to `payload.channel.name` throws `Cannot read properties of undefined`, causing the webhook to respond 500 and dropping the event. The catch block only logs the metadata fetch failure, so the runtime error is unavoidable.
- **Fix idea:** Guard the access (`payload.channel?.name ?? payload.event?.channel`) or bail out early when channel info cannot be retrieved.
- **Status:** Guarded the handler to fall back to the channel ID and skip reaction updates when Slack omits channel metadata.

## Telegram webhook assumes message payloads always include `message`
- **Location:** `src/triggers/telegramTriggers.ts:29-33`
- **Impact:** Fatal runtime error for any Telegram update that is not a plain text message.
- **Details:** The handler blindly dereferences `payload.message.from.username` and `payload.message.text`. Telegram sends many other update types (`edited_message`, `callback_query`, etc.) which omit the `message` object. Receiving one of those updates crashes the webhook and returns a 500 response.
- **Fix idea:** Validate that `payload.message` and its nested fields exist before accessing them, or ignore unsupported update types.
- **Status:** Added validation to ignore unsupported Telegram updates before invoking the handler.

## Frontend hard-codes the backend to `http://localhost:5001`
- **Location:** `frontend/src/app/page.tsx:24-47` and `frontend/src/components/WorkflowProgress.tsx:37-69`
- **Impact:** Frontend fails outside local development; CORS/network errors in production.
- **Details:** Both the submit handler and the polling logic issue `fetch` calls to `http://localhost:5001`. When the UI is deployed anywhere else (e.g. production domain), those requests target the user's machine instead of the actual API and immediately fail. This breaks workflow execution and progress polling in every non-local environment.
- **Fix idea:** Read the base URL from configuration (env variable or relative path) rather than hard-coding localhost.
- **Status:** Frontend now builds URLs via `apiUrl`, which respects `NEXT_PUBLIC_API_BASE_URL` and defaults to same-origin.

## Progress tracker never flips runs to `failed` on generation errors
- **Location:** `src/mastra/workflows/improvedEducationalContentWorkflow.ts:248-269`
- **Impact:** Progress files report `status: "in_progress"` even after the workflow aborts on a section error.
- **Details:** When a chapter section fails to generate, the workflow catches the error only to attach an `action: 'update'` entry before rethrowing. Because the `fail` action is never invoked, `progress.status` stays `"in_progress"`. Downstream consumers of the progress file (UI, monitoring) continue to show an active run instead of a failed one.
- **Fix idea:** Call `progressTrackingTool` with `action: 'fail'` before rethrowing so the persisted status matches the actual workflow outcome.
- **Status:** Section failures now explicitly mark the workflow as failed before propagating the error.
