# AI Question Proxy

## Purpose

Generate optional admin question suggestions through the CLIProxyAPI sidecar
instead of a direct provider API key.

## Scope

- Admin question generator calls `/api/ai/questions`.
- The route uses `src/lib/ai-client.ts`.
- AI is disabled when `CLI_PROXY_API_URL` or `CLI_PROXY_API_KEY` is missing.
- Direct provider API key fallback is intentionally absent.

## Main Flow

1. Admin opens the question bank AI generator.
2. Client posts the topic to `/api/ai/questions`.
3. Server verifies the current profile is `ADMIN`.
4. Server sends the prompt through CLIProxyAPI using `CLI_PROXY_MODEL`.
5. Server returns parsed JSON suggestions to the client.

## Touched Files

- `app/api/ai/questions/route.ts`
- `components/admin/ai-question-generator.tsx`
- `src/lib/ai-client.ts`
- `.env.example`
- `docker-compose.yml`
- `README.md`
- `components/admin/service-architecture-diagram.tsx`

## Constraints

- Requires a running CLIProxyAPI sidecar for AI generation.
- The app talks to the sidecar through an OpenAI-compatible SDK client.
- Provider OAuth credentials live in the sidecar volume, not in the app.
