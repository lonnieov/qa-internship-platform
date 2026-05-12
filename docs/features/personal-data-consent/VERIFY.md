# Personal Data Consent Verification

## Preconditions

- Run the app locally.
- Have a valid intern token.

## Smoke Check

- Open `/sign-in/intern`.
- Expected: token form contains a consent checkbox with personal data processing text.
- Expected: `Войти` is disabled while the consent checkbox is unchecked.

## Positive Case

- Enter a valid intern token.
- Check the consent checkbox.
- Expected: `Войти` becomes enabled.
- Submit the form.
- Expected: intern is authorized and redirected into the intern flow.

## Negative Cases

- Enter a valid intern token.
- Leave the consent checkbox unchecked.
- Expected: `Войти` remains disabled.
- Bypass the disabled button and submit without `personalDataConsent`.
- Expected: server returns `Подтвердите согласие на обработку персональных данных.`

## Regression Check

- Open `/sign-in/admin`.
- Expected: admin sign-in form does not show the intern consent checkbox.
