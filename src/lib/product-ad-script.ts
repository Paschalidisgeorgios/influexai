import {
  CLAUDE_JSON_SYSTEM_RULE,
  createAnthropicMessage,
  parseClaudeJson,
} from "@/lib/anthropic";
import {
  PLATFORM_GUIDES,
  STYLE_GUIDES,
  type ProductAdPlatform,
  type ProductAdStyle,
  type ProductAdVariationFocus,
} from "@/lib/product-ad-config";
import { localeToPromptLanguage, type Locale } from "@/lib/locale";

export type ProductAdScript = {
  hook: string;
  story: string;
  proof: string;
  cta: string;
  visual_style: string;
};

export type ProductAdScriptInput = {
  productName: string;
  productDescription?: string;
  audience: string;
  platform: ProductAdPlatform;
  style: ProductAdStyle;
  language: Locale;
  ctaText: string;
  variationFocus?: ProductAdVariationFocus;
};

function buildVariationHint(focus?: ProductAdVariationFocus): string {
  if (!focus || focus === "default") return "";
  const hints: Record<Exclude<ProductAdVariationFocus, "default">, string> = {
    hook: "Emphasize a scroll-stopping hook in the first 3 seconds.",
    lifestyle: "Emphasize lifestyle and emotional connection with the product.",
    problem_solution:
      "Emphasize problem → solution storytelling and transformation.",
  };
  return `\nVariation focus: ${hints[focus]}`;
}

export async function generateProductAdScript(
  input: ProductAdScriptInput
): Promise<{ ok: true; script: ProductAdScript } | { ok: false; error: string }> {
  const lang = localeToPromptLanguage[input.language] ?? "English";
  const platformGuide = PLATFORM_GUIDES[input.platform];
  const styleGuide = STYLE_GUIDES[input.style];
  const variationHint = buildVariationHint(input.variationFocus);

  const systemPrompt = `You are a performance marketing expert specializing in short-form video ads.
Create a high-converting product video ad script optimized for ${platformGuide}.
Visual style direction: ${styleGuide}.
Target audience: ${input.audience}.
${CLAUDE_JSON_SYSTEM_RULE}`;

  const userPrompt = `Product: ${input.productName}
${input.productDescription ? `Description: ${input.productDescription}` : ""}
Platform: ${platformGuide}
Style: ${styleGuide}
Target audience: ${input.audience}
CTA text to use: ${input.ctaText}
Output language for all spoken/copy text: ${lang}
${variationHint}

Create:
1. Hook (first 3 seconds — scroll-stopping)
2. Problem/Solution Story (~15 seconds)
3. Social Proof Moment (~5 seconds)
4. CTA (~3 seconds)
5. Visual brief for AI video generation (camera motion, lighting, scene, product placement — English, concise)

Respond as JSON only:
{
  "hook": "...",
  "story": "...",
  "proof": "...",
  "cta": "...",
  "visual_style": "detailed visual brief for image-to-video model"
}`;

  const claude = await createAnthropicMessage({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 1200,
  });

  if (!claude.ok) {
    return { ok: false, error: claude.error };
  }

  try {
    const script = parseClaudeJson<ProductAdScript>(claude.text);
    if (!script.hook || !script.visual_style) {
      return { ok: false, error: "Script format invalid" };
    }
    return { ok: true, script };
  } catch {
    return { ok: false, error: "Script parsing failed" };
  }
}

export function scriptToDisplayText(script: ProductAdScript): string {
  return [
    `[HOOK — 3s]\n${script.hook}`,
    `[STORY — 15s]\n${script.story}`,
    `[PROOF — 5s]\n${script.proof}`,
    `[CTA — 3s]\n${script.cta}`,
  ].join("\n\n");
}

export function buildVideoPrompt(
  script: ProductAdScript,
  style: ProductAdStyle,
  variationSuffix?: string
): string {
  const parts = [
    script.visual_style,
    STYLE_GUIDES[style],
    "professional product video ad",
    "smooth cinematic camera motion",
    "sharp product focus",
    "commercial advertising quality",
    variationSuffix,
  ].filter(Boolean);
  return parts.join(", ");
}
