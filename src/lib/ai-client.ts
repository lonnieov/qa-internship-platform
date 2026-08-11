import OpenAI from "openai";

const DEFAULT_CLI_PROXY_MODEL = "gpt-5";

/**
 * Returns null when no AI backend is configured, so callers can disable their
 * feature (503-style) instead of throwing.
 *
 * Uses only CLI_PROXY_API_URL/CLI_PROXY_API_KEY (the CLIProxyAPI sidecar, see
 * README). The sidecar speaks the OpenAI-compatible wire format, while the
 * actual upstream can be backed by a Claude Code/Codex subscription.
 */
export function getAIClient(): OpenAI | null {
  const proxyUrl = process.env.CLI_PROXY_API_URL?.trim();
  const proxyKey = process.env.CLI_PROXY_API_KEY?.trim();
  if (proxyUrl && proxyKey) {
    return new OpenAI({ baseURL: proxyUrl, apiKey: proxyKey });
  }

  return null;
}

export function getAIModel() {
  return process.env.CLI_PROXY_MODEL?.trim() || DEFAULT_CLI_PROXY_MODEL;
}
