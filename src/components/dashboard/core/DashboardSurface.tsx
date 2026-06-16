"use client";

/**
 * Production dashboard surface primitives — layout/surface only, no business logic.
 * Visual language aligned with design-preview ivory stage on dark shell.
 */

export const DASHBOARD_SHELL_BG = "#050506";
export const DASHBOARD_ACCENT = "#b4ff00";
export const DASHBOARD_TEXT = "#080808";
export const DASHBOARD_MUTED = "rgba(8,8,8,0.58)";
/** Warm ivory/stone — no gray wash, full readability */
export const DASHBOARD_STAGE_SURFACE =
  "linear-gradient(148deg, #FAF6EE 0%, #F5EFE3 46%, #EBE2D2 100%)";

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
    <div
      className={joinClasses(
        "w-full min-w-0 overflow-x-hidden px-3 py-3 md:px-3 md:py-4 lg:px-4",
        className
      )}
    >
      <div
        className="mx-auto w-full min-w-0 max-w-[96rem] rounded-xl"
        style={{
          background: DASHBOARD_STAGE_SURFACE,
          border: "1px solid rgba(8,8,8,0.08)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.35), 0 24px 64px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.72)",
        }}
      >
        <div
          className="h-[2px] w-full rounded-t-xl"
          style={{
            background: `linear-gradient(90deg, ${DASHBOARD_ACCENT}66, ${DASHBOARD_ACCENT}28 45%, transparent 88%)`,
          }}
        />
        <div
          className={joinClasses(
            "min-w-0 px-4 pb-10 pt-5 md:px-8 md:pb-12 md:pt-7 lg:px-12 xl:px-14",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
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
        "mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em]",
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
            className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl"
            style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="mt-1.5 max-w-2xl text-[13px] leading-relaxed md:text-sm"
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
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: DASHBOARD_MUTED }}
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
      className={joinClasses("rounded-xl border p-4 md:p-5", className)}
      style={{
        background: "#FFFCF7",
        borderColor: "rgba(8,8,8,0.11)",
        boxShadow:
          "0 1px 2px rgba(8,8,8,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {title ? (
        <h3
          className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: DASHBOARD_MUTED }}
        >
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}
