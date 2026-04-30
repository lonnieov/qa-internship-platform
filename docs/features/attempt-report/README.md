# Attempt Report

## Purpose

Provide an admin-facing assessment report with a downloadable PDF file.

## Scope

- Admin attempt detail page shows candidate score, time summary, and answer timing.
- `GET /admin/attempts/<attemptId>/pdf` generates a PDF attachment.
- The PDF download uses server-side generation and does not open the browser print dialog.

## Main Flow

- Admin opens an attempt result page.
- Admin clicks `Скачать PDF`.
- Browser downloads a PDF file for the attempt.

## Touched Files

- `app/admin/attempts/[attemptId]/page.tsx`
- `app/admin/attempts/[attemptId]/pdf/route.ts`
- `components/admin/report-print-button.tsx`
- `src/lib/attempt-report-pdf.ts`
- `public/fonts/NotoSans-Regular.ttf`
- `package.json`

## Constraints

- PDF route requires an authenticated admin session.
- PDF contains text summary data, not a screenshot of the web page.
