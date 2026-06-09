import { createAnthropicMessage } from "@/lib/anthropic";

const IMAGE_PROMPT_ENHANCER_MODEL = "claude-sonnet-4-5-20250929";

const IMAGE_PROMPT_ENHANCER_SYSTEM = `You are a professional image prompt engineer for photorealistic and stylized AI image generation (Flux-class models). The user gives a short description, often in German. Your job:
1. Translate the intent to English.
2. Expand it into a detailed, professional image prompt: subject (with explicit age descriptor like 'adult woman in her 30s' when people are involved), setting, composition, lighting, camera/lens feel, mood, style.
3. Write a negative prompt that excludes common artifacts: deformed hands, extra fingers, extra limbs, duplicate objects, phones or props not requested, text, watermark, logo, low quality, blurry, oversaturated, cartoonish (unless requested), child-like features when an adult is described.
4. Never add objects, people or props the user did not ask for.
5. Respond ONLY with valid JSON, no markdown, no backticks: {"prompt": "...", "negative_prompt": "..."}`;

const FALLBACK_NEGATIVE_PROMPT =
  "deformed, extra limbs, duplicate objects, text, watermark, low quality";

export type EnhancedImagePrompt = {
  prompt: string;
  negative_prompt: string;
};

function buildUserMessage(userInput: string, style?: string): string {
  const trimmed = userInput.trim();
  if (!style?.trim()) return trimmed;
  return `${trimmed}\n\nSelected style/context: ${style.trim()}`;
}

function parseEnhancerJson(raw: string): EnhancedImagePrompt | null {
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
  style?: string
): Promise<EnhancedImagePrompt> {
  const trimmed = userInput.trim();
  if (!trimmed) {
    return { prompt: trimmed, negative_prompt: FALLBACK_NEGATIVE_PROMPT };
  }

  const result = await createAnthropicMessage({
    model: IMAGE_PROMPT_ENHANCER_MODEL,
    maxTokens: 1024,
    system: IMAGE_PROMPT_ENHANCER_SYSTEM,
    user: buildUserMessage(trimmed, style),
  });

  if (!result.ok) {
    console.warn("[imagePromptEnhancer] Anthropic call failed:", result.error);
    return { prompt: trimmed, negative_prompt: FALLBACK_NEGATIVE_PROMPT };
  }

  const parsed = parseEnhancerJson(result.text);
  if (!parsed) {
    console.warn("[imagePromptEnhancer] Failed to parse JSON response");
    return { prompt: trimmed, negative_prompt: FALLBACK_NEGATIVE_PROMPT };
  }

  return parsed;
}

/** Agent workflow: enhance + log; never throws (falls back to original prompt). */
export async function enhanceImagePromptForAgent(
  userInput: string,
  style?: string
): Promise<EnhancedImagePrompt> {
  try {
    const result = await enhanceImagePrompt(userInput, style);
    console.log("[agent-image]", {
      prompt: result.prompt,
      negative_prompt: result.negative_prompt,
    });
    return result;
  } catch (error) {
    console.warn("[agent-image] enhancement failed, using original prompt", error);
    const trimmed = userInput.trim();
    return { prompt: trimmed, negative_prompt: FALLBACK_NEGATIVE_PROMPT };
  }
}
