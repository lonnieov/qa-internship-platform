import { headers } from "next/headers";
import { isLocale, type Locale } from "@/i18n/routing";

export const defaultLocale: Locale = "ru";

export function normalizeLocale(value: unknown): Locale {
  const locale = String(value ?? "");
  return isLocale(locale) ? locale : defaultLocale;
}

function localeFromPath(value: string | null | undefined) {
  if (!value) return null;

  try {
    const pathname = value.includes("://") ? new URL(value).pathname : value;
    const locale = pathname.split("/")[1];
    return isLocale(locale) ? locale : null;
  } catch {
    return null;
  }
}

export function localizedPath(path: string, locale: unknown) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${normalizeLocale(locale)}${normalizedPath}`;
}

export async function getRequestLocale(explicitLocale?: unknown) {
  const explicit = String(explicitLocale ?? "");
  if (isLocale(explicit)) return explicit;

  try {
    const store = await headers();
    const headerLocale = store.get("x-next-intl-locale");
    if (isLocale(headerLocale ?? undefined)) return headerLocale as Locale;

    const nextUrlLocale = localeFromPath(store.get("next-url"));
    if (nextUrlLocale) return nextUrlLocale;

    const refererLocale = localeFromPath(store.get("referer"));
    if (refererLocale) return refererLocale;
  } catch {
    return defaultLocale;
  }

  return defaultLocale;
}
