# AI Answer Review Verification

## Preconditions

- Run the app locally.
- Sign in as an administrator.
- Set `GROQ_API_KEY` in `.env`.
- Have a submitted attempt with at least one open quiz, Manual QA, or Autotest answer.

## Smoke Check

- Open `/ru/admin/attempts/<attemptId>`.
- Expected: a Groq generation banner appears if reviewable answers are missing AI reviews.
- Wait until the page refreshes.
- Expected: each reviewable answer row shows a compact `Проверка` disclosure control with an arrow.
- Click the disclosure control.
- Expected: the horizontal `AI-проверка` and manual review row opens under the related question and is labeled with the question number.

## Positive Case

- Open an attempt with an open quiz answer.
- Expected: AI review mentions the task, answer quality, verdict, score, and recommendation.
- Open an attempt with Manual QA or Autotest.
- Expected: AI review is based on mission/rubric and submitted reports or pseudocode.
- Use the manual review form.
- Expected: admin can still accept or reject independently of AI verdict.

## Negative Cases

- Remove `GROQ_API_KEY`.
- Open the attempt report.
- Expected: the loader shows a clear configuration error and the report still renders.

- Open an attempt without reviewable answers.
- Expected: no AI review generation banner appears.

## Regression Check

- Download the MD report.
- Expected: AI review and admin review are included in the relevant answer sections after generation.
- Open closed quiz, API sandbox, DevTools, and SQL answers.
- Expected: they do not show AI review cards.
