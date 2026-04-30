# Health Check Verification

## Preconditions

- App is running locally or deployed.

## Smoke Check

- Send `GET /api/health-check`.
- Expected: response status is `200`.
- Expected: JSON contains `status`, `timestamp`, and `uptime`.

## Positive Case

- Run `curl http://localhost:3000/api/health-check`.
- Expected: response contains `"status":"ok"`.
- Expected: `timestamp` is an ISO date string.
- Expected: `uptime` is a number.

## Regression Check

- Open admin and intern pages after adding the route.
- Expected: existing auth flows and pages continue to load.
