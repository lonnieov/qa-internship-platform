# Assessment Retakes Verification

## Preconditions

- Run the app locally.
- Sign in as admin.
- Have an intern who already finished at least one assessment.

## Smoke Check

- Open `Админка -> Стажёры и доступы`.
- Expected: each intern row has a `Перепройти` action.

## Positive Case

- Click `Перепройти` for a completed intern.
- Expected: a new token appears under the button.
- Sign in as the intern with the new token.
- Expected: the intern lands back in the assessment flow instead of the old result screen.
- Finish the new attempt.
- Expected: the admin can still open the old result, and a new latest result is also available.

## Negative Cases

- Try `Перепройти` for an intern with an active unfinished attempt.
- Expected: no token is issued and an explanatory message is shown.
- Try to sign in with an old already completed token after a retake token was issued.
- Expected: access is denied.
- Try to start a second test with the same token after its previous attempt expired.
- Expected: the app opens the existing result flow and does not create another attempt.

## Regression Check

- Create a brand-new token from `Выдать доступ стажёру`.
- Expected: the initial token flow still works.
- Open an old attempt report after issuing a retake token.
- Expected: the old report content is unchanged.
