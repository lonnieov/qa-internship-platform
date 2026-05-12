# Company Landing

## Purpose

Adds a localized LAP inc. company page linked from the global footer.

## Scope

- `/[locale]/company` shows a simple AI studio landing page.
- Footer `LAP inc.` brand and rights-holder name link to the company page.
- Page copy is localized for `ru` and `uz`.
- Team section has placeholders for three creator photos.
- Creator roles and descriptions use light humorous copy.

## Data Model

No storage or schema changes.

## Main Flow

1. User clicks `LAP inc.` in the footer.
2. Browser opens the localized company page.
3. User sees AI studio positioning, service areas, and creator profiles.

## Touched Files

- `app/[locale]/company/page.tsx`
- `app/[locale]/layout.tsx`
- `app/globals.css`
- `components/site-footer.tsx`
- `messages/ru.json`
- `messages/uz.json`

## Constraints

- Creator photos are placeholders only.
- Contact CTA uses `mailto:hello@lap.inc`.
- Footer Telegram contact modal remains unchanged.
