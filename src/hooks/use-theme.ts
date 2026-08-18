"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

/**
 * The theme is owned by the DOM, not by React: it is stored in localStorage and
 * applied as [data-theme] on <html> so the choice survives a reload and is
 * readable from plain CSS. Components subscribe through useSyncExternalStore so
 * every consumer (the toggle, the toaster) sees the same value.
 */
export function preferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem("theme", theme);
  // "storage" only fires in other tabs, so this custom event is what keeps
  // subscribers in the current tab in sync.
  window.dispatchEvent(new Event("themechange"));
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("themechange", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("themechange", callback);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, preferredTheme, () => "light");
}
