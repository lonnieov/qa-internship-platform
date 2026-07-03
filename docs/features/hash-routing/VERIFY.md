# Hash Routing Verification

## Preconditions

- Run the app locally.
- Use a browser with JavaScript enabled.
- Have at least one valid admin or intern session if checking protected pages.

## Smoke Check

- Open `/#/ru/sign-in/intern`.
- Expected: the intern sign-in page opens.
- Expected: the final visible URL is `/#/ru/sign-in/intern`.

## Positive Case

- Open `/#/ru/sign-in/admin`.
- Expected: the admin sign-in page opens.
- Expected: the final visible URL is `/#/ru/sign-in/admin`.
- Open `/#/uz/sign-in/intern`.
- Expected: the Uzbek intern sign-in page opens.
- Expected: the final visible URL is `/#/uz/sign-in/intern`.
- Open `/#/ru/admin/interns?query=Ali` while signed in as admin.
- Expected: the interns page opens and the `query=Ali` filter is preserved.
- Expected: the final visible URL is `/#/ru/admin/interns?query=Ali`.

## Negative Cases

- Open `/ru/company#team`.
- Expected: the company page scroll anchor is not treated as a route redirect.
- Open `/#/api/health-check`.
- Expected: the bridge ignores the hash because API paths are not client routes.
- Open `/#/en/admin`.
- Expected: the bridge ignores the hash because `en` is not a supported locale.

## Regression Check

- Sign in as intern with a token.
- Expected: the normal Server Action redirect still opens the canonical intern
  route.
- Switch language with the language switcher.
- Expected: the current path and query are preserved.
