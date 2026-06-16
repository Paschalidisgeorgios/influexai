"use client";

/**
 * Production dashboard surface primitives — layout/surface only, no business logic.
 * Visual language aligned with design-preview ivory stage on dark shell.
 */

export const DASHBOARD_SHELL_BG = "#050506";
export const DASHBOARD_ACCENT = "#b4ff00";
export const DASHBOARD_TEXT = "#080808";
export const DASHBOARD_MUTED = "rgba(8,8,8,0.45)";
export const DASHBOARD_STAGE_SURFACE =
  "linear-gradient(135deg, rgba(244,240,232,0.90), rgba(244,240,232,0.78), rgba(221,212,196,0.68))";

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
        "w-full min-w-0 overflow-x-hidden px-3 py-3 md:px-[5%] md:py-5 lg:px-[4%]",
        className
      )}
    >
      <div
        className="mx-auto w-full min-w-0 max-w-[96rem] rounded-xl backdrop-blur-2xl"
        style={{
          background: DASHBOARD_STAGE_SURFACE,
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04), 0 28px 88px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.42)",
        }}
      >
        <div
          className="h-[2px] w-full rounded-t-xl"
          style={{
            background: `linear-gradient(90deg, ${DASHBOARD_ACCENT}55, ${DASHBOARD_ACCENT}22 40%, transparent 85%)`,
          }}
        />
        <div
          className={joinClasses(
            "min-w-0 px-4 pb-8 pt-5 md:px-10 md:pb-12 md:pt-8 lg:px-14",
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
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between md:mb-10">
      <div className="min-w-0">
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
      {action ? <div className="shrink-0">{action}</div> : null}
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
        background: "rgba(255,255,255,0.42)",
        borderColor: "rgba(8,8,8,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
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
