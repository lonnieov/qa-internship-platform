# Container Deploy

## Purpose

Run the Next.js app as a production container that can be deployed to Kubernetes or another container platform.

## Scope

- Multi-stage Docker build installs dependencies, builds the app, and runs only production dependencies.
- The app listens on `0.0.0.0` and uses the runtime `PORT` value, defaulting to `3000`.
- Build-time Prisma generation uses a placeholder `DATABASE_URL` unless a real build argument is provided.

## Main Flow

1. Build the image from `Dockerfile`.
2. Provide runtime secrets and environment variables from Kubernetes.
3. Start the container with `npm run start -- --hostname 0.0.0.0 --port $PORT`.
4. Kubernetes routes traffic to the container port exposed by the deployment.

## Touched Files

- `Dockerfile`
- `.dockerignore`

## Constraints

- Runtime `DATABASE_URL` is required for app flows that read or write database data.
- Do not bake `.env` files into the image.
- Use `npm run build:deploy` outside this image when schema push is intentionally part of the deployment workflow.
