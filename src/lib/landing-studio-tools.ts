/** Landing tool grid — 12 studio tools with route resolution. */

export type LandingStudioTool = {
  id: string;
  href: string;
  image: string;
  comingSoon?: boolean;
};

/** Routes verified against src/app (build-time static map). */
const ROUTE_EXISTS = new Set([
  "/dashboard/thumbnail-concept",
  "/dashboard/ki-ich",
  "/dashboard/ki-agent",
  "/dashboard/image-generator",
  "/tools/viral-hook-extraktor",
  "/tools/content-kalender",
  "/tools/trend-script",
  "/dashboard/live-creator",
  "/dashboard/lora-training",
  "/dashboard/script-generator",
  "/dashboard/produkt",
  "/dashboard/agent",
  "/dashboard/stimme",
  "/dashboard/stimme-musik",
  "/dashboard/voice",
]);

export const LANDING_STUDIO_TOOLS: LandingStudioTool[] = [
  {
    id: "script",
    href: "/dashboard/script-generator",
    image: "/images/examples/script.jpg",
  },
  {
    id: "product",
    href: "/dashboard/produkt",
    image: "/images/examples/product.jpg",
  },
  {
    id: "thumbnail",
    href: "/dashboard/thumbnail-concept",
    image: "/images/examples/thumbnail.jpg",
  },
  {
    id: "agent",
    href: "/dashboard/ki-agent",
    image: "/images/examples/agent.jpg",
  },
  {
    id: "ki_ich",
    href: "/dashboard/ki-ich",
    image: "/images/examples/avatar.jpg",
  },
  {
    id: "image_gen",
    href: "/dashboard/image-generator",
    image: "/images/examples/thumbnail.jpg",
  },
  {
    id: "viral_hook",
    href: "/tools/viral-hook-extraktor",
    image: "/images/examples/outlier.jpg",
  },
  {
    id: "content_kalender",
    href: "/tools/content-kalender",
    image: "/images/examples/niche.jpg",
  },
  {
    id: "trend_script",
    href: "/tools/trend-script",
    image: "/images/examples/remix.jpg",
  },
  {
    id: "voice",
    href: "/dashboard/stimme-musik",
    image: "/images/examples/voice.jpg",
  },
  {
    id: "live",
    href: "/dashboard/live-creator",
    image: "/images/examples/live.jpg",
  },
  {
    id: "lora",
    href: "/dashboard/lora-training",
    image: "/images/examples/avatar.jpg",
  },
];

export function resolveLandingToolHref(href: string): string {
  if (ROUTE_EXISTS.has(href)) return href;
  return "/dashboard";
}

/** Hrefs from spec that do not exist as pages — reported after build. */
export const MISSING_LANDING_TOOL_ROUTES = LANDING_STUDIO_TOOLS.filter(
  (tool) => !ROUTE_EXISTS.has(tool.href)
).map((tool) => tool.href);
