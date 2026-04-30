# Attempt Report Verification

## Preconditions

- Run the app locally.
- Sign in as an administrator.
- Have at least one submitted assessment attempt.

## Smoke Check

- Open `/admin/attempts/<attemptId>`.
- Click `Скачать PDF`.
- Expected: browser downloads a `.pdf` file without opening the print dialog.

## Positive Case

- Open the downloaded PDF.
- Expected: PDF contains candidate name, score, total time, average question time, and question answer rows.
- Expected: Russian text is readable.

## Negative Cases

- Log out from admin.
- Open `/admin/attempts/<attemptId>/pdf`.
- Expected: user is redirected to admin sign-in or blocked by auth flow.

## Regression Check

- Open the attempt details page after PDF download.
- Expected: on-page report still renders normally.
