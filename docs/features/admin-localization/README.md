# Admin Localization

## Purpose

Bring core admin pages and nearby admin modals onto `next-intl` so Russian and Uzbek UI stay consistent.

## Scope

- admin overview page
- admin settings page
- admin questions page shell, question editor and related modals
- admin attempt report page
- admin sign-in page
- shared admin controls like report download, question delete, retake action, password input and token copy hint

## Data Model

No storage changes.

## Main Flow

- locale-specific admin routes under `app/[locale]/admin/*` load translated copy from `messages/{locale}.json`
- client admin components use `useTranslations(...)`
- server admin pages use `getTranslations(...)`
- attempt report table keeps dedicated column widths so time/result cells do not collapse vertically

## Touched Files

- app/[locale]/admin/page.tsx
- app/[locale]/admin/settings/page.tsx
- app/[locale]/admin/questions/page.tsx
- app/[locale]/admin/attempts/[attemptId]/page.tsx
- app/[locale]/sign-in/admin/[[...sign-in]]/page.tsx
- components/admin/admin-create-form.tsx
- components/admin/admin-login-form.tsx
- components/admin/admin-manage-modal.tsx
- components/admin/admin-shell.tsx
- components/admin/ai-question-generator.tsx
- components/admin/question-create-modal.tsx
- components/admin/question-created-toast.tsx
- components/admin/question-delete-form.tsx
- components/admin/question-form.tsx
- components/admin/report-download-button.tsx
- components/admin/retake-invitation-form.tsx
- components/admin/copyable-token.tsx
- components/auth-role-tabs.tsx
- components/theme-toggle.tsx
- components/ui/password-input.tsx
- components/admin/track-manage-modal.tsx
- app/globals.css
- messages/ru.json
- messages/uz.json

## Constraints

- question type names like `Quiz`, `SQL Sandbox`, `API Sandbox` stay as product labels
- date formatting still uses browser/Node locale-specific formatting per route locale
- business data like question text, track names and candidate names are not auto-translated
