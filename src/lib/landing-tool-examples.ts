/** Landing feature cards — images from /public/images/examples/ */
export type LandingToolExample = {
  id: string;
  image: string;
  href: string;
};

export const LANDING_TOOL_EXAMPLES: LandingToolExample[] = [
  { id: "script", image: "/images/examples/script.jpg", href: "/dashboard/script-generator" },
  { id: "avatar", image: "/images/examples/avatar.jpg", href: "/dashboard/ki-ich" },
  { id: "thumbnail", image: "/images/examples/thumbnail.jpg", href: "/dashboard/thumbnail-concept" },
  { id: "faceswap", image: "/images/examples/faceswap.jpg", href: "/dashboard/live-creator-new" },
  { id: "niche", image: "/images/examples/niche.jpg", href: "/dashboard/niche-analyzer" },
  { id: "outlier", image: "/images/examples/outlier.jpg", href: "/dashboard/outlier-detector" },
  { id: "remix", image: "/images/examples/remix.jpg", href: "/dashboard/video-remix" },
  { id: "live", image: "/images/examples/live.jpg", href: "/dashboard/live-creator" },
  { id: "voice", image: "/images/examples/voice.jpg", href: "/dashboard/voice" },
  { id: "product", image: "/images/examples/product.jpg", href: "/dashboard/produkt" },
  { id: "viralscore", image: "/images/examples/viralscore.jpg", href: "/dashboard/viral-score" },
  { id: "agent", image: "/images/examples/agent.jpg", href: "/dashboard/agent" },
];
