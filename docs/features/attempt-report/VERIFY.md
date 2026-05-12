# Attempt Report Verification

## Preconditions

- Run the app locally.
- Sign in as an administrator.
- Have at least one submitted assessment attempt.

## Smoke Check

- Open `/admin/attempts/<attemptId>`.
- Expected: page shows score, timing cards, answer table, `Проверка` controls for reviewable answers, and `Скачать MD`.
- Expected: there is no `Ai overview`, `AI-проверка`, or generation banner.
- Click `Скачать MD`.
- Expected: browser downloads a `.md` file without opening the print dialog.

## Positive Case

- Open the downloaded Markdown file.
- Expected: file contains `# Assessment Attempt Report`, candidate name, score, total time, and average question time.
- Expected: file contains `## Machine Summary JSON` and `## Questions`.
- Expected: Russian text is readable.
- For a SQL or open-text question with multiple submissions, expand `История отправок`.
- Expected: each submission is shown separately with its own ordinal number and payload.
- For an open/manual-review answer, click `Проверка`.
- Add note `Хорошее объяснение, зачесть` and click `Принять`.
- Expected: answer badge changes to `верно` and manual review badge changes to `Принято`.
- Download MD again.
- Expected: Markdown includes `#### Admin Review` for that answer.
- Expected: Markdown also contains `#### Submission History` for questions that were submitted more than once.

## Negative Cases

- Log out from admin.
- Open `/admin/attempts/<attemptId>/md`.
- Expected: user is redirected to admin sign-in or blocked by auth flow.
- Search the page for `Ai overview` or `AI-проверка`.
- Expected: no report AI controls are present.

## Regression Check

- Open the attempt details page after Markdown download.
- Expected: on-page report still renders normally.
- Expected: manual review remains editable after reloading the page.
