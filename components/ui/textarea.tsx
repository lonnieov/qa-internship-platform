import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-24 w-full rounded-[8px] border-[1.5px] border-[var(--input)] bg-[var(--card)] px-3 py-3 text-[14px] leading-5 text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted-foreground)] focus:border-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--muted)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
