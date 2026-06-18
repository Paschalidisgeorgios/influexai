import { createAnthropicMessage } from "@/lib/anthropic";
import {
  getStylePreset,
  resolveImagePlatformId,
  resolveImageStyleId,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";

const IMAGE_PROMPT_ENHANCER_MODEL = "claude-sonnet-4-5-20250929";

/** Primary Flux model for Bild Generator fallback (replaces flux-2-pro). */
export const FLUX_ULTRA_MODEL = "fal-ai/flux-pro/v1.1-ultra" as const;

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "pinterest"
  | "facebook"
  | "twitter";

export type PlatformSubtype = "story" | "reel" | "post" | "thumbnail" | "shorts";

export type SocialPlatformFormat = {
  width: number;
  height: number;
  ratio: string;
  styleHints: string;
  /** fal.ai flux-pro/v1.1-ultra accepts aspect_ratio enum (not width/height). */
  falAspectRatio: string;
};

const SHARPNESS_RULE = `The image must always be sharp and in focus: include 'tack sharp focus, crisp details' for every style. Never describe motion blur, haze, soft focus, or out-of-focus subjects unless the user explicitly asks for it.`;

const ANTI_GLOSS_RULE = `Never use terms like 4k, 8k, ultra HD, masterpiece, hyperrealistic — they create artificial gloss. Describe a real photograph instead. For people: always preserve natural skin texture, avoid flawless airbrushed skin.`;

const CHARACTER_IDENTITY_RULE = `The person in the reference images must remain EXACTLY the same: identical face, hair, body type and skin tone. Only change scene, outfit, pose and lighting as described. Never alter the identity.`;

const INFLUENCER_CASTING_RULE = `Create a distinctive, memorable adult person (clearly 25-35 years old) with unique recognizable facial features suitable as a recurring virtual character.`;

const PLATFORM_STYLE_HINTS: Record<SocialPlatform, string> = {
  instagram:
    "high-contrast, vibrant, aesthetically pleasing, social media ready",
  tiktok: "bold, attention-grabbing, dynamic, high energy",
  youtube: "cinematic, professional, high contrast, thumbnail-optimized",
  linkedin: "professional, clean, corporate, trustworthy",
  pinterest: "beautiful, aspirational, lifestyle, vertical composition",
  facebook: "clear, approachable, shareable, balanced composition",
  twitter: "bold, readable at small size, high contrast, clean framing",
};

const DEFAULT_FORMAT: SocialPlatformFormat = {
  width: 1080,
  height: 1080,
  ratio: "1:1",
  styleHints: "natural lighting, sharp focus, professional quality, balanced composition",
  falAspectRatio: "1:1",
};

export function normalizeSocialPlatform(
  platform?: string | null
): SocialPlatform | null {
  if (!platform || typeof platform !== "string") return null;
  const key = platform.trim().toLowerCase();
  const map: Record<string, SocialPlatform> = {
    instagram: "instagram",
    insta: "instagram",
    ig: "instagram",
    tiktok: "tiktok",
    "tik tok": "tiktok",
    youtube: "youtube",
    yt: "youtube",
    linkedin: "linkedin",
    pinterest: "pinterest",
    facebook: "facebook",
    fb: "facebook",
    twitter: "twitter",
    x: "twitter",
  };
  return map[key] ?? null;
}

function normalizeSubtype(
  subtype?: string | null
): PlatformSubtype | null {
  if (!subtype || typeof subtype !== "string") return null;
  const key = subtype.trim().toLowerCase();
  if (key === "story" || key === "stories") return "story";
  if (key === "reel" || key === "reels") return "reel";
  if (key === "post" || key === "feed") return "post";
  if (key === "thumbnail" || key === "thumb") return "thumbnail";
  if (key === "shorts" || key === "short") return "shorts";
  return null;
}

/** Detect target social platform from German or English user input. */
export function detectPlatformFromPrompt(input: string): SocialPlatform | null {
  const text = input.toLowerCase();

  if (/\b(instagram|insta|\big\b)\b/.test(text)) return "instagram";
  if (/\b(tiktok|tik[\s-]?tok)\b/.test(text)) return "tiktok";
  if (/\b(youtube|\byt\b)\b/.test(text)) return "youtube";
  if (/\blinkedin\b/.test(text)) return "linkedin";
  if (/\bpinterest\b/.test(text)) return "pinterest";
  if (/\b(facebook|\bfb\b)\b/.test(text)) return "facebook";
  if (/\b(twitter|\bx\b)\b/.test(text)) return "twitter";

  return null;
}

/** Infer content subtype (story, reel, thumbnail, …) from prompt text. */
export function detectPlatformSubtype(
  input: string,
  platform: SocialPlatform | null
): PlatformSubtype | null {
  const text = input.toLowerCase();

  if (/\b(story|stories|geschichte)\b/.test(text)) return "story";
  if (/\b(reel|reels)\b/.test(text)) return "reel";
  if (/\b(shorts?|kurzvideo)\b/.test(text)) {
    return platform === "youtube" ? "shorts" : "reel";
  }
  if (/\b(thumb(nail)?|vorschaubild)\b/.test(text)) return "thumbnail";
  if (/\b(post|feed|beitrag)\b/.test(text)) return "post";

  return null;
}

/**
 * Maps platform (+ optional subtype) to export dimensions and fal aspect_ratio.
 * Width/height are used for asset metadata; fal ultra uses falAspectRatio.
 */
export function getPlatformFormat(
  platform?: SocialPlatform | string | null,
  subtype?: PlatformSubtype | string | null
): SocialPlatformFormat {
  const resolved = normalizeSocialPlatform(platform);
  const sub = normalizeSubtype(subtype);

  if (!resolved) return DEFAULT_FORMAT;

  const hints = PLATFORM_STYLE_HINTS[resolved];

  if (resolved === "instagram") {
    if (sub === "story" || sub === "reel") {
      return {
        width: 1080,
        height: 1920,
        ratio: "9:16",
        styleHints: hints,
        falAspectRatio: "9:16",
      };
    }
    return {
      width: 1080,
      height: 1080,
      ratio: "1:1",
      styleHints: hints,
      falAspectRatio: "1:1",
    };
  }

  if (resolved === "tiktok") {
    return {
      width: 1080,
      height: 1920,
      ratio: "9:16",
      styleHints: hints,
      falAspectRatio: "9:16",
    };
  }

  if (resolved === "youtube") {
    if (sub === "shorts" || sub === "reel" || sub === "story") {
      return {
        width: 1080,
        height: 1920,
        ratio: "9:16",
        styleHints: hints,
        falAspectRatio: "9:16",
      };
    }
    return {
      width: 1280,
      height: 720,
      ratio: "16:9",
      styleHints: hints,
      falAspectRatio: "16:9",
    };
  }

  if (resolved === "facebook") {
    return {
      width: 1200,
      height: 630,
      ratio: "16:9",
      styleHints: hints,
      falAspectRatio: "16:9",
    };
  }

  if (resolved === "linkedin") {
    return {
      width: 1200,
      height: 627,
      ratio: "16:9",
      styleHints: hints,
      falAspectRatio: "16:9",
    };
  }

  if (resolved === "pinterest") {
    return {
      width: 1000,
      height: 1500,
      ratio: "2:3",
      styleHints: hints,
      falAspectRatio: "2:3",
    };
  }

  if (resolved === "twitter") {
    return {
      width: 1200,
      height: 675,
      ratio: "16:9",
      styleHints: hints,
      falAspectRatio: "16:9",
    };
  }

  return DEFAULT_FORMAT;
}

/** Closest fal.ai flux-pro/v1.1-ultra aspect_ratio for arbitrary pixel dimensions. */
export function resolveFluxUltraAspectRatio(width: number, height: number): string {
  if (height <= 0 || width <= 0) return "1:1";
  const target = width / height;
  const candidates: Array<{ label: string; value: number }> = [
    { label: "9:16", value: 9 / 16 },
    { label: "16:9", value: 16 / 9 },
    { label: "1:1", value: 1 },
    { label: "2:3", value: 2 / 3 },
    { label: "3:4", value: 3 / 4 },
    { label: "4:3", value: 4 / 3 },
    { label: "3:2", value: 3 / 2 },
    { label: "21:9", value: 21 / 9 },
  ];

  let best = candidates[0]!;
  let bestDelta = Math.abs(target - best.value);
  for (const candidate of candidates) {
    const delta = Math.abs(target - candidate.value);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best.label;
}

function buildEnhancerSystem(
  styleId: ImageStyleId,
  options?: { characterMode?: boolean; influencerCastingMode?: boolean }
): string {
  const preset = getStylePreset(styleId);
  return `You are a professional image prompt engineer for photorealistic AI image generation (Flux-class models). The user gives a short description, often in German. Your job:
1. Translate the intent to English.
2. Expand it into a detailed, professional image prompt: subject (with explicit age descriptor like 'adult woman in her 30s' when people are involved), setting, composition, lighting, camera/lens feel, mood, style.
3. Integrate this photographic style faithfully into the prompt: ${preset.descriptor}
4. Write a negative prompt that excludes common artifacts: deformed hands, extra fingers, extra limbs, duplicate objects, phones or props not requested, text, watermark, logo, low quality, blurry, oversaturated, cartoonish (unless requested), child-like features when an adult is described.
5. Never add objects, people or props the user did not ask for.
6. Phrase quality requirements POSITIVELY inside the main prompt instead of relying on the negative prompt: e.g. 'natural relaxed hands', 'clean composition with only the described subject and setting', 'anatomically correct'. Never mention unwanted objects by name in the prompt.
7. ${SHARPNESS_RULE}
8. ${ANTI_GLOSS_RULE}${options?.characterMode ? `\n9. ${CHARACTER_IDENTITY_RULE}` : ""}${options?.influencerCastingMode ? `\n${options?.characterMode ? "10" : "9"}. ${INFLUENCER_CASTING_RULE}` : ""}
${options?.influencerCastingMode ? (options?.characterMode ? "11" : "10") : options?.characterMode ? "10" : "9"}. Respond ONLY with valid JSON, no markdown, no backticks: {"prompt": "...", "negative_prompt": "..."}`;
}

function buildPlatformEnhancerSystem(
  platformFormat: SocialPlatformFormat,
  socialPlatform: SocialPlatform | null
): string {
  const platformHintBlock = socialPlatform
    ? platformFormat.styleHints
    : "universal quality terms only";

  return `You are a professional image prompt engineer.
Task: Translate the user's input from German to English (if needed) and enhance it into a professional image generation prompt.
Rules:
- Always write in English
- Add technical quality terms
- Add platform-specific style hints if platform given
- Keep the user's original intent
- No negative prompts
- Max 150 words
- Return ONLY the enhanced prompt, nothing else

Platform style hints to add:
${platformHintBlock}${socialPlatform ? `\n\nTarget format: ${platformFormat.ratio} (${platformFormat.width}x${platformFormat.height})` : ""}`;
}

const FALLBACK_NEGATIVE_PROMPT =
  "deformed, extra limbs, duplicate objects, text, watermark, low quality, airbrushed skin, plastic skin";

export type EnhancedImagePrompt = {
  prompt: string;
  negative_prompt: string;
  styleId: ImageStyleId;
  platform: ImagePlatformId;
  socialPlatform: SocialPlatform | null;
  platformFormat: SocialPlatformFormat;
};

export type EnhanceImagePromptOptions = {
  styleId?: ImageStyleId | string;
  platform?: ImagePlatformId | string;
  socialPlatform?: SocialPlatform | string | null;
  platformSubtype?: PlatformSubtype | string | null;
  characterMode?: boolean;
  influencerCastingMode?: boolean;
};

function buildUserMessage(
  userInput: string,
  options?: EnhanceImagePromptOptions
): string {
  const trimmed = userInput.trim();
  if (options?.characterMode) {
    return `${trimmed}\n\nCharacter mode: reference images of the same person will be provided as Figure 1, Figure 2, etc. Describe only the new scene, outfit, pose and lighting.`;
  }
  return trimmed;
}

function parseEnhancerJson(raw: string): Omit<EnhancedImagePrompt, "styleId" | "platform" | "socialPlatform" | "platformFormat"> | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as {
      prompt?: unknown;
      negative_prompt?: unknown;
    };
    const prompt =
      typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
    const negative_prompt =
      typeof parsed.negative_prompt === "string"
        ? parsed.negative_prompt.trim()
        : "";
    if (!prompt) return null;
    return {
      prompt,
      negative_prompt: negative_prompt || FALLBACK_NEGATIVE_PROMPT,
    };
  } catch {
    return null;
  }
}

