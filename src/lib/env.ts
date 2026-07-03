const isProduction = process.env.NODE_ENV === "production";

/**
 * Returns a required cryptographic secret from the environment.
 *
 * Production: a missing secret is a fatal misconfiguration and throws on first
 * use, so the app fails fast instead of silently signing tokens with a
 * publicly-known value.
 *
 * Development: a purpose-specific fallback keeps local setup frictionless.
 * Fallbacks are intentionally distinct per purpose — secrets are never shared
 * or cross-fallen-back between auth domains, so a forged admin token can never
 * validate as an intern token (or vice versa).
 */
export function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value && value.trim().length > 0) {
    return value;
  }

  if (isProduction) {
    throw new Error(
      `Missing required environment variable ${name}. Set a long, random, ` +
        "unique value (32+ bytes) before starting the app in production.",
    );
  }

  return devFallback;
}
