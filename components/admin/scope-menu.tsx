"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const ScopeMenuCloseContext = createContext<(() => void) | null>(null);

/**
 * Small popover used by the question bank scope bar. Radix supplies the
 * dismiss, focus and keyboard behaviour; what stays hand-written is when the
 * menu closes. Every item either navigates or submits a form, and closing on
 * the same tick would unmount the <form> before the browser hands the submit
 * off to the server action, silently dropping it — so the close is deferred to
 * the next frame.
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
  const closeNextFrame = () =>
    window.requestAnimationFrame(() => setOpen(false));

  return (
    <ScopeMenuCloseContext.Provider value={closeNextFrame}>
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger
          aria-label={ariaLabel}
          className={`scope-menu-trigger ${label ? "" : "icon-only"}`}
          disabled={disabled}
        >
          {icon}
          {label ? (
            <span className="scope-menu-trigger-label">{label}</span>
          ) : null}
          {label ? <ChevronDown size={14} /> : null}
        </DropdownMenuTrigger>

        <DropdownMenuContent align={align} className="scope-menu-popup">
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </ScopeMenuCloseContext.Provider>
  );
}

/**
 * Wraps a single link or submit button so Radix treats it as a menu item —
 * giving it arrow-key navigation and the right role — without swallowing the
 * click that navigates or submits.
 */
export function ScopeMenuItem({ children }: { children: ReactNode }) {
  const closeNextFrame = useContext(ScopeMenuCloseContext);

  return (
    <DropdownMenuItem
      asChild
      // preventDefault stops Radix from closing the menu synchronously; the
      // deferred close above runs once the click has done its work.
      onSelect={(event) => {
        event.preventDefault();
        closeNextFrame?.();
      }}
    >
      {children}
    </DropdownMenuItem>
  );
}
