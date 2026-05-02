# Intern Candidate List

## Purpose

Show interns and newly issued token candidates in one admin list.

## Scope

- `/admin/interns` renders a single `Список стажёров` table.
- A candidate appears in the list immediately after token creation.
- New candidates are shown first by default.
- The main status column shows test status, not token status.
- Search updates automatically with a debounce as the admin types.
- The table is paginated by 10 rows.
- Each table column can be sorted by clicking its header.
- Clicking a row opens a modal with masked token history, attempts, results, and token action.
- New access tokens are created from the selected intern row modal.
- Newly created tokens are added to the open row modal immediately.
- Overdue in-progress attempts are expired before admin rows and modal data are built.
- Rows without attempts show `нет попыток` in the test status and latest attempt columns.
- The old separate `Последние токены` and `Профили стажёров` blocks are removed.

## Data Model

- `Invitation.inviteCodeMask` stores a non-sensitive token mask for admin lists.
- `Invitation.inviteCodeEncrypted` stores an encrypted token value for admin copy actions.
- Pending candidates are built from `Invitation.candidateName`.
- Existing interns are built from `InternProfile`.
- Token history for an intern is matched by current invitation, accepted profile, and full-name match.
- Token expiry is configured with `INTERN_INVITATION_EXPIRES_IN_DAYS`.
- Token encryption uses `INVITATION_TOKEN_ENCRYPTION_SECRET`.
- Token table status is a UI label: active for pending/accepted tokens, used for completed tokens, expired when `Invitation.expiresAt` is in the past, and revoked for revoked tokens.
- The current profile token is shown as used when it has a finished or expired attempt started after token creation.

## Main Flow

- Admin opens `/admin/interns`.
- Admin types in the search field and the list refreshes after a short pause.
- Admin reads current test status in the `Статус теста` column.
- Admin creates a token.
- The candidate appears in `Список стажёров`.
- Admin sorts or pages through the table when needed.
- Admin clicks the row.
- The modal shows masked access tokens and lets the admin copy available tokens.
- The token table shows token status as `активный`, `использован`, `просрочен`, or `отозван`.
- The modal lets the admin create another token.
- The new token value appears once and the token table prepends its mask.
- After the intern signs in, the modal also shows attempts and result links.
- If the latest attempt passed its deadline, the admin page marks it as expired and shows it as a result row.
- The related access token is shown as `использован`, not `активный`.

## Touched Files

- `app/admin/interns/page.tsx`
- `components/admin/intern-candidate-table.tsx`
- `components/admin/intern-search-form.tsx`
- `components/admin/retake-invitation-form.tsx`
- `src/actions/admin.ts`
- `src/actions/intern.ts`
- `src/lib/assessment.ts`
- `src/lib/security.ts`
- `messages/ru.json`
- `messages/uz.json`
- `prisma/schema.prisma`
- `.env.example`
- `app/globals.css`

## Constraints

- Token values are still only visible immediately after creation.
- Token tables show masks from `Invitation.inviteCodeMask`.
- Copy actions use decrypted `Invitation.inviteCodeEncrypted`; old tokens without encrypted values cannot be copied from the table.
- Pending candidates do not have attempts until first token login creates an intern profile.
- Token-only candidates can still receive another token from their row modal.
- Historical retake tokens are associated by name when no direct profile relation remains.
- The admin page keeps table navigation inside the card to avoid page-level vertical scrolling on desktop.
