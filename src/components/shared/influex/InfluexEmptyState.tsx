import type { ReactNode } from "react";
import { cn } from "./cn";
import { InfluexButton } from "./InfluexButton";

export type InfluexEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  children?: ReactNode;
};

export function InfluexEmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  className,
  children,
}: InfluexEmptyStateProps) {
  return (
    <div className={cn("influex-empty", className)}>
      {icon}
      <h3 className="influex-empty__title">{title}</h3>
      {description ? <p className="influex-empty__body">{description}</p> : null}
      {children}
      {actionLabel && actionHref ? (
        <InfluexButton href={actionHref} variant="secondary" size="sm">
          {actionLabel}
        </InfluexButton>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <InfluexButton type="button" variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </InfluexButton>
      ) : null}
    </div>
  );
}
