# Test Completion Verification

## Preconditions

- Run the app locally.
- Create or use an intern token with an active assessment.
- Start the assessment as the intern.

## Smoke Check

- Open the test page.
- Expected: `Завершить` is visible in the top-right header area near the timer.
- Expected: the question card footer only contains `Назад` and `Далее`.

## Positive Case

- Click `Завершить`.
- Expected: a confirmation dialog appears.
- Expected: the dialog says unanswered questions will be counted as fail.
- Click `Отмена`.
- Expected: the dialog closes and the test is still active.
- Click `Завершить` again, then click `Продолжить`.
- Expected: the attempt is submitted and the result flow opens.

## Negative Cases

- Start a test and wait for the timer to expire.
- Expected: the test submits automatically without waiting for confirmation.
- Start a test and close or hide the tab.
- Expected: the anti-cheat auto-submit path is not blocked by the confirmation dialog.

## Regression Check

- Navigate between questions with `Назад`, `Далее`, and the navigation dots.
- Expected: navigation still works and does not submit the attempt.
