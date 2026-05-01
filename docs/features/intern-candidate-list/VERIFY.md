# Intern Candidate List Verification

## Preconditions

- Run the app locally.
- Sign in as admin.

## Smoke Check

- Open `/admin/interns`.
- Expected: there is one `Список стажёров` table.
- Expected: separate `Последние токены` and `Профили стажёров` cards are not shown.

## Positive Case

- Click `Создать стажёра`.
- Enter `Алина Каримова` and submit.
- Expected: `Алина Каримова` appears in `Список стажёров` after the page refreshes.
- Click the `Алина Каримова` row.
- Expected: a modal opens with the token listed in `Токены доступа`.
- Expected: the token table shows a masked token value, not the full token.
- Expected: hovering a new encrypted token mask reveals the full token.
- Click `Создать токен` in the same modal.
- Expected: another copyable token is created for `Алина Каримова`.
- Expected: the new token mask is added to the token table without closing the modal.
- Click the revealed token.
- Expected: the full token is copied to the clipboard.
- Open a legacy token row without encrypted value.
- Expected: the mask stays hidden and indicates that the full value is unavailable.
- Sign in as the intern with the created token and start or finish a test.
- Return to `/admin/interns`, click the same row.
- Expected: the modal shows attempts and result links when results exist.

## Negative Cases

- Open a row for a candidate who has not signed in yet.
- Expected: the modal explains that the profile has not been created and still allows creating another token.
- Revoke a pending token from the row modal.
- Expected: the token status changes to `REVOKED` after refresh.

## Regression Check

- Search by `Алина`.
- Expected: matching token-only candidates and intern profiles remain visible.
- Open a completed intern row and click `Создать токен`.
- Expected: a new access token is issued from the row modal.
