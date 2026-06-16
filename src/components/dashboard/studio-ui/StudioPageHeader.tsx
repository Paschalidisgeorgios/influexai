"use client";

import { cn } from "./cn";
import { STUDIO_MUTED, STUDIO_TEXT } from "./tokens";

export function StudioPageHeader({
  kicker,
  title,
  subtitle,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 md:mb-10", className)}>
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          {kicker ? (
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: STUDIO_MUTED }}
            >
              {kicker}
            </p>
          ) : null}
          <h1
            className="text-[1.75rem] font-extrabold tracking-tight sm:text-4xl md:text-[2.5rem]"
            style={{ color: STUDIO_TEXT, letterSpacing: "-0.03em", lineHeight: 1.05 }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className="max-w-2xl text-sm leading-relaxed md:text-[15px]"
              style={{ color: STUDIO_MUTED }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
