# DevTools Noise Requests Verification

## Preconditions

- Run the app locally.
- Have an intern attempt with a `DEVTOOLS_SANDBOX` question.
- Open browser DevTools Network tab before clicking the request button.

## Smoke Check

- Start an intern test and open a DevTools question.
- Click the DevTools request button once.
- Expected: Network shows nine `/api/devtools-sandbox/...` requests for the same question.
- Expected: the configured endpoint name appears once; decoys have distinct names such as `request_method_metrics`.

## Positive Case

- Inspect the Network entries from one button click.
- Find the request whose endpoint and query match the values shown/configured for the question, for example `/request_method?attempt=<attemptId>&step=1&source=button`.
- Expected: this request returns the configured response body.
- Enter the expected value from that response into the answer field.
- Wait one second.
- Expected: answer saves without showing correctness.

## Negative Cases

- Inspect a request with a derived endpoint such as `/request_method_metrics` or `/request_method_session`.
- Expected: response is successful-looking garbage JSON, not the configured answer body.
- Copy a value from a decoy response into the answer field.
- Expected: UI still only shows neutral saved/autosave status.

## Regression Check

- Finish the attempt.
- Open the attempt in admin.
- Expected: DevTools answer scoring still uses the typed answer and configured expected answer.
- Expected: decoy requests do not create extra submissions.