/**
 * Expands short user prompts (often German) into Flux-ready English prompts.
 * Falls back to the raw input on API/parse errors so generation never blocks.
 */
export async function enhanceImagePrompt(
  userInput: string,
  options?: EnhanceImagePromptOptions
): Promise<EnhancedImagePrompt> {
  const trimmed = userInput.trim();
  const styleId = resolveImageStyleId(options?.styleId);
  const platform = resolveImagePlatformId(options?.platform);
  const characterMode = options?.characterMode === true;
  const influencerCastingMode = options?.influencerCastingMode === true;

  const detectedSocial =
    options?.socialPlatform !== undefined
      ? normalizeSocialPlatform(options.socialPlatform)
      : detectPlatformFromPrompt(trimmed);
  const subtype =
    options?.platformSubtype !== undefined
      ? normalizeSubtype(options.platformSubtype)
      : detectPlatformSubtype(trimmed, detectedSocial);
  const platformFormat = getPlatformFormat(detectedSocial, subtype);

  if (!trimmed) {
    return {
      prompt: trimmed,
      negative_prompt: FALLBACK_NEGATIVE_PROMPT,
      styleId,
      platform,
      socialPlatform: detectedSocial,
      platformFormat,
    };
  }

  if (characterMode || influencerCastingMode) {
    const result = await createAnthropicMessage({
      model: IMAGE_PROMPT_ENHANCER_MODEL,
      maxTokens: 1024,
      system: buildEnhancerSystem(styleId, { characterMode, influencerCastingMode }),
      user: buildUserMessage(trimmed, { characterMode }),
    });

    if (!result.ok) {
      console.warn("[imagePromptEnhancer] Anthropic call failed:", result.error);
      return {
        prompt: trimmed,
        negative_prompt: FALLBACK_NEGATIVE_PROMPT,
        styleId,
        platform,
        socialPlatform: detectedSocial,
        platformFormat,
      };
    }

    const parsed = parseEnhancerJson(result.text);
    if (!parsed) {
      console.warn("[imagePromptEnhancer] Failed to parse JSON response");
      return {
        prompt: trimmed,
        negative_prompt: FALLBACK_NEGATIVE_PROMPT,
        styleId,
        platform,
        socialPlatform: detectedSocial,
        platformFormat,
      };
    }

    return {
      ...parsed,
      styleId,
      platform,
      socialPlatform: detectedSocial,
      platformFormat,
    };
  }

  const result = await createAnthropicMessage({
    model: IMAGE_PROMPT_ENHANCER_MODEL,
    maxTokens: 512,
    system: buildPlatformEnhancerSystem(platformFormat, detectedSocial),
    user: trimmed,
  });

  if (!result.ok) {
    console.warn("[imagePromptEnhancer] Anthropic call failed:", result.error);
    return {
      prompt: trimmed,
      negative_prompt: FALLBACK_NEGATIVE_PROMPT,
      styleId,
      platform,
      socialPlatform: detectedSocial,
      platformFormat,
    };
  }

  const enhanced = result.text.replace(/```/g, "").trim();
  if (!enhanced) {
    return {
      prompt: trimmed,
      negative_prompt: FALLBACK_NEGATIVE_PROMPT,
      styleId,
      platform,
      socialPlatform: detectedSocial,
      platformFormat,
    };
  }

  console.log("[imagePromptEnhancer]", {
    styleId,
    platform,
    socialPlatform: detectedSocial,
    platformSubtype: subtype,
    platformFormat,
    prompt: enhanced,
  });

  return {
    prompt: enhanced,
    negative_prompt: FALLBACK_NEGATIVE_PROMPT,
    styleId,
    platform,
    socialPlatform: detectedSocial,
    platformFormat,
  };
}

/** Agent workflow: enhance + log; never throws (falls back to original prompt). */
export async function enhanceImagePromptForAgent(
  userInput: string,
  options?: EnhanceImagePromptOptions
): Promise<EnhancedImagePrompt> {
  try {
    const result = await enhanceImagePrompt(userInput, options);
    console.log("[agent-image]", {
      styleId: result.styleId,
      platform: result.platform,
      socialPlatform: result.socialPlatform,
      prompt: result.prompt,
      negative_prompt: result.negative_prompt,
    });
    return result;
  } catch (error) {
    console.warn("[agent-image] enhancement failed, using original prompt", error);
    const trimmed = userInput.trim();
    const styleId = resolveImageStyleId(options?.styleId);
    const platform = resolveImagePlatformId(options?.platform);
    const socialPlatform = detectPlatformFromPrompt(trimmed);
    const platformFormat = getPlatformFormat(
      socialPlatform,
      detectPlatformSubtype(trimmed, socialPlatform)
    );
    return {
      prompt: trimmed,
      negative_prompt: FALLBACK_NEGATIVE_PROMPT,
      styleId,
      platform,
      socialPlatform,
      platformFormat,
    };
  }
}
