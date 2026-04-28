import * as React from "react";
import { cn, clamp } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const safeValue = clamp(value, 0, 100);

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
