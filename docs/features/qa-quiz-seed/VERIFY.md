# QA Quiz Seed Verification

## Preconditions

- Use a local database where the `Question` table is empty.
- Run `npm run db:push` if the schema has not been applied.
- Run `npm run db:seed`.
- Start the app and sign in as an admin.

## Smoke Check

- Open `/admin/questions?type=QUIZ&track=qa`.
- Expected: the QA quiz list contains 50 quiz questions.
- Expected: the first quiz question is `Что в первую очередь является целью smoke-тестирования?`.
- Expected: the last quiz question is `Что наиболее важно для QA Intern на собеседовании?`.

## Positive Case

- Open the first quiz question in the admin list.
- Expected: it has four options, and option `B` is marked correct.
- Open the question `Какой формат данных чаще всего используется в REST API?`.
- Expected: it has four options, and option `C` / `JSON` is marked correct.
- Start a QA intern attempt.
- Expected: the test runner includes the seeded QA quiz questions in order before the API sandbox question.

## Negative Cases

- Run `npm run db:seed` when the database already has at least one question.
- Expected: the seed completes without adding another copy of the 50 quiz questions.

## Regression Check

- Open `/admin/questions?type=API_SANDBOX&track=qa`.
- Expected: the seeded API sandbox question is still present.
- Start an intern attempt and answer any quiz question.
- Expected: answer selection and scoring still work.
