import "server-only";

import { NextResponse } from "next/server";

/** Documented production Supabase project ref (repo docs / SETUP). Override via env if needed. */
const DEFAULT_PRODUCTION_SUPABASE_REF =
  process.env.PRODUCTION_SUPABASE_PROJECT_REF?.trim() || "hszjafdelcydnppyolkm";

export const DEV_WRITE_GUARD_CODE = "DEV_WRITE_GUARD_BLOCKED";

export const DEV_WRITE_GUARD_MESSAGE =
  "Diese mutierende Aktion ist in dieser lokalen/Preview-Umgebung blockiert, weil Production-ähnliche Ressourcen erkannt wurden.";

export type ProductionLikeSignal =
  | "supabase_production_ref"
  | "stripe_live_secret"
  | "stripe_live_publishable"
  | "provider_keys_active"
  | "service_role_present";

export type DevelopmentEnvironmentAssessment = {
  isNonProductionRuntime: boolean;
  overrideActive: boolean;
  productionLikeSignals: ProductionLikeSignal[];
  shouldBlockMutatingWrites: boolean;
};

function extractSupabaseProjectRef(url: string): string | null {
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

function maskProjectRef(ref: string | null): string | null {
  if (!ref) return null;
  if (ref.length <= 4) return `${ref}***`;
  return `${ref.slice(0, 4)}***`;
}

/**
 * Non-production runtimes where mutating writes against production-like env must be blocked.
 * Only Vercel production (`VERCEL_ENV=production`) is always exempt.
 */
export function isNonProductionRuntime(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "production") return false;
  if (vercelEnv === "preview" || vercelEnv === "development") return true;
  if (process.env.NODE_ENV === "development") return true;
  // Local `next start`: NODE_ENV=production without VERCEL_ENV — treat as unsafe local runtime.
  if (!vercelEnv) return true;
  return false;
}

export function isProductionSupabaseRef(ref: string | null | undefined): boolean {
  if (!ref) return false;
  return ref === DEFAULT_PRODUCTION_SUPABASE_REF;
}

function providersExplicitlyDisabled(): boolean {
  const flag = process.env.PROVIDERS_DISABLED?.trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

/** True when external AI providers must not be invoked (staging/safe-dev). */
export function areProvidersExplicitlyDisabled(): boolean {
  return providersExplicitlyDisabled();
}

function hasActiveProviderKeys(): boolean {
  if (providersExplicitlyDisabled()) return false;
  const fal = process.env.FAL_API_KEY?.trim() || process.env.FAL_KEY?.trim();
  const akool =
    process.env.AKOOL_API_KEY?.trim() ||
    (process.env.AKOOL_CLIENT_ID?.trim() && process.env.AKOOL_CLIENT_SECRET?.trim());
  return Boolean(fal || akool);
}

export function detectProductionLikeSignals(): ProductionLikeSignal[] {
  const signals: ProductionLikeSignal[] = [];

  const supabaseRef = extractSupabaseProjectRef(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  );
  if (isProductionSupabaseRef(supabaseRef)) {
    signals.push("supabase_production_ref");
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (stripeSecret.startsWith("sk_live_")) {
    signals.push("stripe_live_secret");
  }

  const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  if (stripePublishable.startsWith("pk_live_")) {
    signals.push("stripe_live_publishable");
  }

  if (hasActiveProviderKeys()) {
    signals.push("provider_keys_active");
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    signals.push("service_role_present");
  }

  return signals;
}

export function isDevelopmentWriteOverrideActive(): boolean {
  return (
    process.env.ALLOW_PRODUCTION_DEV_WRITES === "true" &&
    process.env.I_UNDERSTAND_PRODUCTION_WRITES === "true"
  );
}

function warnPartialOverrideIfNeeded(): void {
  const allow = process.env.ALLOW_PRODUCTION_DEV_WRITES === "true";
  const understand = process.env.I_UNDERSTAND_PRODUCTION_WRITES === "true";
  if ((allow || understand) && !isDevelopmentWriteOverrideActive()) {
    console.warn(
      "[dev-write-guard] Partial override ignored — both ALLOW_PRODUCTION_DEV_WRITES=true and I_UNDERSTAND_PRODUCTION_WRITES=true are required."
    );
  }
}

export function assessDevelopmentEnvironment(): DevelopmentEnvironmentAssessment {
  const isNonProduction = isNonProductionRuntime();
  warnPartialOverrideIfNeeded();
  const overrideActive = isDevelopmentWriteOverrideActive();
  const productionLikeSignals = isNonProduction ? detectProductionLikeSignals() : [];

  if (overrideActive && isNonProduction && productionLikeSignals.length > 0) {
    console.warn(
      "[dev-write-guard] Override active — mutating writes allowed in non-production runtime with production-like resources.",
      {
        signals: productionLikeSignals,
        supabaseRef: maskProjectRef(
          extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
        ),
      }
    );
  }

  const shouldBlockMutatingWrites =
    isNonProduction &&
    productionLikeSignals.length > 0 &&
    !overrideActive;

  return {
    isNonProductionRuntime: isNonProduction,
    overrideActive,
    productionLikeSignals,
    shouldBlockMutatingWrites,
  };
}

/** Returns true when mutating writes must be blocked in this runtime. */
export function shouldBlockDevelopmentMutatingWrites(): boolean {
  return assessDevelopmentEnvironment().shouldBlockMutatingWrites;
}

/** Use at the start of mutating API handlers. Returns 403 response or null if allowed. */
export function developmentWriteGuardResponse(): NextResponse | null {
  if (!shouldBlockDevelopmentMutatingWrites()) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      code: DEV_WRITE_GUARD_CODE,
      error: DEV_WRITE_GUARD_MESSAGE,
    },
    { status: 403 }
  );
}

/** Human-readable dev warnings for UI (no secrets). Development runtime only. */
export function getDevelopmentEnvironmentWarningLabels(): string[] {
  if (process.env.NODE_ENV !== "development") return [];

  const labels: string[] = [];
  const supabaseRef = extractSupabaseProjectRef(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  );

  if (isProductionSupabaseRef(supabaseRef)) {
    labels.push("Supabase zeigt auf eine Production-ähnliche Instanz");
  }

  if (process.env.STRIPE_SECRET_KEY?.trim().startsWith("sk_live_")) {
    labels.push("Stripe Secret Key ist im Live-Modus");
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim().startsWith("pk_live_")) {
    labels.push("Stripe Publishable Key ist im Live-Modus");
  }

  if (hasActiveProviderKeys()) {
    labels.push("Provider-Keys (FAL/Akool) sind aktiv");
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    labels.push("Service Role Key ist lokal gesetzt");
  }

  if (shouldBlockDevelopmentMutatingWrites()) {
    labels.push("Mutierende API-Schreibzugriffe sind blockiert (Dev Write Guard)");
  }

  return labels;
}

export function shouldShowDevelopmentEnvironmentHint(): boolean {
  return getDevelopmentEnvironmentWarningLabels().length > 0;
}
