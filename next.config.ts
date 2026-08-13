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

// Content-Security-Policy. 'unsafe-inline' is required for scripts because Next.js
// and the inline theme bootstrap in app/layout.tsx emit inline <script> tags and
// this app does not use nonces. frame-ancestors/object-src/base-uri still provide
// clickjacking and injection hardening.
//
// 'unsafe-eval' is added in development ONLY: `next dev` (webpack) evaluates
// modules and React Fast Refresh via eval(), which the browser blocks without it,
// leaving the client un-hydrated (dead buttons/modals). Production never uses
// eval, so the stricter policy applies there.
const isDevelopment = process.env.NODE_ENV !== "production";
const scriptSrc = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "pdf-parse",
    "mammoth",
  ],
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
