import type { HTMLAttributes } from "react";
import { cn } from "./cn";
import type { InfluexStatus } from "./types";

const STATUS_LABEL: Record<InfluexStatus, string> = {
  draft: "Entwurf",
  ready_to_train: "Bereit zum Training",
  training: "Training läuft",
  ready: "Bereit",
  failed: "Fehlgeschlagen",
  references_ready: "Referenzen bereit",
  consent_missing: "Einwilligung fehlt",
};

export type InfluexStatusPillProps = HTMLAttributes<HTMLSpanElement> & {
  status: InfluexStatus;
  label?: string;
  showDot?: boolean;
};

export function InfluexStatusPill({
  status,
  label,
  showDot = true,
  className,
  ...props
}: InfluexStatusPillProps) {
  return (
    <span
      className={cn("influex-status-pill", `influex-status-pill--${status}`, className)}
      {...props}
    >
      {showDot ? <span className="influex-status-pill__dot" aria-hidden /> : null}
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
