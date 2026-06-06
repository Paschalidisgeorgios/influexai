import type { Locale } from "@/lib/locale";
import { FAL_CREDITS } from "@/lib/fal-credits";

export const PRODUCT_AD_CREDITS = {
  standard: FAL_CREDITS.klingVideo,
  batch: FAL_CREDITS.klingVideo * 3,
  upscaleExtra: 0,
} as const;

export const KLING_PRODUCT_VIDEO_MODEL =
  "fal-ai/kling-video/v1.6/pro/image-to-video";

export type ProductAdPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "facebook";

export type ProductAdStyle =
  | "luxury"
  | "energetic"
  | "minimal"
  | "bold"
  | "lifestyle";

export type ProductAdVariationFocus =
  | "hook"
  | "lifestyle"
  | "problem_solution"
  | "default";

export const PRODUCT_AD_PLATFORMS: {
  id: ProductAdPlatform;
  color: string;
  format: string;
}[] = [
  { id: "tiktok", color: "#ff0050", format: "9:16 · 15–60s" },
  { id: "instagram", color: "#e1306c", format: "9:16 · Reels" },
  { id: "youtube", color: "#ff0000", format: "9:16 · Shorts" },
  { id: "facebook", color: "#1877f2", format: "9:16 · Feed" },
];

export const PRODUCT_AD_STYLES: ProductAdStyle[] = [
  "luxury",
  "energetic",
  "minimal",
  "bold",
  "lifestyle",
];

export const PRODUCT_AD_LOCALES: Locale[] = [
  "de",
  "en",
  "el",
  "es",
  "fr",
  "pt",
  "tr",
  "ar",
];

export type ProductAdTemplate = {
  id: string;
  icon: string;
  style: ProductAdStyle;
  audience: string;
  cta: string;
  tone: string;
};

export const PRODUCT_AD_TEMPLATES: ProductAdTemplate[] = [
  {
    id: "beauty",
    icon: "💄",
    style: "luxury",
    audience: "Women 25–35, skincare & beauty enthusiasts",
    cta: "Shop now — link in bio",
    tone: "Aspirational, soft luxury, glow-focused",
  },
  {
    id: "fashion",
    icon: "👗",
    style: "bold",
    audience: "Gen Z & Millennials, fashion-forward",
    cta: "Get yours today",
    tone: "Trendy, confident, street-style energy",
  },
  {
    id: "food",
    icon: "🍕",
    style: "energetic",
    audience: "Food lovers 18–40, urban lifestyle",
    cta: "Order now",
    tone: "Appetizing, fast-paced, crave-inducing",
  },
  {
    id: "tech",
    icon: "📱",
    style: "minimal",
    audience: "Tech enthusiasts 20–45, early adopters",
    cta: "Learn more — link below",
    tone: "Clean, innovative, feature-highlight",
  },
  {
    id: "fitness",
    icon: "💪",
    style: "energetic",
    audience: "Women & men 25–35, fitness & wellness",
    cta: "Start your journey",
    tone: "Motivating, high-energy, results-driven",
  },
  {
    id: "home",
    icon: "🏠",
    style: "lifestyle",
    audience: "Homeowners 30–50, interior & lifestyle",
    cta: "Discover the collection",
    tone: "Cozy, aspirational, everyday luxury",
  },
];

export const PLATFORM_GUIDES: Record<ProductAdPlatform, string> = {
  tiktok: "TikTok (9:16, 15–60 sec, young audience, energetic, trending hooks)",
  instagram:
    "Instagram Reels (9:16, up to 90 sec, visual, lifestyle-oriented, aesthetic)",
  youtube:
    "YouTube Shorts (9:16 vertical, up to 60 sec, informative hook, clear value)",
  facebook:
    "Facebook Feed/Reels (9:16, broad audience, relatable storytelling, strong CTA)",
};

export const STYLE_GUIDES: Record<ProductAdStyle, string> = {
  luxury: "luxury aesthetic, premium lighting, elegant slow motion, gold accents",
  energetic: "high energy, fast cuts feel, dynamic camera, vibrant colors",
  minimal: "clean minimal composition, soft light, white space, modern",
  bold: "high contrast, dramatic lighting, bold colors, attention-grabbing",
  lifestyle: "authentic lifestyle setting, natural light, aspirational context",
};

export const VARIATION_FOCUS_GUIDES: Record<
  Exclude<ProductAdVariationFocus, "default">,
  string
> = {
  hook: "Focus the visual on a scroll-stopping hook moment in the first 3 seconds — dramatic reveal, pattern interrupt, extreme close-up.",
  lifestyle: "Focus on lifestyle context — product in use, aspirational setting, emotional connection, natural environment.",
  problem_solution:
    "Focus on problem-to-solution narrative — before/after feel, transformation, relief moment, clear benefit.",
};
