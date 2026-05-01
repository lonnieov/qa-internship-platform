# Token Creation Modal Verification

## Preconditions

- Run the app locally.
- Sign in as admin.

## Smoke Check

- Open `/admin/interns`.
- Expected: the page header has a `Создать токен` button.
- Expected: the old always-visible `Выдать доступ стажёру` form is not shown on the page.
- Click `Создать токен`.
- Expected: a centered modal opens with candidate name and expiration fields.

## Positive Case

- In the modal, enter `Алина Каримова` as the candidate name.
- Leave expiration as `14`.
- Click `Создать токен`.
- Expected: the modal shows a success message and a copyable token.
- Close the modal.
- Expected: the page is usable and the latest token list remains visible.

## Negative Cases

- Open the modal and submit an empty candidate name.
- Expected: validation message is shown in the modal and no token is displayed.
- Open the modal and click outside it or the close button.
- Expected: the modal closes without changing the token list.

## Regression Check

- Reopen `/admin/interns`.
- Expected: latest token revocation still works for pending tokens.
- Use the created token on the intern sign-in page.
- Expected: intern token login still follows the existing flow.
