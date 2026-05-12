# QA Quiz Seed

## Purpose

Provide a larger default QA quiz bank for fresh installations and local demo data.

## Scope

- The seed data contains 50 QA quiz questions with four options each.
- Each question has exactly one correct answer.
- The existing API sandbox seed question remains after the quiz questions.

## Data Model

- No schema changes.
- Seeded quiz questions use `Question` with type `QUIZ`.
- Options use `QuestionOption` labels `A` through `D`.

## Main Flow

- Run `npm run db:seed` against an empty question table.
- `prisma/seed.ts` creates default tracks and admins.
- The seed creates the 50 QA quiz questions in order.
- The seed creates the QA API sandbox question after the quiz list.

## Touched Files

- `prisma/seed.ts`
- `docs/features/qa-quiz-seed/README.md`
- `docs/features/qa-quiz-seed/VERIFY.md`

## Constraints

- Current seed logic skips question creation when any question already exists.
- Existing databases may need a cleared question table to receive the new seed set.
- The seed content is Russian-language QA interview and testing basics.
