# Attempt Report

## Purpose

Provide an admin-facing assessment report with a downloadable Markdown file optimized for LLM analysis.

## Scope

- Admin attempt detail page shows candidate score, time summary, and answer timing.
- `GET /admin/attempts/<attemptId>/md` generates a Markdown attachment.
- The Markdown report includes metadata, machine summary JSON, per-question answers, timings, comments, sandbox payloads, and Manual QA reports.
- Admin can generate an AI overview from the same Markdown report through Groq.
- Reviewable answers can show Groq AI reviews next to manual review controls.

## Main Flow

- Admin opens an attempt result page.
- Admin clicks `Скачать MD`.
- Browser downloads a `.md` file for the attempt.
- The file can be pasted or uploaded into an LLM without extra cleanup.
- Admin clicks `Ai overview` to see a Groq-generated summary in an overlay.
- On open quiz, Manual QA, and Autotest answers, the report page shows cached or generated AI review cards.

## Touched Files

- `app/admin/attempts/[attemptId]/page.tsx`
- `app/admin/attempts/[attemptId]/md/route.ts`
- `components/admin/report-download-button.tsx`
- `components/admin/ai-overview-button.tsx`
- `components/admin/answer-ai-review-card.tsx`
- `components/admin/attempt-ai-reviews-loader.tsx`
- `src/lib/attempt-report-md.ts`
- `src/lib/groq-overview.ts`
- `src/lib/ai-answer-review.ts`
- `src/lib/groq-client.ts`
- `package.json`
- `package-lock.json`

## Constraints

- Markdown route requires an authenticated admin session.
- Markdown is generated from stored attempt data, not from a page screenshot.
- Report schema is declared as `assessment_attempt_markdown_v1`.
- AI overview requires `GROQ_API_KEY`.
- Per-answer AI reviews are advisory; admin manual review remains final.
