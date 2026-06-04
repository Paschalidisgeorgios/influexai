import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  isValidLocale,
  resolveLocaleFromRequest,
  type Locale,
} from "./src/lib/locale";

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

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
