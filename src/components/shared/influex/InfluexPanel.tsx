import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type InfluexPanelProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  children: ReactNode;
  headerAction?: ReactNode;
};

export function InfluexPanel({
  title,
  children,
  headerAction,
  className,
  ...props
}: InfluexPanelProps) {
  return (
    <div className={cn("influex-panel", className)} {...props}>
      {title || headerAction ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <p className="influex-panel__header mb-0">{title}</p> : <span />}
          {headerAction}
        </div>
      ) : null}
      {children}
    </div>
  );
}
