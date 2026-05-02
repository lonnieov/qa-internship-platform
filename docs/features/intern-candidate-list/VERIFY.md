# Intern Candidate List Verification

## Preconditions

- Run the app locally.
- Sign in as admin.

## Smoke Check

- Open `/admin/interns`.
- Expected: there is one `Список стажёров` table.
- Expected: the main table has `Статус теста`, not `Доступ`, as the test status column.
- Expected: separate `Последние токены` and `Профили стажёров` cards are not shown.
- Expected: the first page shows no more than 10 rows.
- Expected: the page itself does not get a vertical scrollbar on a desktop viewport.

## Positive Case

- Click `Создать стажёра`.
- Enter `Алина Каримова` and submit.
- Expected: `Алина Каримова` appears in `Список стажёров` after the page refreshes.
- Expected: the new candidate appears near the top before older candidates.
- Expected: the main row shows `нет попыток` for test status and latest attempt.
- Click the `Алина Каримова` row.
- Expected: a modal opens with the token listed in `Токены доступа`.
- Expected: the token table shows a masked token value, not the full token.
- Expected: a fresh token status is `активный`.
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
- Start a test with a short time limit and wait until the deadline passes.
- Return to `/admin/interns`, click the same intern row.
- Expected: the attempt status is `истекла`, the completion time is filled, and the result link is available.
- Expected: the token used for that attempt has status `использован`, not `активный`.
- Try to sign in again with the same token.
- Expected: sign-in is rejected with `Тест по этому токену уже завершён.`

## Negative Cases

- Open a row for a candidate who has not signed in yet.
- Expected: the modal explains that the profile has not been created and still allows creating another token.
- Revoke a pending token from the row modal.
- Expected: the token status changes to `отозван` after refresh.
- Open a token whose expiry date has passed.
- Expected: the token status is `просрочен`.

## Regression Check

- Search by `Алина`.
- Expected: results update automatically after typing pauses, without clicking a search button.
- Expected: matching token-only candidates and intern profiles remain visible.
- Search for `zzzz-no-match`.
- Expected: the empty state is centered and compact, with clear reset guidance.
- Click each column header: `Стажёр`, `Статус теста`, `Последняя попытка`, `Результат`.
- Expected: rows reorder by the clicked column and the sort indicator changes direction when clicked again.
- If more than 10 rows exist, click `Вперёд`.
- Expected: the next 10 rows are shown and `Назад` returns to the previous page.
- Open a completed intern row and click `Создать токен`.
- Expected: a new access token is issued from the row modal.
- Open an intern row whose latest attempt expired before refresh and click `Создать токен`.
- Expected: the new token is created instead of being blocked by the old in-progress attempt.
