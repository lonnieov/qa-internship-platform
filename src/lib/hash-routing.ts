import { isLocale, type Locale } from "@/i18n/routing";

const HASH_ROUTE_PREFIX = "#/";
const ROUTE_ORIGIN = "https://qa-internship-validator.local";

function firstPathSegment(pathname: string) {
  return pathname.split("/").filter(Boolean)[0];
}

function isRoutablePath(pathname: string) {
  return pathname === "/" || isLocale(firstPathSegment(pathname));
}

export function hashRouteToPath(hash: string) {
  if (!hash.startsWith(HASH_ROUTE_PREFIX)) {
    return null;
  }

  try {
    const target = hash.slice(1);
    const url = new URL(target, ROUTE_ORIGIN);

    if (!isRoutablePath(url.pathname)) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function toHashRoute(path: string) {
  if (
    path.startsWith("#") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  ) {
    return path;
  }

  try {
    const url = new URL(path, ROUTE_ORIGIN);

    if (!isRoutablePath(url.pathname)) {
      return path;
    }

    return `/#${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path;
  }
}

export function localizedHashRoute(path: string, locale: Locale) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return toHashRoute(`/${locale}${normalizedPath}`);
}
