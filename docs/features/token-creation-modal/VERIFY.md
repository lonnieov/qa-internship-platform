# Token Creation Modal Verification

## Preconditions

- Run the app locally.
- Sign in as admin.

## Smoke Check

- Open `/admin/interns`.
- Expected: the page header has a `Создать стажёра` button.
- Expected: the old always-visible `Выдать доступ стажёру` form is not shown on the page.
- Click `Создать стажёра`.
- Expected: a centered modal opens with the candidate name field only.
- Expected: the modal text explains that a token is issued immediately after intern creation.

## Positive Case

- In the modal, enter `Алина Каримова` as the candidate name.
- Click `Создать стажёра`.
- Expected: the modal shows a success message and a copyable token.
- Close the modal.
- Expected: the candidate appears in `Список стажёров`.
- Open the candidate row.
- Expected: the token appears in the table as a masked value.
- Expected: hovering the token mask reveals the full token.

## Negative Cases

- Open the modal and submit an empty candidate name.
- Expected: validation message is shown in the modal and no token is displayed.
- Open the modal and click outside it or the close button.
- Expected: the modal closes without changing the token list.

## Regression Check

- Reopen `/admin/interns`.
- Expected: pending token revocation still works from the candidate row modal.
- Use the created token on the intern sign-in page.
- Expected: intern token login still follows the existing flow.
