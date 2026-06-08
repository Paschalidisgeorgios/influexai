import { createAnthropicMessage } from "@/lib/anthropic";
import type { ImageCategoryKey } from "@/lib/generation-config";
import { CATEGORY_PROMPTS } from "@/lib/generation-config";

const IMPROVE_IMAGE_PROMPT_MODEL = "claude-haiku-4-5-20251001";

const IMPROVE_IMAGE_PROMPT_SYSTEM = `Du bist ein Experte für Bild-Generierungs-Prompts (Flux Pro).
Erweitere den Nutzer-Prompt um:
- Konkrete visuelle Details (was genau ist zu sehen, Materialien, Texturen)
- Spezifische Requisiten (z.B. 'ein klares Glas Frappé mit Schlagsahne, braunem Strohhalm und Eiswürfeln' statt nur 'Frappé')
- Lichtverhältnisse (golden hour, soft natural light, etc.)
- Kameraeinstellung (portrait, wide shot, close-up, bokeh)
- Qualitäts-Tags: photorealistic, 8K, sharp focus, professional photo
- Stilangaben passend zum Kontext

Antworte NUR mit dem verbesserten englischen Prompt.
Maximal 200 Wörter. Kein Erklärungstext.
Übersetze deutsche Eingaben ins Englische.
Füge KEIN Ring Light, Home Studio oder Creator-Desk-Setup hinzu, wenn der Nutzer Outdoor-, Strand-, Natur- oder Lifestyle-Szenen beschreibt.`;

function categoryEnhancementHint(category?: ImageCategoryKey): string {
  if (!category) {
    return "Match the scene to the user description. Avoid unrelated studio setups.";
  }

  const label = CATEGORY_PROMPTS[category].label;
  const outdoorCategories: ImageCategoryKey[] = [
    "lifestyle",
    "cinematic",
    "portrait",
  ];

  if (outdoorCategories.includes(category)) {
    return `Category: ${label}. Keep natural/outdoor/environmental lighting. Do NOT add ring light, home studio, or desk setup.`;
  }

  return `Category: ${label}. Match composition and lighting to this category.`;
}

export async function improveImagePrompt(
  prompt: string,
  category?: ImageCategoryKey
): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) return trimmed;

  const result = await createAnthropicMessage({
    model: IMPROVE_IMAGE_PROMPT_MODEL,
    maxTokens: 512,
    system: `${IMPROVE_IMAGE_PROMPT_SYSTEM}\n${categoryEnhancementHint(category)}`,
    user: trimmed,
  });

  if (!result.ok) {
    console.warn("improveImagePrompt:", result.error);
    return trimmed;
  }

  const improved = result.text.trim();
  return improved || trimmed;
}
