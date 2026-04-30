# DevTools Answer Autosave

## Purpose

Prevent interns from seeing whether a DevTools answer is correct during the test.

## Scope

- Removes the manual `Проверить ответ` button from DevTools questions.
- Saves the DevTools answer automatically after typing.
- Keeps server-side correctness calculation for final result and admin reports.

## Data Model

- Uses existing `AssessmentAnswer.apiRequest`, `apiResponse`, `isCorrect`, `answeredAt`, and `submissionCount`.
- No schema changes were made.

## Main Flow

- Intern opens a DevTools question.
- Intern sends the request and inspects Network in DevTools.
- Intern types the requested response value into the answer field.
- The answer autosaves without showing correctness feedback.

## Touched Files

- `components/intern/test-runner.tsx`
- `src/actions/intern.ts`
- `docs/features/devtools-answer-autosave/README.md`
- `docs/features/devtools-answer-autosave/VERIFY.md`

## Constraints

- The UI may show that an answer was saved, but must not show whether it is correct.
- Final scoring still uses the stored server-side correctness value.
