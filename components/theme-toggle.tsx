"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

import { applyTheme, useTheme, type Theme } from "@/hooks/use-theme";

export function ThemeToggle({
  variant = "segmented",
}: {
  variant?: "segmented" | "icon";
}) {
  const t = useTranslations("ThemeToggle");
  const theme = useTheme();

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
