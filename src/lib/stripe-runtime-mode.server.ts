import "server-only";

import { NextResponse } from "next/server";
import { isNonProductionRuntime } from "@/lib/environment-safety.server";

export type StripeDeclaredMode = "test" | "live" | "unset";
export type StripeSecretKeyKind = "test" | "live" | "missing" | "unknown";

export const STRIPE_RUNTIME_CONFIG_ERROR_CODE = "STRIPE_RUNTIME_CONFIG_BLOCKED";

export type StripeRuntimeMode = {
  declaredMode: StripeDeclaredMode;
  secretKeyKind: StripeSecretKeyKind;
  isNonProductionRuntime: boolean;
  vercelEnv: string | null;
  nodeEnv: string;
  checkoutAllowed: boolean;
  webhookAllowed: boolean;
  blockReason: string | null;
};

export class StripeRuntimeConfigError extends Error {
  readonly code = STRIPE_RUNTIME_CONFIG_ERROR_CODE;
  readonly status = 503;

  constructor(message: string) {
    super(message);
    this.name = "StripeRuntimeConfigError";
  }
}

function parseDeclaredMode(): StripeDeclaredMode {
  const raw = process.env.STRIPE_MODE?.trim().toLowerCase();
  if (raw === "test") return "test";
  if (raw === "live") return "live";
  return "unset";
}

function classifySecretKey(): StripeSecretKeyKind {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) return "missing";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unknown";
}

function resolveBlockReason(
  declaredMode: StripeDeclaredMode,
  secretKeyKind: StripeSecretKeyKind,
  isNonProduction: boolean
): string | null {
  if (secretKeyKind === "missing") {
    return "Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt).";
  }

  if (secretKeyKind === "unknown") {
    return "Stripe Secret Key hat ein unbekanntes Format.";
  }

  if (declaredMode === "test" && secretKeyKind === "live") {
    return "STRIPE_MODE=test widerspricht dem konfigurierten Live Secret Key.";
  }

  if (declaredMode === "live" && secretKeyKind === "test") {
    return "STRIPE_MODE=live widerspricht dem konfigurierten Test Secret Key.";
  }

  if (isNonProduction && secretKeyKind === "live") {
    return "Live Stripe Secret Key ist in Safe-Dev/Staging blockiert.";
  }

  if (isNonProduction && declaredMode === "live") {
    return "STRIPE_MODE=live ist in Safe-Dev/Staging blockiert.";
  }

  return null;
}

export function getStripeRuntimeMode(): StripeRuntimeMode {
  const declaredMode = parseDeclaredMode();
  const secretKeyKind = classifySecretKey();
  const isNonProduction = isNonProductionRuntime();
  const blockReason = resolveBlockReason(
    declaredMode,
    secretKeyKind,
    isNonProduction
  );
  const allowed = blockReason === null;

  return {
    declaredMode,
    secretKeyKind,
    isNonProductionRuntime: isNonProduction,
    vercelEnv: process.env.VERCEL_ENV?.trim() ?? null,
    nodeEnv: process.env.NODE_ENV ?? "development",
    checkoutAllowed: allowed,
    webhookAllowed: allowed,
    blockReason,
  };
}

export function assertStripeCheckoutRuntimeAllowed(
  operation = "checkout"
): StripeRuntimeMode {
  const mode = getStripeRuntimeMode();
  if (!mode.checkoutAllowed) {
    throw new StripeRuntimeConfigError(
      mode.blockReason ??
        `Stripe Checkout (${operation}) ist in dieser Runtime nicht erlaubt.`
    );
  }
  return mode;
}

export function assertStripeWebhookRuntimeAllowed(): StripeRuntimeMode {
  const mode = getStripeRuntimeMode();
  if (!mode.webhookAllowed) {
    throw new StripeRuntimeConfigError(
      mode.blockReason ?? "Stripe Webhook ist in dieser Runtime nicht erlaubt."
    );
  }
  return mode;
}

export type StripeEventModeCheck = {
  allowed: boolean;
  reason: string | null;
  code: typeof STRIPE_RUNTIME_CONFIG_ERROR_CODE | "STRIPE_EVENT_MODE_BLOCKED";
};

export function isStripeEventModeAllowed(
  eventLivemode: boolean
): StripeEventModeCheck {
  const mode = getStripeRuntimeMode();

  if (!mode.webhookAllowed) {
    return {
      allowed: false,
      reason: mode.blockReason,
      code: STRIPE_RUNTIME_CONFIG_ERROR_CODE,
    };
  }

  if (mode.isNonProductionRuntime && eventLivemode) {
    return {
      allowed: false,
      reason: "Live-Mode Stripe Events sind in Safe-Dev/Staging blockiert.",
      code: "STRIPE_EVENT_MODE_BLOCKED",
    };
  }

  if (
    !mode.isNonProductionRuntime &&
    !eventLivemode &&
    (mode.declaredMode === "live" || mode.secretKeyKind === "live")
  ) {
    return {
      allowed: false,
      reason: "Test-Mode Stripe Events sind in Production blockiert.",
      code: "STRIPE_EVENT_MODE_BLOCKED",
    };
  }

  return { allowed: true, reason: null, code: STRIPE_RUNTIME_CONFIG_ERROR_CODE };
}

export function stripeRuntimeConfigErrorResponse(
  error: unknown
): NextResponse | null {
  if (error instanceof StripeRuntimeConfigError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  return null;
}

export function stripeEventModeBlockedResponse(
  check: StripeEventModeCheck
): NextResponse {
  return NextResponse.json(
    {
      error: check.reason ?? "Stripe Event Mode ist in dieser Runtime blockiert.",
      code: check.code,
    },
    { status: 403 }
  );
}
