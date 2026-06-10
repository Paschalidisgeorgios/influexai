import type { IntentToolId } from "@/lib/agent/intentRouter";

export const INTENT_TOOL_LABELS: Record<IntentToolId, string> = {
  "image-generator": "Bild Generator",
  "ki-influencer": "KI-Influencer",
  "ugc-video": "UGC Video",
  "script-generator": "Script Generator",
  "viral-hooks": "Viral Hooks",
  "content-kalender": "Content Kalender",
  "trend-script": "Trend-Script",
  "product-ad": "Produkt-Werbung",
  thumbnail: "Thumbnail",
  "ki-agent": "KI Agent",
};

export function buildIntentToolUrl(
  tool: IntentToolId,
  prefill: Record<string, string>
): string {
  const params = new URLSearchParams();

  switch (tool) {
    case "image-generator":
      if (prefill.prompt) params.set("prompt", prefill.prompt);
      if (prefill.styleId) params.set("styleId", prefill.styleId);
      break;
    case "script-generator":
      if (prefill.thema) params.set("topic", prefill.thema);
      if (prefill.plattform) params.set("plattform", prefill.plattform);
      break;
    case "viral-hooks":
      if (prefill.input) params.set("input", prefill.input);
      break;
    case "content-kalender":
      if (prefill.nische) params.set("nische", prefill.nische);
      if (prefill.plattform) params.set("plattform", prefill.plattform);
      break;
    case "trend-script":
      if (prefill.thema) params.set("thema", prefill.thema);
      break;
    case "product-ad":
      if (prefill.produkt) params.set("title", prefill.produkt);
      break;
    case "thumbnail":
      if (prefill.thema) params.set("topic", prefill.thema);
      break;
    case "ugc-video":
      if (prefill.produkt) params.set("produkt", prefill.produkt);
      break;
    default:
      break;
  }

  const base: Record<IntentToolId, string> = {
    "image-generator": "/dashboard/image-generator",
    "ki-influencer": "/dashboard/ki-influencer",
    "ugc-video": "/dashboard/ugc-video",
    "script-generator": "/dashboard/script-generator",
    "viral-hooks": "/dashboard/viral-hook",
    "content-kalender": "/dashboard/content-kalender",
    "trend-script": "/dashboard/trend-to-script",
    "product-ad": "/dashboard/produkt",
    thumbnail: "/dashboard/thumbnail-concept",
    "ki-agent": "/dashboard",
  };

  const qs = params.toString();
  return qs ? `${base[tool]}?${qs}` : base[tool];
}
