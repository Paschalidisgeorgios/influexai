import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type InfluexBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "lime" | "muted";
  children: ReactNode;
};

const TONE_CLASS = {
  default: "",
  lime: "influex-badge--lime",
  muted: "influex-badge--muted",
} as const;

export function InfluexBadge({
  tone = "default",
  children,
  className,
  ...props
}: InfluexBadgeProps) {
  return (
    <span className={cn("influex-badge", TONE_CLASS[tone], className)} {...props}>
      {children}
    </span>
  );
}
