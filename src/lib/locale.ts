export const locales = [
  "de",
  "en",
  "el",
  "tr",
  "es",
  "fr",
  "ar",
  "pt",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export function isValidLocale(
  value: string | undefined | null
): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export const LOCALE_LANGUAGE_NAMES: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  el: "Greek",
  tr: "Turkish",
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  pt: "Portuguese",
};

/** Claude / API output language */
export const localeToPromptLanguage: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  el: "Greek",
  tr: "Turkish",
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  pt: "Portuguese",
};

export function resolveLocaleFromRequest(
  cookieValue: string | undefined,
  acceptLanguage: string | null
): Locale {
  if (isValidLocale(cookieValue)) return cookieValue;
  const detected = acceptLanguage?.split(",")[0]?.split("-")[0]?.toLowerCase();
  if (isValidLocale(detected)) return detected;
  return defaultLocale;
}
