# AI Overview

## Purpose

Generate an admin-facing Groq summary from the stored Markdown attempt report.

## Scope

- Attempt result page shows `Ai overview` next to `Скачать MD`.
- Admin clicks the button and sees an overlay with the Groq response.
- `POST /api/admin/attempts/<attemptId>/ai-overview` generates the overview.
- The API reuses the existing Markdown report generator as the source payload.

## Main Flow

- Admin opens an attempt report.
- Admin clicks `Ai overview`.
- Client sends a POST request to the AI overview API.
- Server generates the Markdown report and sends it to Groq.
- Overlay shows the full Groq overview text.

## Touched Files

- `app/[locale]/admin/attempts/[attemptId]/page.tsx`
- `app/api/admin/attempts/[attemptId]/ai-overview/route.ts`
- `components/admin/ai-overview-button.tsx`
- `src/lib/groq-overview.ts`
- `src/lib/groq-client.ts`
- `src/lib/attempt-report-md.ts`
- `messages/ru.json`
- `messages/uz.json`
- `app/globals.css`
- `.env.example`
- `README.md`

## Constraints

- API route requires an authenticated admin session.
- `GROQ_API_KEY` must be set on the server.
- Default model is `meta-llama/llama-4-scout-17b-16e-instruct`; override with `GROQ_MODEL`.
- The prompt instructs Groq to use only the Markdown report data.
