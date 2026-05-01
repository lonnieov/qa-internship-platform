# Manual QA Sandbox

## Purpose

Adds an admin workflow for creating manual functional QA tasks based on a mobile/webview miniapp preset.

## Scope

- Admin question bank has a `Manual QA` section.
- Admin can create and edit `MANUAL_QA_SANDBOX` questions.
- Manual QA config stores scenario title, mission, preset id, viewport, time hint, bug categories, and known bugs rubric.
- Intern test runner renders the selected miniapp preset and a bug-report form.
- Presets include `ClickSuperApp / ClickAvto` and `ClickSuperApp / Рассрочка`.
- Manual QA test pages use an expanded work area and compact preset styling so embedded mobile screens fit inside the assessment viewport.
- Intern bug reports are saved and shown in the admin attempt report and PDF.
- Manual QA questions are excluded from automatic score calculation.

## Data Model

- `prisma/schema.prisma` adds `MANUAL_QA_SANDBOX` to `QuestionType`.
- `Question.apiConfig` stores `mode: "MANUAL_QA_SANDBOX"` and preset metadata.
- `AssessmentAnswer.apiRequest` stores `mode`, `reports`, and `noBugsFound`.
- `AssessmentAnswer.apiResponse` stores `reportCount`, `matchedKnownBugIds`, and `unmatchedReportCount`.

## Main Flow

- Admin opens `app/admin/questions/page.tsx`.
- Admin selects the `Manual QA` section.
- Admin clicks `Добавить`.
- Admin selects a Manual QA preset and reviews the generated mission and rubric.
- Admin saves the question.
- The question appears in the Manual QA list with preset, viewport, and known bug count.
- Intern starts an attempt and opens the Manual QA question.
- Intern interacts with the embedded miniapp and adds bug reports.
- Admin opens the attempt report and reviews submitted reports manually.

## Touched Files

- `prisma/schema.prisma`
- `src/generated/prisma/*`
- `src/actions/admin.ts`
- `src/actions/intern.ts`
- `src/lib/manual-qa-sandbox.ts`
- `src/lib/assessment.ts`
- `src/lib/attempt-report-pdf.ts`
- `src/lib/question-order.ts`
- `app/admin/questions/page.tsx`
- `components/admin/question-form.tsx`
- `components/admin/question-create-modal.tsx`
- `components/intern/manual-qa-presets/click-super-app-click-avto.tsx`
- `components/intern/manual-qa-presets/click-super-app-installment-widget.tsx`
- `components/intern/test-runner.tsx`
- `app/globals.css`
- `app/admin/attempts/[attemptId]/page.tsx`

## Constraints

- This flow supports interactive presets listed in `manualQaPresetOptions`.
- Bug reports are saved as structured JSON and require manual review.
- Manual QA questions do not affect automatic score until review workflow exists.
