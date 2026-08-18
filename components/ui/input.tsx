import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-11 w-full rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] px-3.5 text-[14px] leading-5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted-foreground)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_22%,transparent)] disabled:cursor-not-allowed disabled:bg-[var(--muted)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
