"use client";

import { cn } from "./cn";
import {
  STUDIO_RADIUS,
  STUDIO_SHADOW,
  STUDIO_STAGE_BORDER,
  STUDIO_SURFACE_GLASS,
} from "./tokens";

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
        "w-full min-w-0 px-3 py-3 md:px-4 md:py-5 lg:px-5",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto w-full min-w-0 max-w-[88rem] backdrop-blur-xl backdrop-saturate-150",
          STUDIO_RADIUS.stage
        )}
        style={{
          background: STUDIO_SURFACE_GLASS,
          border: `1px solid ${STUDIO_STAGE_BORDER}`,
          boxShadow: STUDIO_SHADOW.stage,
        }}
      >
        <div
          className={cn(
            "min-w-0 px-5 pb-12 pt-7 md:px-12 md:pb-16 md:pt-9 lg:px-16 xl:px-[4.5rem]",
            innerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
