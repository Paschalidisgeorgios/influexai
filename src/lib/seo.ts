import { defaultLocale, locales, type Locale } from "@/lib/locale";

export const SEO_BASE_URL = "https://influexaicreator.com";

export const SEO_LOCALES = [...locales] as const;

export type SeoPageKey = "home";

export type SeoPageMeta = {
  title: string;
  description: string;
  keywords: string;
};

export const seoConfig: Record<Locale, Record<SeoPageKey, SeoPageMeta>> = {
  de: {
    home: {
      title: "InfluexAI – KI Creator Studio für Virale Shorts",
      description:
        "Erstelle virale YouTube Shorts mit KI in 60 Sekunden. Script Generator, Niche Analyzer, Outlier Detector & mehr. Starter-Plan ab €9,99.",
      keywords:
        "KI Creator Studio, YouTube Shorts KI, Script Generator, Niche Analyzer, virale Shorts erstellen",
    },
  },
  en: {
    home: {
      title: "InfluexAI – AI Creator Studio for Viral Shorts",
      description:
        "Create viral YouTube Shorts with AI in 60 seconds. Script Generator, Niche Analyzer, Outlier Detector & more. Starter plan from €9.99.",
      keywords:
        "AI creator studio, YouTube Shorts AI, script generator, niche analyzer, viral shorts creator",
    },
  },
  el: {
    home: {
      title: "InfluexAI – Στούντιο AI για Viral Shorts",
      description:
        "Δημιούργησε viral YouTube Shorts με AI σε 60 δευτερόλεπτα. Γεννήτρια Σεναρίου, Ανάλυση Niche & περισσότερα. 10 δωρεάν πόντοι.",
      keywords:
        "AI δημιουργός, YouTube Shorts AI, γεννήτρια σεναρίου, ανάλυση niche, viral shorts",
    },
  },
  tr: {
    home: {
      title: "InfluexAI – Viral Shorts için AI İçerik Stüdyosu",
      description:
        "AI ile 60 saniyede viral YouTube Shorts oluştur. Script Üretici, Niche Analizci & daha fazlası. 10 ücretsiz kredi.",
      keywords:
        "AI içerik stüdyosu, YouTube Shorts AI, script üretici, niche analizci, viral shorts",
    },
  },
  es: {
    home: {
      title: "InfluexAI – Estudio AI para Shorts Virales",
      description:
        "Crea YouTube Shorts virales con IA en 60 segundos. Generador de Scripts, Analizador de Nicho y más. Plan Starter desde €9,99.",
      keywords:
        "estudio AI creador, YouTube Shorts IA, generador scripts, analizador nicho, shorts virales",
    },
  },
  fr: {
    home: {
      title: "InfluexAI – Studio IA pour Shorts Viraux",
      description:
        "Créez des YouTube Shorts viraux avec l'IA en 60 secondes. Générateur de Scripts, Analyseur de Niche & plus. 10 crédits gratuits.",
      keywords:
        "studio IA créateur, YouTube Shorts IA, générateur scripts, analyseur niche, shorts viraux",
    },
  },
  ar: {
    home: {
      title: "InfluexAI – استوديو AI لإنشاء مقاطع فيروسية",
      description:
        "أنشئ مقاطع YouTube Shorts فيروسية بالذكاء الاصطناعي في 60 ثانية. منشئ النصوص، محلل المجال والمزيد. 10 رصيد مجاني.",
      keywords:
        "استوديو AI منشئ, يوتيوب شورتس ذكاء اصطناعي, منشئ نصوص, محلل مجال",
    },
  },
  pt: {
    home: {
      title: "InfluexAI – Estúdio AI para Shorts Virais",
      description:
        "Crie YouTube Shorts virais com IA em 60 segundos. Gerador de Scripts, Analisador de Nicho & mais. 10 créditos grátis.",
      keywords:
        "estúdio AI criador, YouTube Shorts IA, gerador scripts, analisador nicho, shorts virais",
    },
  },
};

export const OG_HEADLINES: Record<Locale, string> = {
  de: "Virale Shorts in 60 Sekunden",
  en: "Viral Shorts in 60 Seconds",
  el: "Viral Shorts σε 60 Δευτερόλεπτα",
  tr: "60 Saniyede Viral Shorts",
  es: "Shorts Virales en 60 Segundos",
  fr: "Shorts Viraux en 60 Secondes",
  ar: "شورتس فيروسية في 60 ثانية",
  pt: "Shorts Virais em 60 Segundos",
};

export const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  de: "de_DE",
  en: "en_US",
  el: "el_GR",
  tr: "tr_TR",
  es: "es_ES",
  fr: "fr_FR",
  ar: "ar_SA",
  pt: "pt_BR",
};

/** Public marketing pages included in the multilingual sitemap */
export const SEO_STATIC_PATHS = [
  "/",
  "/blog",
  "/guides",
  "/api-docs",
  "/docs",
  "/beta",
  "/dashboard/white-label",
  "/community",
  "/pricing",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/cookies",
] as const;

export function localizedUrl(path: string, lang: Locale | string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = `${SEO_BASE_URL}${normalized === "/" ? "" : normalized}`;
  if (lang === defaultLocale || lang === "de") {
    return normalized === "/" ? SEO_BASE_URL : `${SEO_BASE_URL}${normalized}`;
  }
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}lang=${lang}`;
}

export function buildHreflangAlternates(path: string = "/") {
  const languages = Object.fromEntries(
    SEO_LOCALES.map((lang) => [lang, localizedUrl(path, lang)])
  ) as Record<string, string>;

  return {
    canonical: localizedUrl(path, defaultLocale),
    languages: {
      ...languages,
      "x-default": localizedUrl(path, defaultLocale),
    },
  };
}

export function getHomeSeo(locale: string): SeoPageMeta {
  const key = locale as Locale;
  return seoConfig[key]?.home ?? seoConfig.de.home;
}

export function parseKeywords(keywords: string): string[] {
  return keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export function openGraphImageUrl(lang: Locale | string): string {
  return `/opengraph-image?lang=${lang}`;
}
