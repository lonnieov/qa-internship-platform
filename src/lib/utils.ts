import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "0%";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

export function formatDuration(ms: number | null | undefined) {
  if (!ms) return "0с";
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}с`;
  return `${minutes}м ${rest.toString().padStart(2, "0")}с`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
