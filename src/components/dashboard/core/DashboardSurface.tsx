"use client";

/**
 * Production dashboard surface primitives — layout/surface only, no business logic.
 * Visual language aligned with Studio UI foundation (ivory stage on dark shell).
 */

import { StudioStage } from "../studio-ui/StudioStage";
import {
  STUDIO_ACCENT,
  STUDIO_MUTED,
  STUDIO_PANEL_BG,
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  STUDIO_SURFACE,
  STUDIO_TEXT,
} from "../studio-ui/tokens";

export const DASHBOARD_SHELL_BG = "#050506";
export const DASHBOARD_ACCENT = STUDIO_ACCENT;
export const DASHBOARD_TEXT = STUDIO_TEXT;
export const DASHBOARD_MUTED = STUDIO_MUTED;
export const DASHBOARD_STAGE_SURFACE = STUDIO_SURFACE;

function joinClasses(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function DashboardStage({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <StudioStage className={className} innerClassName={innerClassName}>
      {children}
    </StudioStage>
  );
}

export function DashboardKicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={joinClasses(
        "mb-2 text-xs font-medium tracking-wide",
        className
      )}
      style={{ color: DASHBOARD_MUTED }}
    >
      {children}
    </p>
  );
}

export function DashboardPageHeader({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {kicker ? <DashboardKicker>{kicker}</DashboardKicker> : null}
          <h1
            className="text-[1.75rem] font-extrabold tracking-tight sm:text-4xl md:text-[2.5rem]"
            style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.03em", lineHeight: 1.05 }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="mt-2 max-w-2xl text-sm leading-relaxed md:text-[15px]"
              style={{ color: DASHBOARD_MUTED }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="hidden shrink-0 sm:block">{action}</div> : null}
      </div>
    </div>
  );
}

export function DashboardSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={joinClasses("space-y-3", className)}>
      {title ? (
        <h2
          className="text-lg font-bold tracking-tight md:text-xl"
          style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function DashboardPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={joinClasses(STUDIO_RADIUS.panel, "p-5 md:p-6", className)}
      style={{
        background: STUDIO_PANEL_BG,
        border: "1px solid rgba(8,8,8,0.04)",
        boxShadow: STUDIO_SHADOW.panel,
      }}
    >
      {title ? (
        <h3
          className="mb-4 text-sm font-semibold tracking-tight"
          style={{ color: DASHBOARD_MUTED }}
        >
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}
