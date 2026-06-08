import { hasActivePlan, type AccessUser } from "@/lib/access";

/** Legacy feature ids — API routes still reference these; all require any active plan. */
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

/** Dashboard paths that stay usable without a subscription. */
const OPEN_DASHBOARD_PATHS = new Set([
  "/dashboard",
  "/dashboard/settings",
  "/dashboard/credits",
  "/dashboard/gallery",
  "/dashboard/analytics",
  "/dashboard/referral",
  "/dashboard/agency",
  "/dashboard/white-label",
]);

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0]?.trim() ?? "/dashboard";
  return path.replace(/\/+$/, "") || "/dashboard";
}

/** Stufe 1 vs 2: Tool-Seiten brauchen einen Plan; Meta-Seiten nicht. */
export function routeRequiresPlan(pathname: string): boolean {
  const path = normalizePathname(pathname);
  if (!path.startsWith("/dashboard")) return false;
  if (OPEN_DASHBOARD_PATHS.has(path)) return false;
  if (path.startsWith("/dashboard/admin")) return false;
  if (path.startsWith("/dashboard/credits/")) return false;
  return path.startsWith("/dashboard/");
}

/** @deprecated Use routeRequiresPlan — kept for middleware header compat. */
export function getRouteGate(
  pathname: string
): { feature: GatedFeature; minPlan: "starter" } | null {
  if (!routeRequiresPlan(pathname)) return null;
  return { feature: "master-agent", minPlan: "starter" };
}

export function isRouteAllowed(
  pathname: string,
  user: AccessUser | string | null | undefined
): boolean {
  if (!routeRequiresPlan(pathname)) return true;
  const accessUser: AccessUser =
    typeof user === "string" || user === null || user === undefined
      ? { plan: user ?? "free" }
      : user;
  return hasActivePlan(accessUser);
}

export function planDisplayName(): string {
  return "Starter";
}
