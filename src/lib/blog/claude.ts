import { createAnthropicMessage } from "@/lib/anthropic";

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
  const result = await createAnthropicMessage({ system, user, maxTokens });
  if (!result.ok) throw new Error(result.error);
  return result.text;
}

export function languageLabel(code: string): string {
  return LANGUAGE_NAMES[code] ?? LANGUAGE_NAMES.de;
}
