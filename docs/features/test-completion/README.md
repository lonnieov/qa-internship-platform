# Test Completion

## Purpose

Protect interns from accidentally finishing an assessment before they are ready.

## Scope

- The manual finish control is placed in the test header, away from question navigation.
- A visible info bubble warns that unanswered questions count as fail.
- Manual finish opens a confirmation dialog before submitting the attempt.
- Automatic finish by timer, tab close, or hidden tab still submits immediately.

## Main Flow

- Intern starts an active attempt.
- Intern answers questions and navigates with `Назад` and `Далее`.
- Intern clicks `Завершить` in the header.
- The confirmation dialog explains the result of submitting.
- `Продолжить` submits the attempt.
- `Отмена` closes the dialog and keeps the attempt active.

## Touched Files

- `components/intern/test-runner.tsx`
- `app/globals.css`

## Constraints

- The confirmation only applies to manual finish.
- Auto-submit paths must not wait for a dialog.
- Unanswered questions remain scored as fail by the existing submit flow.
