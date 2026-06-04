const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const LANGUAGE_NAMES: Record<string, string> = {
  de: "Deutsch",
  en: "English",
  el: "Greek",
  tr: "Turkish",
  es: "Spanish",
  fr: "French",
};

export async function callClaude(
  system: string,
  user: string,
  maxTokens = 8192
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY fehlt");

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Claude blog API:", err);
    throw new Error("Claude API Fehler");
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "";
}

export function languageLabel(code: string): string {
  return LANGUAGE_NAMES[code] ?? LANGUAGE_NAMES.de;
}
