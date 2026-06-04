"use client";

export type UpgradePromptDetail = {
  cost: number;
  remaining: number;
};

const UPGRADE_EVENT = "influex-upgrade-prompt";
const GENERATION_EVENT = "influex-generation-complete";

export function showUpgradePrompt(detail: UpgradePromptDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(UPGRADE_EVENT, { detail }));
}

/** Call after successful generation with remaining credits. */
export function notifyGenerationComplete(remaining: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GENERATION_EVENT, { detail: { remaining } })
  );
  window.dispatchEvent(new Event("credits-updated"));
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
  if (remaining >= required) return false;
  if (remaining < 3) {
    showUpgradePrompt({ cost: required, remaining });
  }
  return true;
}
