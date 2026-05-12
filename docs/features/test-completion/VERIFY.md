# Test Completion Verification

## Preconditions

- Run the app locally.
- Create or use an intern token with an active assessment.
- Start the assessment as the intern.

## Smoke Check

- Open the test page.
- Expected: `Завершить` is visible in the top-right header area near the timer.
- Expected: before all questions are answered, the question card footer only contains `Назад` and `Далее`.

## Positive Case

- Click `Завершить`.
- Expected: a confirmation dialog appears.
- Expected: the dialog says unanswered questions will be counted as fail.
- Click `Отмена`.
- Expected: the dialog closes and the test is still active.
- Click `Завершить` again, then click `Продолжить`.
- Expected: the attempt is submitted and the result flow opens.
- Expected: the result page shows a short colorful confetti burst across the screen.
- Start another attempt.
- Answer every question and navigate to the last question.
- Expected: an additional `Завершить` button appears on the right side of the question card footer.
- Click the footer `Завершить`.
- Expected: the same confirmation dialog opens.
- Submit the attempt.
- Expected: the same confetti burst plays after redirecting to the result page.

## Negative Cases

- Start a test and wait for the timer to expire.
- Expected: the test submits automatically without waiting for confirmation.
- Start a test and close or hide the tab.
- Expected: the anti-cheat auto-submit path is not blocked by the confirmation dialog.

## Regression Check

- Navigate between questions with `Назад`, `Далее`, and the navigation dots.
- Expected: navigation still works and does not submit the attempt.
- Enable reduced motion in the browser or OS accessibility settings and open the result page.
- Expected: the result content still renders, and the confetti animation is not shown.
