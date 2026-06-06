import { createAnthropicMessage } from "@/lib/anthropic";

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
Maximal 200 Wörter. Kein Erklärungstext.`;

export async function improveImagePrompt(prompt: string): Promise<string> {
  const trimmed = prompt.trim();
  if (!trimmed) return trimmed;

  const result = await createAnthropicMessage({
    model: IMPROVE_IMAGE_PROMPT_MODEL,
    maxTokens: 512,
    system: IMPROVE_IMAGE_PROMPT_SYSTEM,
    user: trimmed,
  });

  if (!result.ok) {
    console.warn("improveImagePrompt:", result.error);
    return trimmed;
  }

  const improved = result.text.trim();
  return improved || trimmed;
}
