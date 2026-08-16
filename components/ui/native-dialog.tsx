"use client";

import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type NativeDialogProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function NativeDialog({
  ariaLabel,
  children,
  className,
  labelledBy,
  onOpenChange,
  open,
}: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsClient(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleClose() {
      onOpenChange(false);
    }

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleClose);
    };
    // `open` is a dependency because the <dialog> is only rendered while open:
    // on the first run the ref is still null, and onOpenChange never changes,
    // so without it the listeners would never be attached at all.
  }, [onOpenChange, open]);

  function handleLightDismiss(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;

    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (!isInsideDialog && dialog.open) {
      dialog.close();
      onOpenChange(false);
    }
  }

  if (!isClient || !open) return null;

  return createPortal(
    <dialog
      {...{ closedby: "any" }}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-modal="true"
      className={["native-dialog", className].filter(Boolean).join(" ")}
      onClick={handleLightDismiss}
      ref={dialogRef}
    >
      {children}
    </dialog>,
    document.body,
  );
}
