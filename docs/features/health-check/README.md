# Health Check

## Purpose

Expose a lightweight backend endpoint for deployment and uptime checks.

## Scope

- Adds a public `GET /api/health-check` route.
- Returns current server status, ISO timestamp, and process uptime in seconds.
- Disables response caching.

## Main Flow

- Client or monitoring service sends `GET /api/health-check`.
- Server returns JSON with `status: "ok"` when the app can handle the request.

## Touched Files

- `app/api/health-check/route.ts`
- `docs/features/health-check/README.md`
- `docs/features/health-check/VERIFY.md`

## Constraints

- The route does not require authentication.
- The route does not check database connectivity.
