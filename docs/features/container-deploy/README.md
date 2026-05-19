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
- Next.js Server Actions allow public proxy origins from `RENDER_EXTERNAL_HOSTNAME`, `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, and `SERVER_ACTIONS_ALLOWED_ORIGINS`.

## Main Flow

1. Build the image from `Dockerfile`.
2. Provide runtime secrets and database environment variables.
3. On Render/custom domains, set `SERVER_ACTIONS_ALLOWED_ORIGINS` to the public host if it is not covered by `RENDER_EXTERNAL_HOSTNAME`.
4. `docker-entrypoint.sh` runs `npx prisma db push --skip-generate`.
5. `docker-entrypoint.sh` runs `npx prisma db seed`.
6. The app starts with `npm run start -- --hostname 0.0.0.0 --port $PORT`.

## Touched Files

- `Dockerfile`
- `.dockerignore`
- `.env.example`
- `docker-entrypoint.sh`
- `docker-compose.yml`
- `next.config.ts`
- `src/lib/intern-token-auth.ts`

## Constraints

- Runtime `DATABASE_URL` is required for app flows that read or write database data.
- Do not bake `.env` files into the image.
- Keep `ADMIN_SESSION_SECRET`, `INTERN_SESSION_SECRET`, and `INVITATION_TOKEN_ENCRYPTION_SECRET` stable between restarts.
- Server Action origin values are read during Next.js build/start config loading; after changing them, rebuild or redeploy the app.
- For custom domains, `SERVER_ACTIONS_ALLOWED_ORIGINS` stores hostnames only or comma-separated hostnames, for example `qa.example.com,*.qa.example.com`.
- Seed admin credentials are `admin@resting.chat` and `RESTingChat`.
- Startup schema setup is intended for a single app container on a self-hosted server.
- For multiple replicas or Kubernetes, move `prisma db push` and `prisma db seed` into a one-off job.
- Compose defaults are for local/self-hosted bootstrap and should be overridden with strong secrets in production.
