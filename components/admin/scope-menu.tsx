"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type ScopeMenuProps = {
  /** Visible trigger text. Omitted for icon-only menus. */
  label?: ReactNode;
  /** Accessible name, e.g. "Трек: QA". */
  ariaLabel: string;
  /** Rendered inside the trigger, before the caret. */
  icon?: ReactNode;
  /** Menu contents: links and forms rendered on the server. */
  children: ReactNode;
  align?: "start" | "end";
  disabled?: boolean;
};

/**
 * Small popover used by the question bank scope bar. Every item either
 * navigates or submits a form, so any click inside closes the menu — but only
 * on the next frame: closing synchronously would unmount the <form> before the
 * browser hands the submit off to the server action, silently dropping it.
 */
export function ScopeMenu({
  label,
  ariaLabel,
  icon,
  children,
  align = "start",
  disabled = false,
}: ScopeMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="scope-menu" ref={containerRef}>
      <button
        aria-controls={open ? popupId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={`scope-menu-trigger ${label ? "" : "icon-only"}`}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        {icon}
        {label ? <span className="scope-menu-trigger-label">{label}</span> : null}
        {label ? <ChevronDown size={14} /> : null}
      </button>

      {open ? (
        <div
          className={`scope-menu-popup align-${align}`}
          id={popupId}
          onClick={() => {
            window.requestAnimationFrame(() => setOpen(false));
          }}
          role="menu"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
