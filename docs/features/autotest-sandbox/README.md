# Autotest Sandbox

## Purpose

Provide an intern question type for writing pseudocode autotests against mobile miniapp scenarios.

## Scope

- Admin can create and edit `AUTOTEST_SANDBOX` questions.
- Intern test runner shows available methods, task mission, an example structure block, and a pseudocode editor.
- The example structure block stays visible while the intern types.
- The example structure block contains only abstract placeholders.
- Intern answer is saved as pseudocode and checked against required scenario keywords.
- Admin attempt report can review the saved pseudocode and manual outcome.

## Data Model

- `Question.type` includes `AUTOTEST_SANDBOX`.
- `Question.apiConfig` stores `mode`, preset id, mission, available methods, expected scenarios, and optional `exampleCode`.
- `AssessmentAnswer.apiRequest` stores `mode` and submitted `code`.
- `AssessmentAnswer.apiResponse` stores matched scenario summary.

## Main Flow

- Admin opens `app/[locale]/admin/questions/page.tsx`.
- Admin selects the Autotest question type.
- Admin creates a task from an autotest preset.
- Intern opens the test and navigates to the Autotest question.
- Intern reads available methods and the example structure.
- Example structure shows neutral placeholders such as `Название сценария`, `Экран`, `Элемент`, and `Результат`.
- Intern writes pseudocode in the editor.
- Example structure remains visible above the editor.
- Intern saves the answer.

## Touched Files

- `components/intern/test-runner.tsx`
- `src/lib/autotest-sandbox.ts`
- `src/actions/admin.ts`
- `src/actions/intern.ts`
- `components/admin/question-form.tsx`
- `app/[locale]/admin/questions/page.tsx`

## Constraints

- Autotest answers are pseudocode, not executed code.
- Keyword matching is rubric-style and does not replace manual review.
- The example block depends on `Question.apiConfig.exampleCode`.
