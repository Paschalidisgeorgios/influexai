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
      title: "InfluexAI Creator Studio — AI-native Creator Operating System",
      description:
        "InfluexAI ist dein AI-native Creator Operating System für Visuals, UGC und Kampagnen-Workflows. Ziel eingeben, Agent erkennt den Workflow, Assets entstehen in der Galerie.",
      keywords:
        "Creator Operating System, KI Creator Studio, UGC Workflows, AI Influencer, Kampagnen Visuals, Content Produktion",
    },
  },
  en: {
    home: {
      title: "InfluexAI Creator Studio — AI-native Creator Operating System",
      description:
        "InfluexAI is your AI-native creator operating system for visuals, UGC, and campaign workflows. Describe your goal, the agent routes the workflow, assets land in your gallery.",
      keywords:
        "creator operating system, AI creator studio, UGC workflows, AI influencer, campaign visuals, content production",
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
