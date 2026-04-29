# Coin Design Refresh Verification

## Preconditions

- Run the app locally.
- Have admin access configured.
- Have at least one intern token for the intern flow.

## Smoke Check

- Open `/`.
- Expected: the intern sign-in screen appears with the Coin-style split layout.
- Open `/sign-in/intern`.
- Expected: the page has a blue brand panel on the left and token form on the right.
- Open `/sign-in/admin`.
- Expected: the page has the same split layout with the admin role selected.

## Positive Case

- Log in as admin.
- Expected: admin pages render with a left sidebar and existing page content.
- Open `Стажёры`, `Вопросы`, and `Настройки теста`.
- Expected: navigation works and the active sidebar item changes.
- Create a test intern token.
- Expected: token creation still works and the token can be copied.
- Log in as intern and start a test.
- Expected: test navigation, answer selection, timer, and finish confirmation still work.

## Negative Cases

- Toggle dark mode on sign-in and admin pages.
- Expected: text remains readable and controls stay visible.
- Resize to mobile width.
- Expected: sidebar stacks above content and sign-in panels stack vertically.

## Regression Check

- Run `npm run lint`.
- Run `npm run build`.
- Expected: both commands pass without changing business behavior.
