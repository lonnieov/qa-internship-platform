# Attempt Report

## Purpose

Provide an admin-facing assessment report with a downloadable Markdown file optimized for LLM analysis.

## Scope

- Admin attempt detail page shows candidate score, time summary, and answer timing.
- `GET /admin/attempts/<attemptId>/md` generates a Markdown attachment.
- The Markdown report includes metadata, machine summary JSON, per-question answers, timings, comments, sandbox payloads, Manual QA reports, and admin manual review data.
- For `SQL_SANDBOX`, the attempt page and Markdown report show the saved SQL query, result table, or execution error.
- If a question was submitted multiple times, the attempt page and Markdown report show a separate submission history without replacing the compact top-level row.
- Reviewable answers show manual review controls on the attempt page.
- Report page does not generate AI overview or per-answer AI reviews.

## Main Flow

- Admin opens an attempt result page.
- Admin clicks `Скачать MD`.
- Browser downloads a `.md` file for the attempt.
- The file can be pasted or uploaded into an external AI agent without extra cleanup.
- For open/manual-review answers, admin opens `Проверка`.
- Admin accepts or rejects the answer and can add a review note.

## Touched Files

- `app/[locale]/admin/attempts/[attemptId]/page.tsx`
- `app/[locale]/admin/attempts/[attemptId]/md/route.ts`
- `components/admin/report-download-button.tsx`
- `components/admin/answer-review-form.tsx`
- `src/lib/attempt-report-md.ts`
- `messages/ru.json`
- `messages/uz.json`
- `app/globals.css`

## Constraints

- Markdown route requires an authenticated admin session.
- Markdown is generated from stored attempt data, not from a page screenshot.
- Report schema is declared as `assessment_attempt_markdown_v1`.
- Report AI features are intentionally absent from the app; use the downloaded Markdown with an external AI agent if AI analysis is needed.
- Existing stored `apiResponse.aiReview` data is ignored by the page and Markdown export.
