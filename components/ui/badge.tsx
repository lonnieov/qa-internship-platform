import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--coin-blue-12)] text-[color:var(--primary)]",
  success: "bg-[var(--coin-green-12)] text-[color:var(--accent)]",
  warning: "bg-[var(--coin-orange-12)] text-[color:var(--warning)]",
  danger: "bg-[var(--coin-red-12)] text-[color:var(--destructive)]",
  muted: "bg-[var(--muted)] text-[color:var(--muted-foreground)]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium leading-4",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
