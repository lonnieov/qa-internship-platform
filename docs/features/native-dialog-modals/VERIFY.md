# Native Dialog Modals Verification

## Preconditions

- Run the app locally.
- Sign in as admin.
- Have at least one candidate, one track, and one active intern attempt available.

## Smoke Check

- Open `/ru/admin/interns` and click `Создать стажёра`.
- Expected: the modal opens centered over a blurred backdrop.
- Press `Esc`.
- Expected: the modal closes and keyboard focus returns to the page.
- Reopen the modal and click the backdrop outside the panel.
- Expected: the modal closes without changing the candidate list.

## Positive Case

- Open `/ru/admin/questions`.
- Click `Добавить`.
- Expected: the question form opens in a native modal and the page behind it is not interactive.
- Close the modal with the `Закрыть` icon.
- Open `/ru/admin/tracks`.
- Open a track action modal, a wave modal, and `Добавить мастера`.
- Expected: each modal opens and closes with the same fade/scale animation.
- Start an intern test, click `Завершить`, then click `Отмена`.
- Expected: the finish confirmation closes and the attempt remains active.

## Negative Cases

- In Safari or a browser without `<dialog closedby>`, open any modal and click the backdrop.
- Expected: the shared fallback still closes the dialog.
- Enable reduced motion in the OS or browser, then open and close a modal.
- Expected: the dialog uses a short fade without noticeable movement.

## Regression Check

- In `/ru/admin/interns`, open a candidate row.
- Expected: token actions, attempt result links, and delete confirmation still work.
- In `/ru/admin/settings`, open an admin manage modal.
- Expected: profile update and protected-admin messaging still work.
- In the footer, click `Связаться с нами`.
- Expected: Telegram contact links still open in a new tab.
