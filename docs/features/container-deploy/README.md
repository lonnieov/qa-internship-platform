# Container Deploy

## Purpose

Run the Next.js app as a production container for a self-hosted server, Kubernetes, or another container platform.

## Scope

- Multi-stage Docker build installs dependencies, builds the app, and runs only production dependencies.
- The app listens on `0.0.0.0` and uses the runtime `PORT` value, defaulting to `3000`.
- Build-time Prisma generation uses a placeholder `DATABASE_URL` unless a real build argument is provided.
- Runtime image includes Prisma CLI and always runs schema setup before app start.
- `docker-compose.yml` can run the app with a local Postgres service.
- Container startup applies Prisma schema and seeds the default admin.

## Main Flow

1. Build the image from `Dockerfile`.
2. Provide runtime secrets and database environment variables.
3. `docker-entrypoint.sh` runs `npx prisma db push --skip-generate`.
4. `docker-entrypoint.sh` runs `npx prisma db seed`.
5. The app starts with `npm run start -- --hostname 0.0.0.0 --port $PORT`.

## Touched Files

- `Dockerfile`
- `.dockerignore`
- `.env.example`
- `docker-entrypoint.sh`
- `docker-compose.yml`

## Constraints

- Runtime `DATABASE_URL` is required for app flows that read or write database data.
- Do not bake `.env` files into the image.
- Keep `ADMIN_SESSION_SECRET`, `INTERN_SESSION_SECRET`, and `INVITATION_TOKEN_ENCRYPTION_SECRET` stable between restarts.
- Seed admin credentials are `admin@resting.chat` and `RESTingChat`.
- Startup schema setup is intended for a single app container on a self-hosted server.
- For multiple replicas or Kubernetes, move `prisma db push` and `prisma db seed` into a one-off job.
- Compose defaults are for local/self-hosted bootstrap and should be overridden with strong secrets in production.
