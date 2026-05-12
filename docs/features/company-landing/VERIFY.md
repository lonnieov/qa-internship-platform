# Company Landing Verification

## Preconditions

- App is running locally.
- Browser can open `/ru` and `/uz` localized routes.

## Smoke Check

1. Open `/ru/company`.
2. Expected result: page headline is `LAP inc.`.
3. Expected result: page describes an AI studio that builds custom digital products.
4. Expected result: service blocks and creator cards are visible.

## Positive Case

1. Open any localized page and scroll to the footer.
2. Click the footer `LAP inc.` brand name.
3. Expected result: browser opens `/ru/company` for Russian pages or `/uz/company` for Uzbek pages.
4. Scroll to the creator section.
5. Expected result: cards exist for `Игорь Ливиев`, `Фахриёр Ахмаджонов`, and `Никита Пак`.
6. Expected result: each card has an empty photo placeholder and humorous role text.
7. Click `Написать`.
8. Expected result: mail client target is `hello@lap.inc`.

## Negative Cases

1. Resize the browser to a mobile width around `390px`.
2. Open `/ru/company`.
3. Expected result: service blocks and creator cards stack vertically without text overlap.

## Regression Check

1. Open `/uz/company`.
2. Expected result: page copy is shown in Uzbek and creator names remain unchanged.
3. Return to another route.
4. Expected result: the global footer still renders and the contact modal still opens.
