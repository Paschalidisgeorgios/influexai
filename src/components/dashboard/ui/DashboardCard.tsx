"use client";

/**
 * DashboardCard — generic surface primitive.
 *
 * Pure visual wrapper — no business logic, no API calls, no tool registry.
 * Use variant to pick the right surface feel; pass onClick only for
 * interactive cards (automatically switches to cursor-pointer + hover).
 */

import { type MouseEvent } from "react";
import { cards, focus } from "@/lib/design/dashboard-tokens";
import type { CardVariant } from "@/lib/design/dashboard-tokens";

export interface DashboardCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  /** Forwarded to the root div for testing or aria purposes */
  role?: string;
  "aria-label"?: string;
}

export function DashboardCard({
  children,
  variant = "default",
  className = "",
  onClick,
  role,
  "aria-label": ariaLabel,
}: DashboardCardProps) {
  const base = cards[variant];

  // If an onClick is supplied but the variant is not interactive, add
  // interactive hover cues automatically so callers don't have to remember.
  const clickable =
    onClick !== undefined && variant !== "interactive"
      ? "cursor-pointer transition-colors hover:border-white/10"
      : "";

  const focusRing = onClick !== undefined ? focus.default : "";

  return (
    <div
      className={[base, clickable, focusRing, className].filter(Boolean).join(" ")}
      onClick={onClick}
      role={role ?? (onClick !== undefined ? "button" : undefined)}
      tabIndex={onClick !== undefined ? 0 : undefined}
      onKeyDown={
        onClick !== undefined
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e as unknown as MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
