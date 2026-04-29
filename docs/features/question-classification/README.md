# Question Classification

## Purpose

Bring the question bank and intern test UI closer to the reference project while preserving token-based intern access.

## Scope

- Questions have a visible track chip: `QA`, `API`, `gRPC`, `Mobile`, or `Web`.
- Admins can filter the question bank by track and type.
- Question creation opens from a section-level modal and includes a track selector.
- Question editing stays inline inside each existing question card.
- Interns see track/type chips, richer answer cards, a progress bar, question flags, and a legend in navigation.
- Passing score UI and score-based pass/fail summaries are removed from the product flow.

## Data Model

- `Question.track` stores the classification chip value.
- Existing questions default to `QA`.
- `AssessmentSettings.passingScore` remains as a legacy schema field for compatibility, but it is not used by the app flow.

## Main Flow

1. Admin opens `app/admin/questions/page.tsx`.
2. Admin selects a track in the left rail or switches question type tabs.
3. Admin clicks `Добавить` in the active section to open the creation modal.
4. Admin creates or edits a question and chooses the classification.
5. Intern starts the token-based test and navigates questions with answer state and local flags.
6. Final result is still calculated as percentage of correct answers.

## Touched Files

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/question-classification.ts`
- `src/lib/prisma.ts`
- `src/actions/admin.ts`
- `src/lib/assessment.ts`
- `app/admin/questions/page.tsx`
- `components/admin/question-create-modal.tsx`
- `app/admin/page.tsx`
- `app/admin/settings/page.tsx`
- `app/intern/test/page.tsx`
- `components/admin/question-form.tsx`
- `components/intern/test-runner.tsx`
- `app/globals.css`

## Constraints

- Intern authentication remains token-based.
- Heat map tracking from the reference project is not added.
- Question flags in the intern UI are local helper state and are not persisted.
