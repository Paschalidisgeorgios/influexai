export type InfluexShellVariant =
  | "marketing"
  | "auth"
  | "legal"
  | "dashboard"
  | "preview";

export type InfluexBackgroundIntensity = "subtle" | "standard" | "strong";

export type InfluexBackgroundCompatLayer = "landing-v2" | "preview" | null;

export type InfluexButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "lime"
  | "danger";

export type InfluexSurfaceVariant =
  | "default"
  | "elevated"
  | "editorial"
  | "muted"
  | "danger";

export type InfluexStatus =
  | "draft"
  | "ready_to_train"
  | "training"
  | "ready"
  | "failed"
  | "references_ready"
  | "consent_missing";
