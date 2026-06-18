import type { ReactNode } from "react";
import { cn } from "./cn";
import { InfluexBackgroundSystem } from "./InfluexBackgroundSystem";
import type { InfluexBackgroundIntensity, InfluexShellVariant } from "./types";

export type InfluexPageShellProps = {
  variant?: InfluexShellVariant;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  backgroundIntensity?: InfluexBackgroundIntensity;
  withToolbarSpace?: boolean;
  withBackground?: boolean;
};

/** Shared dark page frame with optional background system */
export function InfluexPageShell({
  variant = "marketing",
  children,
  className,
  contentClassName,
  backgroundIntensity = "standard",
  withToolbarSpace = false,
  withBackground = true,
}: InfluexPageShellProps) {
  return (
    <div
      className={cn(
        "influex-page-shell",
        withToolbarSpace && "influex-page-shell--toolbar-space",
        className
      )}
    >
      {withBackground ? (
        <InfluexBackgroundSystem variant={variant} intensity={backgroundIntensity} />
      ) : null}
      <div className={cn("influex-page-shell__content", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
