import { normalizePlan, type SubscriptionPlanId } from "@/lib/subscription-plans";
import { canUseFeature, type AccessUser } from "@/lib/access";

export type GatedFeature =
  | "video-remix"
  | "ki-ich"
  | "face-swap"
  | "produkt-ads"
  | "voice-clone"
  | "live-creator"
  | "music-studio"
  | "viral-score"
  | "competitor"
  | "master-agent"
  | "lora-training"
  | "white-label"
  | "api";

export const FEATURE_MIN_PLAN: Record<GatedFeature, SubscriptionPlanId> = {
  "video-remix": "creator",
  "ki-ich": "creator",
  "face-swap": "creator",
  "produkt-ads": "creator",
  "voice-clone": "creator",
  "live-creator": "pro",
  "music-studio": "pro",
  "viral-score": "creator",
  competitor: "creator",
  "master-agent": "pro",
  "lora-training": "creator",
  "white-label": "business",
  api: "business",
};

/** Longest-prefix match for dashboard routes */
const ROUTE_GATES: { prefix: string; feature: GatedFeature }[] = [
  { prefix: "/dashboard/agent", feature: "master-agent" },
  { prefix: "/dashboard/viral-score", feature: "viral-score" },
  { prefix: "/dashboard/competitor", feature: "competitor" },
  { prefix: "/dashboard/live-creator-new", feature: "face-swap" },
  { prefix: "/dashboard/live-creator", feature: "live-creator" },
  { prefix: "/dashboard/video-remix", feature: "video-remix" },
  { prefix: "/dashboard/ki-ich", feature: "ki-ich" },
  { prefix: "/dashboard/produkt", feature: "produkt-ads" },
  { prefix: "/dashboard/voice", feature: "voice-clone" },
  { prefix: "/dashboard/lora-training", feature: "lora-training" },
  { prefix: "/dashboard/white-label", feature: "white-label" },
  { prefix: "/dashboard/api", feature: "api" },
];

export function getRouteGate(
  pathname: string
): { feature: GatedFeature; minPlan: SubscriptionPlanId } | null {
  const match = ROUTE_GATES.find((r) => pathname.startsWith(r.prefix));
  if (!match) return null;
  return { feature: match.feature, minPlan: FEATURE_MIN_PLAN[match.feature] };
}

export function isRouteAllowed(
  pathname: string,
  user: AccessUser | string | null | undefined
): boolean {
  const gate = getRouteGate(pathname);
  if (!gate) return true;
  const accessUser: AccessUser =
    typeof user === "string" || user === null || user === undefined
      ? { plan: user ?? "free" }
      : user;
  return canUseFeature(accessUser, gate.minPlan);
}

export function planDisplayName(plan: SubscriptionPlanId): string {
  const names: Record<SubscriptionPlanId, string> = {
    free: "Free",
    starter: "Starter",
    creator: "Creator",
    pro: "Pro",
    business: "Business",
  };
  return names[normalizePlan(plan)];
}
