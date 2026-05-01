# Token Creation Modal

## Purpose

Move initial intern token creation into a modal on `/admin/interns`.

## Scope

- Admins open token creation from the `Создать токен` button in the page header.
- The modal contains the existing candidate name and expiration fields.
- The created token is shown inside the modal and remains copyable.
- The latest token list stays visible on the page.

## Data Model

- No schema changes were made.
- Token creation still writes the same `Invitation` payload.

## Main Flow

- Admin opens `/admin/interns`.
- Admin clicks `Создать токен`.
- Admin fills candidate name and expiration days.
- Admin submits the form.
- The modal displays the new token.

## Touched Files

- `app/admin/interns/page.tsx`
- `components/admin/invitation-create-modal.tsx`
- `components/admin/invitation-form.tsx`
- `app/globals.css`

## Constraints

- Token values are only shown after creation and copied from the modal.
- Existing revocation, retake, and intern profile flows are unchanged.
