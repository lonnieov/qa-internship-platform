# Assessment Retakes

## Purpose

Allow admins to issue a fresh token for a repeat assessment attempt without deleting old results.

## Scope

- Admins can issue a new retake token from the `Стажёры и доступы` table.
- Retakes are allowed only when the intern has no active `IN_PROGRESS` attempt.
- The same intern profile is reused for the new token and the new attempt.
- Previous attempts remain in the database and stay available in reports.

## Data Model

- No schema changes were made.
- A retake creates a new `Invitation` row.
- The existing `InternProfile.invitationId` is moved to the new invitation.
- Existing `AssessmentAttempt` rows are preserved as history.

## Main Flow

- Admin opens `Стажёры и доступы`.
- Admin clicks `Перепройти` for a completed intern.
- The page returns a new token in place.
- Intern signs in with the new token.
- The app creates a new attempt for the same `InternProfile`.
- Reusing a token that already has a finished or expired attempt redirects to the result flow instead of starting another test.

## Touched Files

- `src/actions/admin.ts`
- `src/actions/intern.ts`
- `app/admin/interns/page.tsx`
- `components/admin/retake-invitation-form.tsx`

## Constraints

- Retake token issuance is blocked while an old attempt is still `IN_PROGRESS`.
- Old invitation history is preserved, but the active invitation pointer moves to the newest token.
- A token is considered used when a non-active attempt exists with `startedAt` after that token was created.
- The latest attempt still becomes the primary result shown in admin lists.
