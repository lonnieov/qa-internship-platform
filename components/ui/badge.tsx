import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--muted)] text-[var(--primary)]",
  success: "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]",
  warning: "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-[var(--warning)]",
  danger:
    "bg-[color-mix(in_srgb,var(--destructive)_16%,transparent)] text-[var(--destructive)]",
  muted: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 text-[12.5px] font-semibold leading-4",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
