"use client";

import { cn } from "./cn";
import {
  STUDIO_MUTED,
  STUDIO_PANEL_BG,
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  STUDIO_STAGE_BORDER,
  STUDIO_TEXT,
} from "./tokens";

export function ToolSetupLayout({
  context,
  setup,
  className,
}: {
  context: React.ReactNode;
  setup: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full min-w-0 max-w-full grid-cols-1 gap-6 min-[1536px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-[1536px]:gap-8",
        className
      )}
    >
      <div className="min-w-0 space-y-4 min-[1536px]:sticky min-[1536px]:top-6 min-[1536px]:self-start">
        {context}
      </div>
      <div className="min-w-0 w-full max-w-full">{setup}</div>
    </div>
  );
}

export function ToolSetupContext({
  kicker,
  title,
  subtitle,
  credit,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  credit?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      {kicker ? (
        <p
          className="text-xs font-medium tracking-wide"
          style={{ color: STUDIO_MUTED }}
        >
          {kicker}
        </p>
      ) : null}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1
            className="text-2xl font-extrabold tracking-tight md:text-3xl lg:text-[2rem]"
            style={{ color: STUDIO_TEXT, letterSpacing: "-0.03em" }}
          >
            {title}
          </h1>
          {credit}
        </div>
        {subtitle ? (
          <p className="max-w-md text-sm leading-relaxed md:text-[15px]" style={{ color: STUDIO_MUTED }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ToolSetupSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(STUDIO_RADIUS.panel, "border backdrop-blur-sm p-5 md:p-7", className)}
      style={{
        background: STUDIO_PANEL_BG,
        borderColor: STUDIO_STAGE_BORDER,
        boxShadow: STUDIO_SHADOW.panel,
      }}
    >
      {children}
    </div>
  );
}
