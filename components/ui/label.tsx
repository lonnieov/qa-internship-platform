import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-[12.5px] font-semibold leading-4 text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}
