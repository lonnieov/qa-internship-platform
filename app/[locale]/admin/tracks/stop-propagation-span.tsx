"use client";

import { ComponentPropsWithoutRef } from "react";

export function StopPropagationSpan(
  props: ComponentPropsWithoutRef<"span">
) {
  return (
    <span
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(e);
      }}
    />
  );
}
