import type { ReactNode } from "react";
import { Construction } from "lucide-react";

export function InProgressOverlay({
  badgeLabel = "In progress",
  title = "In progress",
  description = "This section is visible in v2 UI, but the backing behavior is not connected yet.",
  compact = false,
  children,
}: {
  badgeLabel?: string;
  title?: string;
  description?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`in-progress-overlay${compact ? " in-progress-overlay--compact" : ""}`}>
      <div className="in-progress-overlay__backdrop" />
      <div className="in-progress-overlay__card">
        <span className="in-progress-overlay__badge">
          <Construction size={14} />
          {badgeLabel}
        </span>
        <strong>{title}</strong>
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}
