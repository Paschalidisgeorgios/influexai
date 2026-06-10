import {
  CATEGORY_PROMPTS,
  type ImageCategoryKey,
} from "@/lib/generation-config";
import {
  enhanceImagePrompt,
  type EnhanceImagePromptOptions,
} from "@/lib/ai/imagePromptEnhancer";
import {
  resolveImagePlatformId,
  resolveImageStyleId,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";

const CATEGORY_PATTERNS: { category: ImageCategoryKey; pattern: RegExp }[] = [
  {
    category: "product",
    pattern:
      /\b(produkt|product|packshot|werbung|flasche|bottle|packaging|e-?commerce|marke|commercial)\b/i,
  },
  {
    category: "thumbnail",
    pattern: /\b(thumbnail|vorschaubild|youtube.?thumb)\b/i,
  },
  {
    category: "background",
    pattern: /\b(hintergrund|background|backdrop|wallpaper)\b/i,
  },
  {
    category: "portrait",
    pattern:
      /\b(porträt|portrait|headshot|gesicht|face|close-?up|oberkörper|upper body)\b/i,
  },
  {
    category: "lifestyle",
    pattern:
      /\b(strand|beach|urlaub|vacation|holiday|outdoor|natur|nature|city|stadt|straße|street|wander|travel|reise|pool|sonne|sunset|sunrise|ocean|meer|sand|lifestyle|café|cafe|restaurant|park|mountain|berg|wald|forest|coast|küste|frau am|mann am)\b/i,
  },
  {
    category: "creator",
    pattern:
      /\b(influencer|content creator|ring light|home studio|studio setup|youtube setup|tiktok creator|streaming setup|ringlicht|creator desk)\b/i,
  },
  {
    category: "cinematic",
    pattern: /\b(cinematic|film still|movie|anamorphic|filmisch)\b/i,
  },
  {
    category: "darknoir",
    pattern: /\b(noir|dark mood|neon green|acid yellow|nightlife|dunkel)\b/i,
  },
  {
    category: "viral",
    pattern: /\b(viral|scroll.?stop|gen z|tiktok aesthetic)\b/i,
  },
  {
    category: "avatar",
    pattern: /\b(avatar|ki avatar|digital human|virtual influencer)\b/i,
  },
];

export function inferImageCategoryFromPrompt(
  prompt: string
): ImageCategoryKey | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(trimmed)) return category;
  }

  return null;
}

/** Keeps explicit UI category; overrides default "creator" when prompt signals a scene. */
export function resolveImageCategory(
  userPrompt: string,
  selectedCategory: ImageCategoryKey
): ImageCategoryKey {
  const inferred = inferImageCategoryFromPrompt(userPrompt);
  if (selectedCategory !== "creator") return selectedCategory;
  return inferred ?? selectedCategory;
}

export type PreparedImageGeneratorPrompts = {
  userPrompt: string;
  enhancedPrompt: string;
  negativePrompt: string;
  category: ImageCategoryKey;
  promptEnhanced: boolean;
  styleId: ImageStyleId;
  platform: ImagePlatformId;
};

export async function prepareImageGeneratorPrompts(
  userPrompt: string,
  selectedCategory: ImageCategoryKey,
  options?: EnhanceImagePromptOptions
): Promise<PreparedImageGeneratorPrompts> {
  const trimmed = userPrompt.trim();
  const category = resolveImageCategory(trimmed, selectedCategory);
  const styleId = resolveImageStyleId(options?.styleId);
  const platform = resolveImagePlatformId(options?.platform);
  const { prompt: enhancedPrompt, negative_prompt: negativePrompt } =
    await enhanceImagePrompt(trimmed, { styleId, platform });

  return {
    userPrompt: trimmed,
    enhancedPrompt,
    negativePrompt,
    category,
    promptEnhanced: enhancedPrompt !== trimmed,
    styleId,
    platform,
  };
}

export function describeResolvedCategory(category: ImageCategoryKey): string {
  return CATEGORY_PROMPTS[category].label;
}
