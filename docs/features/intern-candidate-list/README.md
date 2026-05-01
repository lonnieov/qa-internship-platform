# Intern Candidate List

## Purpose

Show interns and newly issued token candidates in one admin list.

## Scope

- `/admin/interns` renders a single `Список стажёров` table.
- A candidate appears in the list immediately after token creation.
- Clicking a row opens a modal with masked token history, attempts, results, and token action.
- New access tokens are created from the selected intern row modal.
- Newly created tokens are added to the open row modal immediately.
- The old separate `Последние токены` and `Профили стажёров` blocks are removed.

## Data Model

- `Invitation.inviteCodeMask` stores a non-sensitive token mask for admin lists.
- `Invitation.inviteCodeEncrypted` stores an encrypted token value for admin copy actions.
- Pending candidates are built from `Invitation.candidateName`.
- Existing interns are built from `InternProfile`.
- Token history for an intern is matched by current invitation, accepted profile, and full-name match.
- Token expiry is configured with `INTERN_INVITATION_EXPIRES_IN_DAYS`.
- Token encryption uses `INVITATION_TOKEN_ENCRYPTION_SECRET`.

## Main Flow

- Admin opens `/admin/interns`.
- Admin creates a token.
- The candidate appears in `Список стажёров`.
- Admin clicks the row.
- The modal shows masked access tokens and lets the admin copy available tokens.
- The modal lets the admin create another token.
- The new token value appears once and the token table prepends its mask.
- After the intern signs in, the modal also shows attempts and result links.

## Touched Files

- `app/admin/interns/page.tsx`
- `components/admin/intern-candidate-table.tsx`
- `components/admin/retake-invitation-form.tsx`
- `src/actions/admin.ts`
- `src/lib/security.ts`
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
