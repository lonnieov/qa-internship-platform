# DB Admin Auth

## Purpose

Authenticate administrators with local database credentials and remove Clerk from the app.

## Scope

- Admins register at `/sign-up/admin`.
- Admins sign in at `/sign-in/admin` with email and password.
- Admin passwords are stored as PBKDF2-SHA256 hashes.
- Admin sessions are stored in `AdminSession` and referenced by an httpOnly cookie.
- Seed creates a test admin profile: `admin@resting.chat` / `RESTingChat`.
- Intern sign-in remains token-only.

## Data Model

- `Profile.passwordHash`: password hash for admin profiles.
- `Profile.legacyAuthSubject`: nullable legacy auth field, not used by current auth.
- `AdminSession`: stores admin session token hash, profile relation, and expiry.

## Main Flow

- First admin opens `/sign-up/admin` and creates an account.
- Later admin registrations require `ADMIN_REGISTRATION_CODE` when it is set.
- Admin opens `/sign-in/admin`, enters email and password, and receives a DB-backed session.
- Admin logout deletes the matching `AdminSession` and clears the cookie.
- Running `npm run db:seed` ensures the test admin exists.
- Intern opens `/` or `/sign-in/intern` and still logs in with an invitation token.

## Touched Files

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/admin-auth.ts`
- `src/lib/auth.ts`
- `src/actions/admin-auth.ts`
- `src/actions/intern.ts`
- `src/lib/intern-token-auth.ts`
- `app/layout.tsx`
- `app/admin/layout.tsx`
- `app/sign-in/admin/[[...sign-in]]/page.tsx`
- `app/sign-up/admin/[[...sign-up]]/page.tsx`
- `components/admin/admin-login-form.tsx`
- `components/admin/admin-register-form.tsx`
- `components/admin/admin-shell.tsx`
- `package.json`

## Constraints

- Clerk package, provider, middleware, and user button are removed.
- Intern token auth remains cookie-based and unchanged at the user-facing level.
- Existing admin accounts without `passwordHash` cannot sign in until a DB password is registered.
