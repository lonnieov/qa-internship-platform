# Question Editing

## Purpose

Allow admins to update existing assessment questions without deleting and recreating them.

## Scope

- Existing questions show a `Редактировать` panel in the admin question bank.
- Quiz questions can update text, explanation, four answer options, and the correct option.
- API Sandbox questions can update request expectations and response payload.
- DevTools Sandbox questions can update request settings, response payload, answer path, and expected answer.

## Data Model

- `Question.text`, `Question.explanation`, and `Question.apiConfig` can be updated.
- Existing `QuestionOption` rows are updated in place for quiz questions.
- No schema changes were made.

## Main Flow

- Admin opens `Банк вопросов`.
- Admin expands `Редактировать` on an existing question.
- Admin changes fields and submits `Сохранить изменения`.
- The question bank refreshes with the updated values.

## Touched Files

- `src/actions/admin.ts`
- `components/admin/question-form.tsx`
- `app/admin/questions/page.tsx`
- `app/globals.css`

## Constraints

- Editing keeps the original question type.
- Invalid JSON in API fields cancels the update.
- Historical attempts keep their existing stored answer data.
