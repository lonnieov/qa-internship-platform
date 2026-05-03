# Attempt Report Verification

## Preconditions

- Run the app locally.
- Sign in as an administrator.
- Have at least one submitted assessment attempt.

## Smoke Check

- Open `/admin/attempts/<attemptId>`.
- Click `Скачать MD`.
- Expected: browser downloads a `.md` file without opening the print dialog.

## Positive Case

- Open the downloaded Markdown file.
- Expected: file contains `# Assessment Attempt Report`, candidate name, score, total time, and average question time.
- Expected: file contains `## Machine Summary JSON` and `## Questions`.
- Expected: Russian text is readable.
- Click `Ai overview`.
- Expected: overlay opens and shows a Groq-generated summary when `GROQ_API_KEY` is configured.
- For open quiz, Manual QA, or Autotest answers, wait for `AI-проверка` cards.
- Expected: each reviewable answer shows AI verdict, score, summary, and recommendation.

## Negative Cases

- Log out from admin.
- Open `/admin/attempts/<attemptId>/md`.
- Expected: user is redirected to admin sign-in or blocked by auth flow.

## Regression Check

- Open the attempt details page after Markdown download.
- Expected: on-page report still renders normally.
