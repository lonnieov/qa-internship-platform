# Personal Data Consent Verification

## Preconditions

- Run the app locally.
- Have a valid intern token.

## Smoke Check

- Open `/sign-in/intern`.
- Expected: token form contains a consent checkbox with personal data processing text.

## Positive Case

- Enter a valid intern token.
- Check the consent checkbox.
- Submit the form.
- Expected: intern is authorized and redirected into the intern flow.

## Negative Cases

- Enter a valid intern token.
- Leave the consent checkbox unchecked.
- Submit the form.
- Expected: browser blocks submission or server returns the consent error message.

## Regression Check

- Open `/sign-in/admin`.
- Expected: admin sign-in form does not show the intern consent checkbox.
