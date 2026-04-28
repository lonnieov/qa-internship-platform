"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = preferredTheme() === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }

  return (
    <Button
      aria-label="Переключить тему"
      size="icon"
      type="button"
      variant="outline"
      onClick={toggleTheme}
    >
      <Sun className="theme-icon theme-icon-sun" size={18} />
      <Moon className="theme-icon theme-icon-moon" size={18} />
    </Button>
  );
}
