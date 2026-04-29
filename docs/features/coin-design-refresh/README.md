# Coin Design Refresh

## Purpose

Apply the Coin Assessment visual reference from `qq.zip` to the existing platform without changing assessment logic.

## Scope

- Global color, spacing, typography, card, table, input, button, badge, and progress styles now follow the Coin tokens.
- Admin area uses a left sidebar navigation similar to the reference screens.
- Admin and intern sign-in pages use the split blue brand panel and compact form layout.
- Existing dark mode is preserved with adapted Coin variables.

## Main Flow

- User opens `/` and sees the intern sign-in screen immediately.
- Sign-in pages show the Coin brand panel and role switch.
- Admin pages keep existing routes and actions inside the new sidebar shell.
- Intern pages keep existing top navigation and test flow with refreshed UI primitives.

## Touched Files

- `app/globals.css`
- `app/admin/layout.tsx`
- `app/sign-in/admin/[[...sign-in]]/page.tsx`
- `app/sign-in/intern/[[...sign-in]]/page.tsx`
- `components/admin/admin-shell.tsx`
- `components/intern/token-login-form.tsx`
- `components/ui/badge.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/progress.tsx`
- `components/ui/select.tsx`
- `components/ui/textarea.tsx`

## Constraints

- Assessment business logic is unchanged by the visual refresh.
- Existing service logo and easter egg behavior are preserved.
- Dark mode remains available even though the reference is light-first.
