# Coin Design Refresh

## Purpose

Apply the Coin Assessment visual reference from `qq.zip` to the existing platform without changing assessment logic.

## Scope

- Global color, spacing, typography, card, table, input, button, badge, and progress styles now follow the Coin tokens.
- Admin area uses a left sidebar navigation similar to the reference screens.
- Admin and intern sign-in pages use the split blue brand panel and compact form layout.
- Intern start and finish pages follow the `.vscode` QA Assessment references with embedded page actions instead of the shared topbar.
- Intern start shows stats, topic preview, readiness checklist, rules, and gated launch CTA.
- Intern finish shows submitted answers, time spent, token lock notice, and next-step timeline.
- Intern test pages include embedded language and theme controls because the shared topbar is hidden during assessment.
- Theme switching uses a two-option light/dark segmented control with text labels and icons.
- Shared UI primitives use explicit color utilities so light and dark theme text remains readable.
- Existing dark mode is preserved with adapted Coin variables.

## Main Flow

- User opens `/` and sees the intern sign-in screen immediately.
- Sign-in pages show the Coin brand panel and role switch.
- Admin pages keep existing routes and actions inside the new sidebar shell.
- Intern pages keep existing test flow with embedded actions and refreshed UI primitives.

## Touched Files

- `app/globals.css`
- `app/admin/layout.tsx`
- `app/sign-in/admin/[[...sign-in]]/page.tsx`
- `app/sign-in/intern/[[...sign-in]]/page.tsx`
- `app/[locale]/intern/layout.tsx`
- `app/[locale]/intern/page.tsx`
- `app/[locale]/intern/result/page.tsx`
- `components/intern/test-runner.tsx`
- `components/intern/intern-start-panel.tsx`
- `components/admin/admin-shell.tsx`
- `components/intern/token-login-form.tsx`
- `components/theme-toggle.tsx`
- `components/ui/badge.tsx`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/password-input.tsx`
- `components/ui/progress.tsx`
- `components/ui/select.tsx`
- `components/ui/textarea.tsx`
- `messages/ru.json`
- `messages/uz.json`

## Constraints

- Assessment business logic is unchanged by the visual refresh.
- Existing service logo and easter egg behavior are preserved.
- Dark mode remains available even though the reference is light-first.
