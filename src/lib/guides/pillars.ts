import type { GuideFaq } from "./types";

export const PILLAR_SLUGS = [
  "youtube-shorts-erstellen",
  "youtube-niche-finden",
  "viral-youtube-shorts",
  "ki-content-creation",
  "youtube-kanal-aufbauen",
] as const;

export type PillarSlug = (typeof PILLAR_SLUGS)[number];

export type PillarMeta = {
  slug: PillarSlug;
  title: string;
  meta_description: string;
  excerpt: string;
  target_keyword: string;
  pillar_keywords: string[];
  cluster_articles: string[];
  category: string;
  featured_snippet: string;
  faqs: GuideFaq[];
  schemaType: "HowTo" | "Article";
  ctaFeature: string;
  ctaRoute: string;
};

export const PILLAR_META: Record<PillarSlug, PillarMeta> = {
  "youtube-shorts-erstellen": {
    slug: "youtube-shorts-erstellen",
    title: "Der ultimative Guide: YouTube Shorts erstellen mit KI (2025)",
    meta_description:
      "YouTube Shorts mit KI erstellen: Script, Hook, Thumbnail und CTA. Schritt-für-Schritt für Creator — von der Idee bis zum Upload.",
    excerpt:
      "Alles zu Scripts, Hooks, Thumbnails und CTAs für Shorts — mit KI-Workflow und konkreten Vorlagen.",
    target_keyword: "youtube shorts erstellen",
    pillar_keywords: [
      "script writing",
      "thumbnails",
      "hooks",
      "cta",
      "youtube shorts",
    ],
    cluster_articles: [],
    category: "YouTube Shorts",
    featured_snippet:
      "YouTube Shorts erstellen bedeutet: einen starken Hook in den ersten 3 Sekunden, komprimierte Story in 15–60 Sekunden und einen klaren CTA. Mit KI sparst du 80% der Schreibzeit bei Scripts und Konzepten.",
    faqs: [
      {
        question: "Wie lang sollte ein YouTube Short Script sein?",
        answer:
          "Für 30–60 Sekunden Shorts empfehlen wir 80–150 Wörter. Der Hook steht in den ersten 1–2 Sätzen, der CTA im letzten Satz.",
      },
      {
        question: "Brauche ich teure Equipment für Shorts?",
        answer:
          "Nein. Smartphone, gutes Licht und ein klares Script reichen. Viele virale Shorts sind mit minimalem Setup gedreht.",
      },
      {
        question: "Kann KI mein komplettes Short Script schreiben?",
        answer:
          "Ja — der InfluexAI Script Generator liefert Hook, Hauptteil und CTA in Sekunden. Du passt Ton und Nische an und filmst.",
      },
    ],
    schemaType: "HowTo",
    ctaFeature: "Script Generator",
    ctaRoute: "/dashboard/script-generator",
  },
  "youtube-niche-finden": {
    slug: "youtube-niche-finden",
    title: "Profitable YouTube Nische finden: Der komplette Leitfaden",
    meta_description:
      "YouTube Nische finden mit Wettbewerbsanalyse, Monetarisierung und Content-Ideen. Leitfaden für profitable Creator-Nischen 2025.",
    excerpt:
      "Nische analysieren, Konkurrenz bewerten und Content-Cluster planen — bevor du Monate in den falschen Markt investierst.",
    target_keyword: "youtube nische finden",
    pillar_keywords: [
      "niche analysis",
      "competition",
      "monetization",
      "youtube niche",
    ],
    cluster_articles: [],
    category: "Niche Strategy",
    featured_snippet:
      "Eine profitable YouTube-Nische verbindet dein Interesse, ausreichend Suchvolumen und monetarisierbares Publikum bei überschaubarer Konkurrenz.",
    faqs: [
      {
        question: "Wie erkenne ich eine übersättigte Nische?",
        answer:
          "Viele Channels mit identischen Formaten, sinkende CTR und kaum Outlier-Videos sind Warnsignale. Nutze Daten statt Bauchgefühl.",
      },
      {
        question: "Kann ich mehrere Nischen kombinieren?",
        answer:
          "Ja, als „Nischen-Stack“: ein Hauptthema (z. B. Fitness) plus Unterthemen (Ernährung, Mobility) für mehr Upload-Frequenz.",
      },
      {
        question: "Hilft KI bei der Nischen-Recherche?",
        answer:
          "Der InfluexAI Niche Analyzer liefert 5 Ideen mit Wettbewerb, Potenzial und Video-Konzepten in einer Analyse.",
      },
    ],
    schemaType: "Article",
    ctaFeature: "Niche Analyzer",
    ctaRoute: "/dashboard/niche-analyzer",
  },
  "viral-youtube-shorts": {
    slug: "viral-youtube-shorts",
    title: "Wie YouTube Shorts viral gehen: Die Wissenschaft dahinter",
    meta_description:
      "Viral YouTube Shorts: Algorithmus, Retention, Outlier-Muster und wiederholbare Formate. Datenbasiert erklärt.",
    excerpt:
      "Outlier erkennen, Muster kopieren und den Algorithmus mit Retention-Hooks füttern — ohne Glücksspiel.",
    target_keyword: "viral youtube shorts",
    pillar_keywords: [
      "outlier detection",
      "viral mechanics",
      "algorithm",
      "retention",
    ],
    cluster_articles: [],
    category: "Viral Growth",
    featured_snippet:
      "Shorts gehen viral, wenn Watch-Time und Wiederholungen über dem Kanal-Durchschnitt liegen — oft durch Curiosity-Gaps, schnelle Payoffs und kontrastreiche Hooks.",
    faqs: [
      {
        question: "Was ist ein Outlier-Video?",
        answer:
          "Ein Video mit 5–10× höherer Performance als der Kanal-Median — oft ein Signal für ein kopierbares Format.",
      },
      {
        question: "Wie wichtig ist der erste Frame?",
        answer:
          "Extrem. Thumbnail-Frame und erste Sekunde entscheiden über Swipe vs. Watch — behandle sie wie eine Werbeanzeige.",
      },
      {
        question: "Kann ich Viralität systematisch analysieren?",
        answer:
          "Ja. Der Outlier Detector in InfluexAI findet Muster in Titel, Hook und Struktur erfolgreicher Shorts.",
      },
    ],
    schemaType: "Article",
    ctaFeature: "Outlier Detector",
    ctaRoute: "/dashboard/outlier-detector",
  },
  "ki-content-creation": {
    slug: "ki-content-creation",
    title: "KI im Content Creation: Tools, Tipps und Best Practices",
    meta_description:
      "KI Content Creation für YouTube: Tools, Workflows, Qualitätskontrolle und Integration von InfluexAI im Creator-Alltag.",
    excerpt:
      "Welche KI-Tools wirklich helfen, wie du Halluzinationen vermeidest und einen wiederholbaren Workflow baust.",
    target_keyword: "ki content creation",
    pillar_keywords: [
      "ai tools",
      "workflow",
      "influexai",
      "creator automation",
    ],
    cluster_articles: [],
    category: "KI Tools",
    featured_snippet:
      "KI im Content Creation ersetzt nicht deine Stimme — sie beschleunigt Recherche, Scripts, Konzepte und Varianten, damit du öfter veröffentlichen kannst.",
    faqs: [
      {
        question: "Welche Aufgaben sollte KI übernehmen?",
        answer:
          "Scripts, Hooks, Thumbnail-Konzepte, Nischen-Recherche und Werbetexte — nicht finale Schnitte oder authentische Stories.",
      },
      {
        question: "Wie vermeide ich generisch klingende KI-Texte?",
        answer:
          "Gib konkrete Beispiele, Nische und Ton vor; editiere 20% manuell; nutze deine echten Erfahrungen im Hauptteil.",
      },
      {
        question: "Was macht InfluexAI anders?",
        answer:
          "Fokus auf Shorts-Creator: Script Generator, Niche Analyzer, Outlier Detector und Thumbnail Concepts in einem Dashboard.",
      },
    ],
    schemaType: "Article",
    ctaFeature: "InfluexAI Dashboard",
    ctaRoute: "/dashboard",
  },
  "youtube-kanal-aufbauen": {
    slug: "youtube-kanal-aufbauen",
    title: "YouTube Kanal aufbauen: Von 0 auf 1000 Subscriber",
    meta_description:
      "YouTube Kanal aufbauen: Positionierung, Upload-Rhythmus, Shorts vs. Longform und Wachstum auf 1000 Abonnenten.",
    excerpt:
      "Kanal-Strategie, Konsistenz, erste 1000 Subscriber und Skalierung mit Shorts als Wachstumsmotor.",
    target_keyword: "youtube kanal aufbauen",
    pillar_keywords: [
      "channel strategy",
      "consistency",
      "growth",
      "subscribers",
    ],
    cluster_articles: [],
    category: "Channel Growth",
    featured_snippet:
      "Ein YouTube-Kanal wächst von 0 auf 1000 Subscriber durch klare Positionierung, 2–4 Uploads pro Woche und Shorts als Discovery-Kanal für Longform oder Offers.",
    faqs: [
      {
        question: "Shorts oder Longform zuerst?",
        answer:
          "Shorts für Reichweite und Daten; Longform für Tiefe und Monetarisierung. Viele Creator starten mit Shorts.",
      },
      {
        question: "Wie oft soll ich uploaden?",
        answer:
          "Lieber 3 gute Shorts pro Woche als täglich mittelmäßige Inhalte. Konsistenz schlägt Volumen ohne Qualität.",
      },
      {
        question: "Wann lohnt sich Monetarisierung?",
        answer:
          "Ab 1000 Subscriber und 4000 Stunden (Longform) — parallel Affiliate, digitale Produkte oder Sponsoring in der Nische.",
      },
    ],
    schemaType: "HowTo",
    ctaFeature: "Script Generator",
    ctaRoute: "/dashboard/script-generator",
  },
};

export function isPillarSlug(slug: string): slug is PillarSlug {
  return (PILLAR_SLUGS as readonly string[]).includes(slug);
}
