# Question Editing

## Purpose

Allow admins to update existing assessment questions without deleting and recreating them.

## Scope

- Existing questions show a `Редактировать` panel in the admin question bank.
- Quiz questions can be either multiple choice or open-answer.
- Quiz questions can update text, explanation, four answer options, the correct option, or the expected open answer.
- API Sandbox questions can update request expectations and response payload.
- DevTools Sandbox questions can update request settings, response payload, answer path, and expected answer.
- New questions show a transient success popup after creation.
- JSON body fields use syntax highlighting and disable spellcheck noise.

## Data Model

- `Question.text`, `Question.explanation`, and `Question.apiConfig` can be updated.
- Existing `QuestionOption` rows are updated in place for quiz questions.
- Open quiz questions store expected-answer metadata inside `Question.apiConfig`.
- No schema changes were made.

## Main Flow

- Admin opens `Банк вопросов`.
- Admin selects a question type chip and optionally a track.
- Admin can create a new question and gets a success popup after submit.
- Admin expands `Редактировать` on an existing question.
- Admin changes fields, including switching a quiz between choice and open-answer mode, and submits `Сохранить изменения`.
- The question bank refreshes with the updated values.

## Touched Files

- `src/actions/admin.ts`
- `components/admin/json-editor.tsx`
- `components/admin/question-form.tsx`
- `components/admin/question-created-toast.tsx`
- `app/admin/questions/page.tsx`
- `app/globals.css`
- `src/lib/open-quiz.ts`

## Constraints

- Editing keeps the original question type.
- Open-answer quiz validation uses a normalized text comparison.
- Invalid JSON in API fields cancels the update.
- Historical attempts keep their existing stored answer data.
