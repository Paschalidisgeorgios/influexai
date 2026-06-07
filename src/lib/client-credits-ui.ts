"use client";

import { isCreditExemptEmail } from "@/lib/access";

export type NoCreditsModalDetail = {
  required?: number;
  remaining?: number;
  /** Skip prompt and open the package grid directly */
  showPackages?: boolean;
};

export type UpgradePromptDetail = {
  cost: number;
  remaining: number;
};

const UPGRADE_EVENT = "influex-upgrade-prompt";
const GENERATION_EVENT = "influex-generation-complete";
const BUY_CREDITS_EVENT = "open-buy-credits";

const CREDIT_ERROR_RE =
  /nicht genug credit|not enough credit|insufficient credit/i;

let clientCreditExempt = false;

/** Set from authenticated session email (BuyCreditsProvider) — UI only; server enforces separately. */
export function setClientCreditExempt(exempt: boolean): void {
  clientCreditExempt = exempt;
}

export function isClientCreditExempt(): boolean {
  return clientCreditExempt;
}

export function syncClientCreditExemptFromEmail(email?: string | null): void {
  setClientCreditExempt(isCreditExemptEmail(email));
}

export function isInsufficientCreditsMessage(message: string | undefined): boolean {
  if (!message) return false;
  return CREDIT_ERROR_RE.test(message);
}

export function parseRequiredCreditsFromError(error: string): number | undefined {
  const match = error.match(/(\d+)\s*(?:benötigt|required|Credits?\s+pro)/i);
  if (!match) return undefined;
  return Number.parseInt(match[1]!, 10);
}

export function openNoCreditsModal(detail?: NoCreditsModalDetail): void {
  if (typeof window === "undefined") return;
  if (clientCreditExempt) return;
  window.dispatchEvent(
    new CustomEvent<NoCreditsModalDetail>(BUY_CREDITS_EVENT, { detail })
  );
}

/** @deprecated Use openNoCreditsModal */
export function showUpgradePrompt(detail: UpgradePromptDetail) {
  openNoCreditsModal({
    required: detail.cost,
    remaining: detail.remaining,
  });
}

export function openBuyCreditsModal(detail?: NoCreditsModalDetail): void {
  openNoCreditsModal({ showPackages: true, ...detail });
}

export function onBuyCreditsRequest(
  handler: (detail?: NoCreditsModalDetail) => void
): () => void {
  const fn = (e: Event) => {
    const ev = e as CustomEvent<NoCreditsModalDetail | undefined>;
    handler(ev.detail);
  };
  window.addEventListener(BUY_CREDITS_EVENT, fn);
  return () => window.removeEventListener(BUY_CREDITS_EVENT, fn);
}

/** Call when an API returns 402 / insufficient credits. */
export function handleApiInsufficientCredits(
  status: number,
  data?: { error?: string; credits?: number; required?: number },
  fallbackRequired?: number
): boolean {
  if (clientCreditExempt) return false;

  const message = data?.error;
  if (status !== 402 && !isInsufficientCreditsMessage(message)) {
    return false;
  }

  const remaining =
    typeof data?.credits === "number" ? data.credits : undefined;
  const required =
    typeof data?.required === "number"
      ? data.required
      : (message ? parseRequiredCreditsFromError(message) : undefined) ??
        fallbackRequired;

  openNoCreditsModal({
    required,
    remaining,
  });
  return true;
}

/** Fired when new images/videos land in the user gallery cache. */
export function notifyGenerationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("generations-updated"));
}

/** Call after successful generation with remaining credits. */
export function notifyGenerationComplete(remaining: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GENERATION_EVENT, { detail: { remaining } })
  );
  window.dispatchEvent(new Event("credits-updated"));
  notifyGenerationsUpdated();
}

export function onUpgradePrompt(
  handler: (detail: UpgradePromptDetail) => void
): () => void {
  const fn = (e: Event) => {
    const ev = e as CustomEvent<UpgradePromptDetail>;
    if (ev.detail) handler(ev.detail);
  };
  window.addEventListener(UPGRADE_EVENT, fn);
  return () => window.removeEventListener(UPGRADE_EVENT, fn);
}

export function onGenerationComplete(
  handler: (detail: { remaining: number }) => void
): () => void {
  const fn = (e: Event) => {
    const ev = e as CustomEvent<{ remaining: number }>;
    if (ev.detail) handler(ev.detail);
  };
  window.addEventListener(GENERATION_EVENT, fn);
  return () => window.removeEventListener(GENERATION_EVENT, fn);
}

export function handleInsufficientCredits(
  remaining: number,
  required: number
): boolean {
  if (clientCreditExempt || remaining >= required) return false;
  openNoCreditsModal({ required, remaining });
  return true;
}

export function isCreditShortfallResult(res: {
  success: false;
  error?: string;
  credits?: number;
  required?: number;
}): boolean {
  if (clientCreditExempt) return false;
  if (
    typeof res.credits === "number" &&
    typeof res.required === "number" &&
    res.credits < res.required
  ) {
    return true;
  }
  return isInsufficientCreditsMessage(res.error);
}

export function handleGenerationCreditError(res: {
  success: false;
  error?: string;
  credits?: number;
  required?: number;
}): boolean {
  if (clientCreditExempt) return false;
  if (
    typeof res.credits === "number" &&
    typeof res.required === "number" &&
    res.credits < res.required
  ) {
    return handleInsufficientCredits(res.credits, res.required);
  }
  if (isInsufficientCreditsMessage(res.error)) {
    openNoCreditsModal();
    return true;
  }
  return false;
}

export function shouldShowInlineGenerationError(res: {
  success: boolean;
  error?: string;
  credits?: number;
  required?: number;
}): boolean {
  if (res.success) return false;
  return !isCreditShortfallResult(
    res as { success: false; error?: string; credits?: number; required?: number }
  );
}

/** Call when an API returns 403 PLAN_REQUIRED. */
export function handleApiPlanRequired(): void {
  if (typeof window === "undefined") return;
  window.location.href = "/pricing";
}
