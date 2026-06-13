import type { SubscriptionPlanId } from "@/lib/subscription-plans";

export type PlanFeatureItem = {
  text: string;
  included: boolean;
};

type PaidPlanId = Exclude<SubscriptionPlanId, "free">;

/** Tiered pricing bullets — included ✓ (neon) or excluded ✗ (starter upsell only). */
export const SUBSCRIPTION_PLAN_FEATURES: Record<PaidPlanId, PlanFeatureItem[]> = {
  starter: [
    { text: "50 Credits / Monat", included: true },
    { text: "Basis Text- & Bild-Tools", included: true },
    { text: "Script Generator & Viral Hooks", included: true },
    { text: "Flux.1 Bild-Generator (Standard)", included: true },
    { text: "Alle Video-Tools (Seedance, Kling, Hailuo)", included: false },
    { text: "Agent Autopilot (Content-Planung)", included: false },
    { text: "Eigenes LoRA-Modell Training", included: false },
  ],
  creator: [
    { text: "300 Credits / Monat", included: true },
    { text: "Alle Video-Tools inklusive (Standard-Modus)", included: true },
    { text: "Agent Autopilot (Content-Planung)", included: true },
    { text: "Thumbnail Konzept & Viral Score Predictor", included: true },
    { text: "Bild-zu-Video & Video Remix", included: true },
  ],
  pro: [
    { text: "800 Credits / Monat", included: true },
    { text: "Priorisierte Server-Warteschlange (Keine Wartezeit)", included: true },
    { text: "High-Res & Ultra HQ Video-Rendering (Kling Omni)", included: true },
    { text: "Mein KI-Ich & Avatar Studio (Face Swap)", included: true },
    { text: "Stimme, Musik & Eigenes LoRA-Modell Training", included: true },
  ],
  business: [
    { text: "2.500 Credits / Monat", included: true },
    { text: "Unbegrenzte Team-Mitglieder & Workspaces", included: true },
    { text: "Voller Developer API Zugriff", included: true },
    { text: "Niche Analyzer & Deep Outlier Detector", included: true },
    { text: "Whitelabel-Management & VIP-Support", included: true },
  ],
};

export function getPlanCreditsLabel(plan: PaidPlanId): string {
  const first = SUBSCRIPTION_PLAN_FEATURES[plan].find((f) => f.included);
  return first?.text ?? "";
}

export function getPlanDeltaLabel(plan: PaidPlanId): string {
  const deltas: Record<PaidPlanId, string> = {
    starter: "Einstieg · Text, Hooks & Flux Standard",
    creator: "Video-Suite · Agent & Viral Score",
    pro: "HQ-Rendering · Avatar, Stimme & LoRA",
    business: "2.500 Credits · Team, API & Whitelabel",
  };
  return deltas[plan];
}
