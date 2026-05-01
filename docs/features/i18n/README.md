# Internationalization

## Purpose

Allow the admin interface to work in Russian and Uzbek.

## Scope

- Locale-prefixed routes use `/ru/...` and `/uz/...`.
- The admin shell and `/admin/interns` workflow read UI text from message files.
- The admin sidebar includes a language switcher that preserves the current path and query string.

## Main Flow

1. Next.js proxy redirects non-localized pages to the default Russian locale.
2. `next-intl` loads messages for the active locale.
3. Client and server components read labels through translation keys.
4. The language switcher replaces the locale segment and keeps filters such as intern search.

## Touched Files

- `proxy.ts`
- `next.config.ts`
- `app/[locale]/layout.tsx`
- `app/[locale]/admin/interns/page.tsx`
- `components/admin/admin-shell.tsx`
- `components/admin/intern-candidate-table.tsx`
- `components/admin/intern-search-form.tsx`
- `components/admin/invitation-create-modal.tsx`
- `components/admin/invitation-form.tsx`
- `components/admin/retake-invitation-form.tsx`
- `components/language-switcher.tsx`
- `messages/ru.json`
- `messages/uz.json`
- `src/i18n/request.ts`
- `src/i18n/routing.ts`

## Constraints

- Russian is the default locale.
- Locale prefixes are always present after middleware redirect.
- Full token values are still shown only when available for admin display.
- Existing non-admin screens can be migrated to message files incrementally.
