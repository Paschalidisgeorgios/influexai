import { createAnthropicMessage, SCRIPT_GENERATOR_MODEL } from "@/lib/anthropic";

/** Claude-based text content score (0–100) for platform fit and engagement. */
export async function scoreContent(
  content: string,
  platform: string,
  type: string
): Promise<number> {
  const trimmed = content.trim();
  if (!trimmed) return 0;

  const prompt = `Bewerte diesen Content für ${platform} auf einer Skala von 0-100.
Kriterien: Engagement-Potenzial (30%), Klarheit (25%), Plattform-Fit (25%), Viral-Potenzial (20%).
Content-Typ: ${type}
Content: ${trimmed}
Gib NUR eine Zahl zurück (0-100), nichts anderes.`;

  try {
    const result = await createAnthropicMessage({
      model: SCRIPT_GENERATOR_MODEL,
      maxTokens: 10,
      temperature: 0.3,
      system: "Antworte nur mit einer Ganzzahl zwischen 0 und 100.",
      user: prompt,
    });

    if (!result.ok) {
      console.warn("[scoreContent] failed:", result.error);
      return 50;
    }

    const match = result.text.trim().match(/\d+/);
    const score = match ? parseInt(match[0], 10) : NaN;
    if (Number.isNaN(score)) return 50;
    return Math.max(0, Math.min(100, score));
  } catch (err) {
    console.warn("[scoreContent] error:", err);
    return 50;
  }
}
