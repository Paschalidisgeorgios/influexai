import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import type { InfluexSurfaceVariant } from "./types";

export type InfluexSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: InfluexSurfaceVariant;
  children: ReactNode;
  as?: "div" | "section" | "article";
};

const VARIANT_CLASS: Record<InfluexSurfaceVariant, string> = {
  default: "",
  elevated: "influex-surface--elevated",
  editorial: "influex-surface--editorial",
  muted: "influex-surface--muted",
  danger: "influex-surface--danger",
};

export function InfluexSurface({
  variant = "default",
  children,
  className,
  as: Tag = "div",
  ...props
}: InfluexSurfaceProps) {
  return (
    <Tag className={cn("influex-surface", VARIANT_CLASS[variant], className)} {...props}>
      {children}
    </Tag>
  );
}
