import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isValidLocale,
  resolveLocaleFromRequest,
  type Locale,
} from "./src/lib/locale";
import { deepMergeMessages } from "./src/lib/i18n-merge";

import deMessages from "./messages/de.json";
import enMessages from "./messages/en.json";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const headerLang = headersList.get("x-url-lang");

  const detected = isValidLocale(headerLang)
    ? headerLang
    : resolveLocaleFromRequest(cookieLocale, acceptLanguage);

  const locale: Locale = isValidLocale(detected) ? detected : defaultLocale;

  let messages: Record<string, unknown>;

  if (locale === "de") {
    messages = deMessages as Record<string, unknown>;
  } else {
    const localeModule = (await import(`./messages/${locale}.json`)).default as Record<
      string,
      unknown
    >;
    // English fallback for missing keys (not German) — better for international users.
    messages = deepMergeMessages(
      enMessages as Record<string, unknown>,
      localeModule
    );
  }

  return {
    locale,
    messages,
    getMessageFallback({ namespace, key }) {
      const path = namespace ? `${namespace}.${key}` : key;
      const enVal = getNestedValue(enMessages as Record<string, unknown>, path);
      if (typeof enVal === "string") return enVal;
      return path;
    },
  };
});

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}
