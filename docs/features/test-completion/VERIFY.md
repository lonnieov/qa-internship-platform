# Test Completion Verification

## Preconditions

- Run the app locally.
- Create or use an intern token with an active assessment.
- Start the assessment as the intern.

## Smoke Check

- Open the test page.
- Expected: `Завершить` is visible in the navigation card near the timer.
- Expected: the question card footer contains `Назад` and `Далее`.
- Press `Tab` through question controls.
- Expected: each focused button or field has a visible focus outline.

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
- Open an open-answer, API, SQL, Manual QA, or Autotest question if available.
- Click the visible field label.
- Expected: focus moves to the related input, textarea, or select.

## Negative Cases

- Start a test and wait for the timer to expire.
- Expected: the test submits automatically without waiting for confirmation.
- Start a test in a browser or device where the local clock is moved forward before opening the first question.
- Expected: the first question remains open and the attempt is not marked `AUTO_SUBMITTED` before the server deadline.
- Start a test and close or hide the tab.
- Expected: the anti-cheat auto-submit path is not blocked by the confirmation dialog.

## Regression Check

- Navigate between questions with `Назад`, `Далее`, and the navigation dots.
- Expected: navigation still works and does not submit the attempt.
- Use a keyboard to navigate the numbered question dots.
- Expected: the active question is announced as the current step and Enter opens
  the selected question.
- Enable reduced motion in the browser or OS accessibility settings and open the result page.
- Expected: the result content still renders, and the confetti animation is not shown.
