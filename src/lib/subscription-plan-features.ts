import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";
import { formatMonthlyCreditsLabel } from "@/lib/pricing-surface";

export type PlanFeatureItem = {
  text: string;
  included: boolean;
};

type PaidPlanId = Exclude<SubscriptionPlanId, "free">;

/** Tiered pricing bullets — included ✓ (neon) or excluded ✗ (starter upsell only). */
export const SUBSCRIPTION_PLAN_FEATURES: Record<PaidPlanId, PlanFeatureItem[]> = {
  starter: [
    {
      text: formatMonthlyCreditsLabel(SUBSCRIPTION_PLANS.starter.monthlyCredits),
      included: true,
    },
    { text: "Basis Text- & Bild-Tools", included: true },
    { text: "Script Generator & Viral Hooks", included: true },
    { text: "Flux.1 Bild-Generator (Standard)", included: true },
    { text: "Alle Video-Tools (Seedance, Kling, Hailuo)", included: true },
    { text: "Agent Autopilot (Content-Planung)", included: true },
    { text: "Eigenes LoRA-Modell Training", included: true },
  ],
  creator: [
    {
      text: formatMonthlyCreditsLabel(SUBSCRIPTION_PLANS.creator.monthlyCredits),
      included: true,
    },
    { text: "Alle Video-Tools inklusive (Standard-Modus)", included: true },
    { text: "Agent Autopilot (Content-Planung)", included: true },
    { text: "Eigenes LoRA-Modell Training", included: true },
    { text: "Thumbnail Konzept & Viral Score Predictor", included: true },
    { text: "Bild-zu-Video & Video Remix", included: true },
  ],
  pro: [
    {
      text: formatMonthlyCreditsLabel(SUBSCRIPTION_PLANS.pro.monthlyCredits),
      included: true,
    },
    { text: "Priorisierte Server-Warteschlange (Keine Wartezeit)", included: true },
    { text: "High-Res & Ultra HQ Video-Rendering (Kling Omni)", included: true },
    { text: "Mein KI-Ich & Avatar Studio (Face Swap)", included: true },
    { text: "Voice Clone, Musik & Ultra-HQ Video-Pipeline", included: true },
  ],
  business: [
    {
      text: formatMonthlyCreditsLabel(SUBSCRIPTION_PLANS.business.monthlyCredits),
      included: true,
    },
    { text: "Team-Zugriff & mehrere Workspaces", included: true },
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
  const credits = SUBSCRIPTION_PLANS[plan].monthlyCredits;
  const deltas: Record<PaidPlanId, string> = {
    starter: `${formatMonthlyCreditsLabel(credits).replace(" / Monat", "")} · Video, Agent & LoRA inklusive`,
    creator: `${formatMonthlyCreditsLabel(credits).replace(" / Monat", "")} · Viral Score & Thumbnail Konzept`,
    pro: `${formatMonthlyCreditsLabel(credits).replace(" / Monat", "")} · HQ-Rendering · Avatar, Stimme & Priorität`,
    business: `${formatMonthlyCreditsLabel(credits).replace(" / Monat", "")} · Team, API & Whitelabel`,
  };
  return deltas[plan];
}
