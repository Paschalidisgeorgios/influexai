import { createAnthropicMessage } from "@/lib/anthropic";
import {
  getPlatformFormat,
  getStylePreset,
  resolveImagePlatformId,
  resolveImageStyleId,
  type ImagePlatformId,
  type ImageStyleId,
} from "@/lib/ai/imageStylePresets";

const IMAGE_PROMPT_ENHANCER_MODEL = "claude-sonnet-4-5-20250929";

const SHARPNESS_RULE = `The image must always be sharp and in focus: include 'tack sharp focus, crisp details' for every style. Never describe motion blur, haze, soft focus, or out-of-focus subjects unless the user explicitly asks for it.`;

const ANTI_GLOSS_RULE = `Never use terms like 4k, 8k, ultra HD, masterpiece, hyperrealistic — they create artificial gloss. Describe a real photograph instead. For people: always preserve natural skin texture, avoid flawless airbrushed skin.`;

const CHARACTER_IDENTITY_RULE = `The person in the reference images must remain EXACTLY the same: identical face, hair, body type and skin tone. Only change scene, outfit, pose and lighting as described. Never alter the identity.`;

function buildEnhancerSystem(
  styleId: ImageStyleId,
  characterMode?: boolean
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
8. ${ANTI_GLOSS_RULE}${characterMode ? `\n9. ${CHARACTER_IDENTITY_RULE}` : ""}
${characterMode ? "10" : "9"}. Respond ONLY with valid JSON, no markdown, no backticks: {"prompt": "...", "negative_prompt": "..."}`;
}

const FALLBACK_NEGATIVE_PROMPT =
  "deformed, extra limbs, duplicate objects, text, watermark, low quality, airbrushed skin, plastic skin";

export type EnhancedImagePrompt = {
  prompt: string;
  negative_prompt: string;
  styleId: ImageStyleId;
  platform: ImagePlatformId;
};

export type EnhanceImagePromptOptions = {
  styleId?: ImageStyleId | string;
  platform?: ImagePlatformId | string;
  characterMode?: boolean;
};

function buildUserMessage(
  userInput: string,
  options?: EnhanceImagePromptOptions
): string {
  const trimmed = userInput.trim();
  const platform = getPlatformFormat(resolveImagePlatformId(options?.platform));
  const formatLine = `Target platform/format: ${platform.labelDE} (${platform.aspectLabel})`;
  if (options?.characterMode) {
    return `${trimmed}\n\nCharacter mode: reference images of the same person will be provided as Figure 1, Figure 2, etc. Describe only the new scene, outfit, pose and lighting.\n${formatLine}`;
  }
  return `${trimmed}\n\n${formatLine}`;
}

function parseEnhancerJson(raw: string): Omit<EnhancedImagePrompt, "styleId" | "platform"> | null {
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
 * Expands short user prompts (often German) into Flux-ready English prompts + negatives.
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

  if (!trimmed) {
    return {
      prompt: trimmed,
      negative_prompt: FALLBACK_NEGATIVE_PROMPT,
      styleId,
      platform,
    };
  }

  const result = await createAnthropicMessage({
    model: IMAGE_PROMPT_ENHANCER_MODEL,
    maxTokens: 1024,
    system: buildEnhancerSystem(styleId, characterMode),
    user: buildUserMessage(trimmed, { styleId, platform, characterMode }),
  });

  if (!result.ok) {
    console.warn("[imagePromptEnhancer] Anthropic call failed:", result.error);
    return {
      prompt: trimmed,
      negative_prompt: FALLBACK_NEGATIVE_PROMPT,
      styleId,
      platform,
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
    };
  }

  console.log("[imagePromptEnhancer]", {
    styleId,
    platform,
    characterMode,
    prompt: parsed.prompt,
  });

  return { ...parsed, styleId, platform };
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
      prompt: result.prompt,
      negative_prompt: result.negative_prompt,
    });
    return result;
  } catch (error) {
    console.warn("[agent-image] enhancement failed, using original prompt", error);
    const trimmed = userInput.trim();
    const styleId = resolveImageStyleId(options?.styleId);
    const platform = resolveImagePlatformId(options?.platform);
    return {
      prompt: trimmed,
      negative_prompt: FALLBACK_NEGATIVE_PROMPT,
      styleId,
      platform,
    };
  }
}
