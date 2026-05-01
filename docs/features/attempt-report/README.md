# Attempt Report

## Purpose

Provide an admin-facing assessment report with a downloadable Markdown file optimized for LLM analysis.

## Scope

- Admin attempt detail page shows candidate score, time summary, and answer timing.
- `GET /admin/attempts/<attemptId>/md` generates a Markdown attachment.
- The Markdown report includes metadata, machine summary JSON, per-question answers, timings, comments, sandbox payloads, and Manual QA reports.

## Main Flow

- Admin opens an attempt result page.
- Admin clicks `Скачать MD`.
- Browser downloads a `.md` file for the attempt.
- The file can be pasted or uploaded into an LLM without extra cleanup.

## Touched Files

- `app/admin/attempts/[attemptId]/page.tsx`
- `app/admin/attempts/[attemptId]/md/route.ts`
- `components/admin/report-download-button.tsx`
- `src/lib/attempt-report-md.ts`
- `package.json`
- `package-lock.json`

## Constraints

- Markdown route requires an authenticated admin session.
- Markdown is generated from stored attempt data, not from a page screenshot.
- Report schema is declared as `assessment_attempt_markdown_v1`.
