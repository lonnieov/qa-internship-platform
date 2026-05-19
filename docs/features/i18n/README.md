# Internationalization

## Purpose

Allow admin and intern assessment UI to work in Russian and Uzbek.

## Scope

- Locale-prefixed routes use `/ru/...` and `/uz/...`.
- The admin shell, `/admin/interns`, intern start, intern test, and intern result workflows read UI text from message files.
- Language switchers preserve the current path and query string, including active assessment attempts.
- Proxy locale redirects use the forwarded public host so reverse proxies do not leak internal ports.
- Auth guards and Server Action redirects infer the active locale from the request and keep `/ru` or `/uz`.
- Admin question, track, attempt report, settings, dashboard, logout, and intern flow redirects use locale-prefixed paths.

## Main Flow

1. Next.js proxy redirects non-localized pages to the default Russian locale.
2. `next-intl` loads messages for the active locale.
3. Client and server components read labels through translation keys.
4. The language switcher replaces the locale segment and keeps filters such as intern search or active attempt id.
5. Same-origin locale redirects are normalized to the forwarded public origin before response.
6. Server actions that redirect after mutations return to the localized admin or intern route.

## Touched Files

- `proxy.ts`
- `next.config.ts`
- `app/[locale]/layout.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/admin/page.tsx`
- `app/[locale]/admin/questions/page.tsx`
- `app/[locale]/admin/tracks/page.tsx`
- `app/[locale]/admin/interns/page.tsx`
- `app/[locale]/admin/settings/page.tsx`
- `app/[locale]/admin/settings/docs/page.tsx`
- `app/[locale]/admin/attempts/[attemptId]/page.tsx`
- `app/[locale]/admin/attempts/[attemptId]/md/route.ts`
- `app/[locale]/intern/page.tsx`
- `app/[locale]/intern/test/page.tsx`
- `app/[locale]/intern/finish/route.ts`
- `app/[locale]/intern/result/page.tsx`
- `app/[locale]/intern/layout.tsx`
- `app/[locale]/intern/onboarding/page.tsx`
- `components/intern/intern-start-panel.tsx`
- `components/intern/test-runner.tsx`
- `components/admin/admin-shell.tsx`
- `components/admin/question-form.tsx`
- `components/admin/report-download-button.tsx`
- `components/admin/intern-candidate-table.tsx`
- `components/admin/intern-search-form.tsx`
- `components/admin/invitation-create-modal.tsx`
- `components/admin/invitation-form.tsx`
- `components/admin/retake-invitation-form.tsx`
- `components/language-switcher.tsx`
- `messages/ru.json`
- `messages/uz.json`
- `src/actions/admin.ts`
- `src/actions/admin-auth.ts`
- `src/actions/intern.ts`
- `src/lib/auth.ts`
- `src/lib/locale.ts`
- `src/i18n/request.ts`
- `src/i18n/routing.ts`

## Constraints

- Russian is the default locale.
- Locale prefixes are always present after middleware redirect.
- Full token values are still shown only when available for admin display.
- Some task-specific sandbox labels can still come from task config data and remain language-neutral or authored by admins.
