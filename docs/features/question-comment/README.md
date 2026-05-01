# Question Comment

## Purpose

Allow interns to leave a reviewer-facing comment on any question before the test is submitted.

## Scope

- Intern test header opens a comment dialog instead of local-only flagging.
- Comments are saved per question and can be edited while the attempt is in progress.
- Admin attempt report and PDF include the intern comment under the matching question.

## Data Model

- `AssessmentAnswer.apiRequest.internComment` stores the trimmed comment text.
- Existing API, DevTools, open quiz, and Manual QA payloads keep their current fields and add `internComment` when present.
- Empty comments remove `internComment` from the stored JSON payload.

## Main Flow

- Intern clicks `Комментировать` or `Комментарий`.
- Intern writes context for the reviewer and clicks `Сохранить`.
- The question navigator marks questions that have a saved or draft comment.
- Admin opens the attempt report and sees `Комментарий стажёра` in the question block.

## Touched Files

- `components/intern/test-runner.tsx`
- `app/intern/test/page.tsx`
- `app/admin/attempts/[attemptId]/page.tsx`
- `src/actions/intern.ts`
- `src/lib/answer-comment.ts`
- `src/lib/attempt-report-pdf.ts`
- `app/globals.css`

## Constraints

- Comments are editable only while the attempt is `IN_PROGRESS`.
- Maximum stored comment length is 1000 characters.
- Comments do not affect scoring or answered progress.

