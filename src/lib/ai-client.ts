import OpenAI from "openai";

/**
 * Returns null when no AI backend is configured, so callers can disable their
 * feature (503-style) instead of throwing.
 *
 * Prefers CLI_PROXY_API_URL/CLI_PROXY_API_KEY (the CLIProxyAPI sidecar, see
 * README) over a direct OPENAI_API_KEY, since the proxy can be backed by a
 * Claude Code/Codex subscription instead of a metered API key. Both speak the
 * OpenAI SDK wire format, so callers don't need to know which one is active.
 */
export function getAIClient(): OpenAI | null {
  const proxyUrl = process.env.CLI_PROXY_API_URL;
  const proxyKey = process.env.CLI_PROXY_API_KEY;
  if (proxyUrl && proxyKey) {
    return new OpenAI({ baseURL: proxyUrl, apiKey: proxyKey });
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAI();
  }

  return null;
}
