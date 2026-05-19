# Root Sign-In Verification

## Preconditions

- Run the app locally.
- Have one valid intern token if testing a successful intern login.
- Have admin credentials if testing the admin switch.

## Smoke Check

- Open `/`.
- Expected: the intern sign-in screen appears immediately with the token form.
- Expected: URL is locale-prefixed as `/ru`.
- Expected: no landing page cards or "На главную" link are visible.

## Positive Case

- Open `/ru`.
- Enter a valid intern token and submit.
- Expected: the POST returns a redirect to `/ru/intern`, sets `qa_intern`, and the intern is routed into the existing intern flow.
- Click `Продолжить тестирование` or complete the readiness checklist and click `Начать тестирование`.
- Expected: the next page opens as `/ru/intern/test?...` and does not bounce to `/ru/sign-in/intern`.
- Open `/ru` again and click `Администратор`.
- Expected: the tab indicator moves smoothly, `/ru/sign-in/admin` opens, and the admin login form fades into place.
- Click `Стажёр`.
- Expected: the role switch animates back and the token login form is shown.

## Negative Cases

- Open `/` and submit an empty token.
- Expected: the token field validation or existing login error behavior is shown.

## Regression Check

- Open `/ru/sign-in/intern`.
- Expected: the same intern sign-in screen still works.
- Open `/ru/sign-in/admin`.
- Expected: admin sign-in still works and can switch back to `Стажёр`.
- Submit valid admin credentials on `/ru/sign-in/admin`.
- Expected: the POST returns a redirect to `/ru/admin`, sets `qa_admin`, and the admin dashboard opens.
- Open `/ru/admin` in a logged-out browser.
- Expected: the page redirects to `/ru/sign-in/admin` without a client chunk loading error.
- Use Cmd/Ctrl-click on a role tab.
- Expected: the browser keeps the normal new-tab behavior.
