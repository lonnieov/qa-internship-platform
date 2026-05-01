# Token Creation Modal

## Purpose

Create a new intern from a modal on `/admin/interns`.

## Scope

- Admins open intern creation from the `Создать стажёра` button in the page header.
- The modal contains only the candidate name field.
- A token is issued immediately after the intern is created.
- The created token is shown inside the modal and remains copyable.
- The created candidate appears in the unified intern candidate list.

## Data Model

- `Invitation.inviteCodeMask` stores a non-sensitive token mask.
- `Invitation.inviteCodeEncrypted` stores an encrypted token value for later admin copy.
- Token creation still stores only the token hash for login validation.
- Token expiry uses `INTERN_INVITATION_EXPIRES_IN_DAYS`.
- Token encryption uses `INVITATION_TOKEN_ENCRYPTION_SECRET`.

## Main Flow

- Admin opens `/admin/interns`.
- Admin clicks `Создать стажёра`.
- Admin fills candidate name.
- Admin submits the form.
- The modal displays the new intern access token immediately.

## Touched Files

- `app/admin/interns/page.tsx`
- `components/admin/intern-candidate-table.tsx`
- `components/admin/invitation-create-modal.tsx`
- `components/admin/invitation-form.tsx`
- `src/actions/admin.ts`
- `src/lib/security.ts`
- `prisma/schema.prisma`
- `.env.example`
- `app/globals.css`

## Constraints

- Token values are only shown after creation and copied from the modal.
- Token lists show masked token values and copy the decrypted value for new encrypted tokens.
- Existing revocation, retake, and intern profile flows are unchanged.
