# Root Sign-In

## Purpose

Show the sign-in experience immediately at `/` instead of the previous public landing page.

## Scope

- `/ru` renders the intern token sign-in screen by default.
- `/ru/sign-in/intern` keeps the same intern sign-in screen.
- `/ru/sign-in/admin` remains available from the role switch.
- Sign-in screens no longer show a home-page link.
- Role switching uses animated tabs and a soft form-card entrance between intern and admin screens.
- Auth role links stay locale-prefixed to avoid an extra middleware redirect during client navigation.
- Successful admin sign-in redirects directly to the current locale admin route.
- Successful intern token sign-in redirects directly to the current locale intern route.

## Main Flow

- User opens `/` and is redirected to `/ru`.
- The intern token login form is shown immediately.
- User can switch to administrator sign-in through the sign-in role tabs.
- The active tab indicator slides before navigation and the target form fades into place.
- Protected admin routes redirect unauthenticated users directly to the active locale sign-in URL.
- Admin login submits the current locale and redirects to `/{locale}/admin` after session creation.
- Intern login submits the current locale and redirects to `/{locale}/intern` after session creation.

## Touched Files

- `app/[locale]/page.tsx`
- `app/[locale]/sign-in/intern/page.tsx`
- `app/[locale]/sign-in/admin/page.tsx`
- `app/[locale]/sign-up/intern/page.tsx`
- `app/[locale]/sign-up/admin/page.tsx`
- `app/[locale]/admin/layout.tsx`
- `components/admin/admin-login-form.tsx`
- `components/intern/token-login-form.tsx`
- `components/auth-role-tabs.tsx`
- `src/actions/admin-auth.ts`
- `src/actions/intern.ts`
- `src/lib/auth.ts`
- `app/globals.css`

## Constraints

- Intern token login remains available from `/`.
- Admin sign-in remains on `/ru/sign-in/admin` and `/uz/sign-in/admin`.
- Intern sign-in remains on `/ru/sign-in/intern` and `/uz/sign-in/intern`.
