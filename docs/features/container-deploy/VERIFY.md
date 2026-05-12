# Container Deploy Verification

## Preconditions

- Docker or a compatible image builder is installed.
- A reachable Postgres `DATABASE_URL` is available.

## Smoke Check

1. Run `docker build -t qa-internship-validator .`.
2. Expected: image builds successfully and `npm run build` completes inside the build stage.

## Positive Case

1. Run `docker run --rm -p 3000:3000 -e PORT=3000 -e DATABASE_URL="<postgres-url>" qa-internship-validator`.
2. Open `http://localhost:3000/`.
3. Expected: app redirects to `/ru` and renders through the production Next.js server.
4. Open `http://localhost:3000/api/health-check`.
5. Expected: health endpoint responds successfully.

## Negative Cases

1. Run the container without `DATABASE_URL`.
2. Expected: static pages may open, but database-backed admin or intern flows fail instead of silently using a bundled local database.

## Regression Check

1. Deploy the image behind a reverse proxy with `x-forwarded-host` and `x-forwarded-proto`.
2. Open the public root URL.
3. Expected: redirect `Location` uses the public host and does not include the internal container port.
