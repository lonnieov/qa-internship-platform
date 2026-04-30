# Personal Data Consent

## Purpose

Require intern consent for personal data processing before token authorization.

## Scope

- Adds a required consent checkbox to the intern token sign-in form.
- Blocks intern token authorization on the server when consent is missing.
- Keeps admin sign-in unchanged.

## Main Flow

- Intern opens `/` or `/sign-in/intern`.
- Intern enters an access token.
- Intern checks the personal data processing consent checkbox.
- Form submits and the existing token login flow continues.

## Touched Files

- `components/intern/token-login-form.tsx`
- `src/actions/intern.ts`
- `app/globals.css`
- `docs/features/personal-data-consent/README.md`
- `docs/features/personal-data-consent/VERIFY.md`

## Constraints

- Consent is required for login but is not stored separately.
- Token validation rules remain unchanged.
