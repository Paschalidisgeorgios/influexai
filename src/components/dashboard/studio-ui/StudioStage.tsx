"use client";

import { cn } from "./cn";
import { STUDIO_ACCENT, STUDIO_RADIUS, STUDIO_SHADOW, STUDIO_SURFACE } from "./tokens";

export function StudioStage({
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
      className={cn(
        "w-full min-w-0 overflow-x-hidden px-3 py-3 md:px-3 md:py-4 lg:px-4",
        className
      )}
    >
      <div
        className={cn("mx-auto w-full min-w-0 max-w-[96rem]", STUDIO_RADIUS.stage)}
        style={{
          background: STUDIO_SURFACE,
          border: "1px solid rgba(8,8,8,0.06)",
          boxShadow: STUDIO_SHADOW.stage,
        }}
      >
        <div
          className={cn("h-[2px] w-full rounded-t-[32px]")}
          style={{
            background: `linear-gradient(90deg, ${STUDIO_ACCENT}55, ${STUDIO_ACCENT}22 42%, transparent 88%)`,
          }}
        />
        <div
          className={cn(
            "min-w-0 px-4 pb-10 pt-6 md:px-10 md:pb-14 md:pt-8 lg:px-14 xl:px-16",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
