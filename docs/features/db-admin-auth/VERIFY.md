# DB Admin Auth Verification

## Preconditions

- Run `npm run db:push` after pulling the schema change.
- Run the app locally.
- Have no active `qa_admin` cookie, or log out from the admin sidebar.

## Smoke Check

- Open `/sign-in/admin`.
- Expected: email/password admin login form is visible.
- Open `/sign-up/admin`.
- Expected: user is redirected to `/sign-in/admin`.
- Open `/sign-in/intern`.
- Expected: token login form is still visible.

## Positive Case

- Run `npm run db:seed`.
- Open `/sign-in/admin`.
- Enter `admin@resting.chat` and `RESTingChat`.
- Expected: user is redirected to `/admin`.
- Open `/admin/settings`.
- In `Администраторы`, enter `Admin`, `User`, `admin@example.com`, and `password123`.
- Submit the form.
- Expected: success message appears and `admin@example.com` appears in the admin list.

## Seeded Admin Case

- Run `npm run db:seed`.
- Open `/sign-in/admin`.
- Enter `admin@resting.chat` and `RESTingChat`.
- Expected: user is redirected to `/admin`.

## Admin Creates Admin Case

- Sign in as an existing admin.
- Open `/admin/settings`.
- In `Администраторы`, enter `Second`, `Admin`, `second-admin@example.com`, and `password123`.
- Submit the form.
- Expected: success message appears and `second-admin@example.com` appears in the admin list.
- Log out and sign in with `second-admin@example.com` and `password123`.
- Expected: user is redirected to `/admin`.

## Admin Edit/Delete Case

- Sign in as an existing admin.
- Open `/admin/settings`.
- Open the actions modal for a non-seed admin.
- Change the name or email and submit.
- Expected: the admin list updates with the new values.
- Set a new password, log out, and sign in with the new password.
- Expected: user is redirected to `/admin`.
- Open the actions modal for a non-seed, non-current admin and delete it.
- Expected: the admin disappears from the list and cannot sign in.
- Open the actions modal for `admin@resting.chat`.
- Expected: `admin@resting.chat` is not shown in the admin management list.

## Negative Cases

- Open `/sign-in/admin`.
- Enter `admin@example.com` and `wrong-password`.
- Expected: login is rejected with `Неверный email или пароль.`
- Open `/sign-up/admin`.
- Expected: public registration is not available and user is redirected to `/sign-in/admin`.

## Regression Check

- Create an intern token from `/admin/interns`.
- Log out from admin.
- Open `/` or `/sign-in/intern`, enter the intern token, and submit.
- Expected: intern flow starts normally.
