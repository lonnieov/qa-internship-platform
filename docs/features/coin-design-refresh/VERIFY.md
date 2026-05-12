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
- Expected: the intern theme control is compact and does not dominate the form header.
- Open `/sign-in/admin`.
- Expected: the page has the same split layout with the admin role selected.

## Positive Case

- Log in as admin.
- Expected: admin pages render with a left sidebar and existing page content.
- Expected: the sidebar theme control is full-width, shows `Светлая` and `Тёмная`, and highlights the active theme.
- Open `Стажёры`, `Вопросы`, and `Настройки`.
- Expected: navigation works and the active sidebar item changes.
- Create a test intern token.
- Expected: token creation still works and the token can be copied.
- Log in as intern and start a test.
- Expected: the intern start page matches the `.vscode/QA Assessment.html` structure with embedded brand/actions, stats, readiness checklist, rules, and launch CTA.
- Expected: the shared topbar is not shown on the start page.
- Expected: language and theme controls sit on one row and do not trigger hydration warnings after refresh.
- Expected: the launch CTA is disabled until all readiness checklist items are checked, unless an active attempt already exists.
- Expected: test navigation, answer selection, timer, and finish confirmation still work.
- Expected: the test page shows compact language and theme controls above the question area while the shared topbar remains hidden.
- Finish the attempt.
- Expected: the result page matches `.vscode/QA Assessment - Finish.html` with a completion mark, answer/time summary, token lock notice, and next-step timeline.
- Expected: the shared topbar is not shown on the result page.

## Negative Cases

- Toggle dark mode on sign-in and admin pages.
- Expected: text remains readable and controls stay visible.
- Toggle back to light mode.
- Expected: the active theme segment changes immediately and the selected theme persists after refresh.
- Check primary buttons such as `Выдать доступ`.
- Expected: button text is readable on the blue background in both themes.
- Resize to mobile width.
- Expected: sidebar stacks above content and sign-in panels stack vertically.

## Regression Check

- Run `npm run lint`.
- Run `npm run build`.
- Expected: both commands pass without changing business behavior.
