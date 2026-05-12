# Container Deploy Verification

## Preconditions

- Docker or a compatible image builder is installed.
- For standalone Docker, a reachable Postgres `DATABASE_URL` is available.
- For Compose, no external database is required.

## Smoke Check

1. Run `docker build -t qa-internship-validator .`.
2. Expected: image builds successfully and `npm run build` completes inside the build stage.

## Positive Case

1. Run `docker compose up -d --build`.
2. Expected: Postgres becomes healthy, the app container runs `prisma db push --skip-generate`, then `prisma db seed`, then starts Next.js.
3. Open `http://localhost:3000/`.
4. Expected: app redirects to `/ru` and renders through the production Next.js server.
5. Open `http://localhost:3000/api/health-check`.
6. Expected: health endpoint responds successfully.
7. Sign in with `admin@resting.chat` and `RESTingChat`.
8. Expected: admin dashboard opens and remains authenticated after refresh.

## Negative Cases

1. Run the container without `DATABASE_URL`.
2. Expected: startup fails during `prisma db push` instead of silently using a bundled local database.
3. Start two app replicas from the same image.
4. Expected: do not use this mode for production; schema setup should be moved to a one-off job.

## Regression Check

1. Deploy the image behind a reverse proxy with `x-forwarded-host` and `x-forwarded-proto`.
2. Open the public root URL.
3. Expected: redirect `Location` uses the public host and does not include the internal container port.
4. Restart the app container with the same secrets.
5. Expected: new admin sessions remain valid after restart.
