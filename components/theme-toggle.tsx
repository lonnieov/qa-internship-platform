"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function preferredTheme(): Theme {
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

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem("theme", theme);
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

export function ThemeToggle({
  variant = "segmented",
}: {
  variant?: "segmented" | "icon";
}) {
  const t = useTranslations("ThemeToggle");
  const theme = useSyncExternalStore(
    subscribeTheme,
    preferredTheme,
    () => "light",
  );

  function setTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
  }

  if (variant === "icon") {
    const nextTheme = theme === "dark" ? "light" : "dark";

    return (
      <button
        aria-label={t("toggle")}
        className="theme-toggle-icon"
        title={t("toggle")}
        type="button"
        onClick={() => setTheme(nextTheme)}
      >
        {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    );
  }

  return (
    <div
      aria-label={t("label")}
      className="theme-toggle-control"
      role="group"
    >
      <button
        aria-pressed={theme === "light"}
        className={theme === "light" ? "active" : ""}
        type="button"
        onClick={() => setTheme("light")}
      >
        <Sun size={15} />
        <span>{t("light")}</span>
      </button>
      <button
        aria-pressed={theme === "dark"}
        className={theme === "dark" ? "active" : ""}
        type="button"
        onClick={() => setTheme("dark")}
      >
        <Moon size={15} />
        <span>{t("dark")}</span>
      </button>
    </div>
  );
}
