import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] px-3.5 text-[14px] leading-5 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]",
        className,
      )}
      {...props}
    />
  );
}
