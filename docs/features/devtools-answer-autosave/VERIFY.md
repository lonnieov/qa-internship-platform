# DevTools Answer Autosave Verification

## Preconditions

- Run the app locally.
- Have an intern attempt with a DevTools Sandbox question.

## Smoke Check

- Start an intern test and open a DevTools question.
- Expected: no `Проверить ответ` button is visible.

## Positive Case

- Click the DevTools request button.
- Enter any value into the answer field.
- Wait one second.
- Expected: UI shows a neutral saved/autosave status.
- Refresh or navigate away and back.
- Expected: the typed value remains in the field.

## Negative Cases

- Enter an incorrect value.
- Expected: the UI does not show `ответ не совпал`, `зачтено`, or any correctness hint.

## Regression Check

- Finish the attempt.
- Expected: final result and admin report still include the DevTools answer outcome.
