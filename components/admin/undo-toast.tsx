"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Undo2 } from "lucide-react";

type UndoToastProps = {
  /** Small glyph shown in the leading plaque (e.g. a trash or eye icon). */
  icon: ReactNode;
  title: string;
  subtitle: string;
  undoLabel: string;
  /** Seconds before the action commits. */
  seconds: number;
  /** Reddens the icon and progress bar for destructive actions. */
  danger?: boolean;
  onUndo: () => void;
};

/**
 * Neutral toast for an action that can still be undone: the card, text and
 * "Отменить" button stay neutral; only the icon and the draining progress bar
 * pick up a red accent when `danger` is set. Shows a live countdown that tracks
 * the deferred commit.
 */
export function UndoToast({
  icon,
  title,
  subtitle,
  undoLabel,
  seconds,
  danger = false,
  onUndo,
}: UndoToastProps) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={`undo-toast${danger ? " undo-toast--danger" : ""}`}>
      <div className="undo-toast-main">
        <span className="undo-toast-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="undo-toast-body">
          <strong>{title}</strong>
          <span className="undo-toast-question">{subtitle}</span>
        </div>
        <button type="button" className="undo-toast-action" onClick={onUndo}>
          <Undo2 size={14} />
          {undoLabel}
          <span className="undo-toast-count">{left}</span>
        </button>
      </div>
      <span
        className="undo-toast-progress"
        style={{ animationDuration: `${seconds}s` }}
      />
    </div>
  );
}
