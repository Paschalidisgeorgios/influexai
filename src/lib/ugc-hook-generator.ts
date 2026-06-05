import {
  CLAUDE_JSON_SYSTEM_RULE,
  createAnthropicMessage,
  getAnthropicConfigError,
  parseClaudeJson,
} from "@/lib/anthropic";

export async function generateUgcHookVariants(
  topic: string,
  language: string
): Promise<string[]> {
  const configError = getAnthropicConfigError();
  if (configError) throw new Error(configError);

  const trimmed = topic.trim();
  if (!trimmed) throw new Error("Bitte ein Thema oder Script eingeben");

  const result = await createAnthropicMessage({
    system: `${CLAUDE_JSON_SYSTEM_RULE} Du schreibst scroll-stoppende UGC-Hooks für TikTok/Reels.`,
    user: `Erstelle 3 alternative Hook-Varianten (je max. 120 Zeichen) für ein UGC-Video.
Sprache: ${language}
Thema/Kontext: ${trimmed}

Jeder Hook soll authentisch klingen — wie ein echter Creator, der direkt in die Kamera spricht.
Keine Hashtags, keine Emojis.

Antworte als JSON:
{ "hooks": ["hook1", "hook2", "hook3"] }`,
    maxTokens: 800,
  });

  if (!result.ok) throw new Error(result.error);

  const parsed = parseClaudeJson<{ hooks?: string[] }>(result.text);
  const hooks = Array.isArray(parsed.hooks)
    ? parsed.hooks.map((h) => String(h).trim()).filter(Boolean).slice(0, 3)
    : [];

  if (hooks.length === 0) {
    throw new Error("Keine Hook-Varianten erhalten");
  }
  return hooks;
}
