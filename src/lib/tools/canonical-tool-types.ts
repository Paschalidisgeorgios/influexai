/**
 * canonical-tool-types.ts
 *
 * Type definitions for the canonical InfluexAI tool + credit registry.
 * Phase 1A — documentation / SSOT only. No runtime billing integration yet.
 */

/** Product-facing tool categories (broader than legacy dashboard ToolCategory). */
export type CanonicalToolCategory =
  | "nav"
  | "text"
  | "image"
  | "video"
  | "audio"
  | "live"
  | "avatar"
  | "analysis"
  | "campaign"
  | "automation"
  | "utility"
  | "api_route"
  | "preview_mock";

export type CanonicalToolStatus =
  | "active"
  | "preview"
  | "beta"
  | "coming-soon"
  | "deprecated";

export type CreditDisplayValue = number | "dynamic" | "DOCS_REQUIRED";

export type CreditPolicyMode =
  | "fixed"
  | "dynamic"
  | "per_second"
  | "per_minute"
  | "per_step"
  | "batch"
  | "free_preview"
  | "deferred"
  | "none"
  | "unknown";

export type CreditChargeTiming =
  | "prepay"
  | "postpay"
  | "deferred"
  | "none"
  | "unknown";

export type CreditRefundPolicy =
  | "auto_refund"
  | "manual_refund"
  | "no_refund"
  | "missing"
  | "not_needed";

export type CreditRuntimeSource =
  | "registry"
  | "api_route"
  | "provider_dynamic"
  | "legacy_constant"
  | "ui_estimate"
  | "unknown";

export type ConsentType =
  | "face_swap"
  | "voice_clone"
  | "avatar_from_face"
  | "lora_training"
  | "live_creator"
  | "publish_public"
  | "none";

export interface CreditPolicyVariant {
  key: string;
  label: string;
  credits: CreditDisplayValue;
  condition?: string;
}

export interface CreditPolicy {
  mode: CreditPolicyMode;
  /** What AgentBox / calculateExactCredits / tool pages show today. */
  displayedCredits: CreditDisplayValue;
  /** Fixed base when mode is fixed; null when dynamic or unknown. */
  baseCredits: number | null;
  variants?: CreditPolicyVariant[];
  chargeTiming: CreditChargeTiming;
  refundPolicy: CreditRefundPolicy;
  /** Where billing truth lives at runtime today (may differ from this registry). */
  runtimeSource: CreditRuntimeSource;
}

export interface CanonicalToolDefinition {
  id: string;
  label: string;
  description: string;
  category: CanonicalToolCategory;
  provider: string | "none" | "multiple";
  /** Primary model or engine id; DOCS_REQUIRED when catalog-driven or unclear. */
  model: string | "DOCS_REQUIRED" | "catalog" | "none";
  /** Primary API route (billing authority when api_route category). */
  route: string | null;
  /** Dashboard page path when applicable. */
  page: string | null;
  status: CanonicalToolStatus;
  /** true = real product surface; false = design-preview / mock only. */
  isProduction: boolean;
  requiresPlan: boolean;
  requiresConsent: boolean;
  consentType: ConsentType;
  inputTypes: string[];
  outputTypes: string[];
  /** UI-exposed options documented from code; DOCS_REQUIRED when not verified. */
  uiOptions: string[];
  creditPolicy: CreditPolicy;
  /** UI vs API vs legacy registry discrepancies (audit trail). */
  knownMismatches: string[];
  docsRequired: boolean;
  notes: string;
  /** Optional aliases in other registries (dashboard ToolId, agent id, canvas id). */
  aliases?: string[];
}

export interface CreditMismatchSummary {
  toolId: string;
  label: string;
  uiCredits: string;
  apiCredits: string;
  registryNote: string;
}
