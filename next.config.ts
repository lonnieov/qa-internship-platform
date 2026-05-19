import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

function normalizeAllowedOrigin(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("*.")) return trimmed;

  try {
    return new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    ).host;
  } catch {
    return trimmed.replace(/^[a-z]+:\/\//i, "").split("/")[0] || null;
  }
}

function serverActionAllowedOrigins() {
  const values = [
    process.env.RENDER_EXTERNAL_HOSTNAME,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SERVER_ACTIONS_ALLOWED_ORIGINS,
  ];
  const origins = values
    .flatMap((value) => value?.split(",") ?? [])
    .map((value) => normalizeAllowedOrigin(value))
    .filter((value): value is string => Boolean(value));

  return [...new Set(origins)];
}

const allowedOrigins = serverActionAllowedOrigins();

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  turbopack: {
    root: process.cwd(),
  },
  ...(allowedOrigins.length > 0
    ? {
        experimental: {
          serverActions: {
            allowedOrigins,
          },
        },
      }
    : {}),
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
