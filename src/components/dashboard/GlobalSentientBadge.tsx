"use client";

import { useEffect } from "react";
import { useDashboardTool } from "@/contexts/DashboardToolContext";
import { useSentientBadge } from "@/hooks/useSentientBadge";

export function GlobalSentientBadge() {
  const { registerBadgeHandler, activeTool, toolConfig } = useDashboardTool();
  const { message, badgeVisible, showMessage } = useSentientBadge(false);

  useEffect(() => {
    registerBadgeHandler(showMessage);
  }, [registerBadgeHandler, showMessage]);

  const idleLabel =
    activeTool && toolConfig
      ? `● AI CORE · ${toolConfig.label.toUpperCase()}`
      : "● AI CORE: ACTIVE";

  const displayText = message.startsWith("●") ? message : message || idleLabel;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-[72px] z-[60] max-w-[min(92vw,560px)] -translate-x-1/2 md:top-[68px]"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-md transition-all duration-[1200ms] ease-in-out"
        style={{
          borderWidth: "0.5px",
          borderColor: "var(--dash-theme-accent-25)",
          background: "var(--dash-theme-accent-08)",
          opacity: badgeVisible ? 1 : 0.85,
        }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full"
          style={{ background: "var(--dash-theme-accent)" }}
          aria-hidden
        />
        <span
          className="text-[10px] uppercase tracking-[1.5px] transition-opacity duration-300"
          style={{ color: "rgba(255,255,255,0.78)", opacity: badgeVisible ? 1 : 0 }}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
}
