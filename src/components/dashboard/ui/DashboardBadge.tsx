/**
 * DashboardBadge — compact status / metadata label.
 *
 * Pure presentational component. No interactivity, no business logic.
 *
 * Variant reference:
 *   active      — lime accent, tool is live
 *   preview     — blue, early access / beta
 *   comingSoon  — muted, not yet launched
 *   unknown     — muted grey, status unclear
 *   credits     — bold lime, credit cost indicator
 *   provider    — grey, AI provider name
 *   hot         — orange, trending content
 *   new         — violet, newly added feature
 */

import { badges } from "@/lib/design/dashboard-tokens";
import type { BadgeVariant } from "@/lib/design/dashboard-tokens";

export interface DashboardBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function DashboardBadge({
  variant,
  children,
  className = "",
}: DashboardBadgeProps) {
  return (
    <span className={[badges[variant], className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
