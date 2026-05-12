# Site Footer

## Purpose

Adds a shared footer with rights and rights-holder contact details across localized project screens.

## Scope

- Footer is rendered once from the locale layout.
- Public auth screens, intern screens, and admin screens inherit it automatically.
- Footer copy is localized for `ru` and `uz`.
- Auth panels no longer show their previous small copyright line.
- Footer follows the page content without an explicit separator band.
- `Связаться с нами` opens a contacts modal with Telegram links.
- Desktop admin shell uses a `100vh` viewport frame.
- Admin sidebar stays visible at `100vh`; admin content scrolls inside its own column before the page scroll reaches the footer.
- Admin user, language, theme, and logout controls are pinned to the bottom of the visible sidebar.

## Data Model

No storage or schema changes.

## Main Flow

1. User opens any localized route.
2. `app/[locale]/layout.tsx` renders page content inside `site-shell`.
3. `SiteFooter` renders brand copy, rights-holder info, contact email, contact CTA, and copyright.

## Touched Files

- `app/[locale]/layout.tsx`
- `app/[locale]/sign-in/admin/[[...sign-in]]/page.tsx`
- `app/[locale]/sign-in/intern/[[...sign-in]]/page.tsx`
- `app/globals.css`
- `components/site-footer-contact-modal.tsx`
- `components/site-footer.tsx`
- `messages/ru.json`
- `messages/uz.json`

## Constraints

- Footer uses the existing `ServiceLogo` and design tokens.
- Contact CTA opens an in-page modal.
- Modal links open Telegram contacts in a new tab.
- Footer is hidden in print output.
