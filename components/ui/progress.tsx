"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn, clamp } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Callers pass percentages derived from counts, so a rounding slip must not
  // push the indicator past the track. Radix does not clamp on its own.
  const safeValue = clamp(value ?? 0, 0, 100)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]",
        className
      )}
      value={safeValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 rounded-full bg-[var(--primary)] transition-all"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
