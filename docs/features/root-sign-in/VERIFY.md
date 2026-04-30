# Root Sign-In Verification

## Preconditions

- Run the app locally.
- Have one valid intern token if testing a successful intern login.
- Have admin credentials if testing the admin switch.

## Smoke Check

- Open `/`.
- Expected: the intern sign-in screen appears immediately with the token form.
- Expected: no landing page cards or "На главную" link are visible.

## Positive Case

- Open `/`.
- Enter a valid intern token and submit.
- Expected: the intern is routed into the existing intern flow.
- Open `/` again and click `Администратор`.
- Expected: the tab indicator moves smoothly, `/sign-in/admin` opens, and the admin login form fades into place.
- Click `Стажёр`.
- Expected: the role switch animates back and the token login form is shown.

## Negative Cases

- Open `/` and submit an empty token.
- Expected: the token field validation or existing login error behavior is shown.

## Regression Check

- Open `/sign-in/intern`.
- Expected: the same intern sign-in screen still works.
- Open `/sign-in/admin`.
- Expected: admin sign-in still works and can switch back to `Стажёр`.
- Use Cmd/Ctrl-click on a role tab.
- Expected: the browser keeps the normal new-tab behavior.
