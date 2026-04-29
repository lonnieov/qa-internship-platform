# Root Sign-In

## Purpose

Show the sign-in experience immediately at `/` instead of the previous public landing page.

## Scope

- `/` renders the intern token sign-in screen.
- `/sign-in/intern` keeps the same intern sign-in screen.
- `/sign-in/admin` remains available from the role switch.
- Sign-in screens no longer show a home-page link.

## Main Flow

- User opens `/`.
- The intern token login form is shown immediately.
- User can switch to administrator sign-in through the sign-in role tabs.

## Touched Files

- `app/page.tsx`
- `app/sign-in/intern/[[...sign-in]]/page.tsx`
- `app/sign-in/admin/[[...sign-in]]/page.tsx`

## Constraints

- Intern token login remains available from `/`.
- Admin sign-in remains on `/sign-in/admin`.
- Intern sign-in remains on `/sign-in/intern`.
