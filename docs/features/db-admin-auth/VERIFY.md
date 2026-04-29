# DB Admin Auth Verification

## Preconditions

- Run `npm run db:push` after pulling the schema change.
- Run the app locally.
- Have no active `qa_admin` cookie, or log out from the admin sidebar.

## Smoke Check

- Open `/sign-in/admin`.
- Expected: email/password admin login form is visible.
- Open `/sign-up/admin`.
- Expected: admin registration form is visible when registration is available.
- Open `/sign-in/intern`.
- Expected: token login form is still visible.

## Positive Case

- Open `/sign-up/admin`.
- Enter `Admin`, `User`, `admin@example.com`, and `password123`.
- Submit the form.
- Expected: user is redirected to `/admin`.
- Click `Выйти` in the admin sidebar.
- Expected: user is redirected to `/sign-in/admin`.
- Enter `admin@example.com` and `password123`.
- Expected: user is redirected to `/admin`.

## Negative Cases

- Open `/sign-in/admin`.
- Enter `admin@example.com` and `wrong-password`.
- Expected: login is rejected with `Неверный email или пароль.`
- Open `/sign-up/admin` after an admin exists and no `ADMIN_REGISTRATION_CODE` is set.
- Expected: registration is closed.
- If `ADMIN_REGISTRATION_CODE` is set, enter a wrong code during registration.
- Expected: registration is rejected with `Неверный код регистрации.`

## Regression Check

- Create an intern token from `/admin/interns`.
- Log out from admin.
- Open `/` or `/sign-in/intern`, enter the intern token, and submit.
- Expected: intern flow starts normally.
