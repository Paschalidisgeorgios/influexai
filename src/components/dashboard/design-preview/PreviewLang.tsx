"use client";

/**
 * PreviewLang — Language context + DE/EN translations.
 * MOCK — used only in /dashboard/design-preview.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

// ─── View type (shared across all preview components) ─────────────────────────

export type PreviewView = "studio" | "agent" | "tools" | "gallery" | "settings";

// ─── Language ─────────────────────────────────────────────────────────────────

export type Lang = "de" | "en";

// ─── Translations ─────────────────────────────────────────────────────────────

const de = {
  systemLine: "INFLUEXAI // CREATOR PRODUCTION OS",
  credits: "Credits", plan: "Plan", proPlan: "Pro Plan", mock: "Mock",

  nav: {
    studio:   "Studio",
    agent:    "Agent",
    tools:    "Tools",
    gallery:  "Galerie",
    settings: "Einstellungen",
  },

  studio: {
    overline:      "Creator Production OS",
    headline:      "Verwandle eine Idee in eine\nkomplette Creator-Kampagne.",
    subline:       "InfluexAI verbindet Agent, Bild, Video, Hooks und Assets in einem AI-native Production OS.",
    pipelineLabel: "Production Pipeline",
    pipelineSteps: [
      { num:"01", label:"Idee",        desc:"Beschreibe dein Ziel."           },
      { num:"02", label:"Agent",       desc:"InfluexAI analysiert die Anfrage."},
      { num:"03", label:"Tool",        desc:"Das passende Tool wird aktiviert."},
      { num:"04", label:"Generierung", desc:"KI erzeugt das Asset."            },
      { num:"05", label:"Review",      desc:"Du bewertest das Ergebnis."       },
      { num:"06", label:"Export",      desc:"Bereit für alle Plattformen."     },
    ],
    areasLabel:    "Produktionsbereiche",
    toolsOverline: "Studio-Werkzeuge",
    toolsCta:      "Alle anzeigen →",
    recentLabel:   "Letzte Outputs · Mock",
    recentCta:     "Galerie →",
  },

  agent: {
    overline:    "Agent Command Center",
    headline:    "Was möchtest du heute\nerstellen?",
    subline:     "Beschreibe deine Idee. InfluexAI wählt das passende Tool und führt dich zum nächsten Schritt.",
    generate:    "Generieren",
    generating:  "Erstelle…",
    enterHint:   "Enter zum Generieren · Umschalt+Enter für neue Zeile",
    promptsLabel:"Versuche:",
    statusMessages: [
      "Idee wird analysiert…",
      "Passendes Tool wird gewählt…",
      "Workflow wird vorbereitet…",
    ],
    quickActions: ["Bild erstellen","Video erstellen","Kampagne starten","Hook schreiben","Avatar erstellen"],
    prompts: [
      "Erstelle ein TikTok-Video für mein Produkt",
      "Mache 5 Hooks für eine Beauty-Kampagne",
      "Verwandle dieses Bild in ein Video",
      "Erstelle einen UGC-Style Ad für Instagram",
      "Schreibe mir eine Kampagne für ein Restaurant",
    ],
    workflowLabel:"So funktioniert es:",
    workflowSteps:[
      { step:"01", title:"Idee beschreiben",  desc:"Erkläre dein Produkt oder deine Kampagne in einem Satz." },
      { step:"02", title:"Tool-Auswahl",      desc:"InfluexAI wählt das passende Tool automatisch."          },
      { step:"03", title:"Asset generieren",  desc:"Dein Asset wird in Sekunden erstellt."                   },
    ],
  },

  tools: {
    overline:      "Studio-Werkzeuge",
    headline:      "Capabilities.",
    backCta:       "← Zurück",
    selectCta:     "Auswählen →",
    startCta:      "Starten →",
    credits:       "Credits",
    free:          "Kostenlos",
    statusActive:  "Aktiv",
    statusPreview: "Preview",
    statusSoon:    "Bald",
    engineLabel:   "Engine / Modell",
    outputLabel:   "Output",
    toolsCount:    "{count} Tools",
    categories: { foto:"Foto", video:"Video", avatar:"Avatar & Voice", text:"Text & Kampagne", brand:"Brand / Assets" },
    catDesc: {
      foto:   "Bilder generieren & bearbeiten",
      video:  "Videos erstellen & animieren",
      avatar: "Avatare & Sprachsynthese",
      text:   "Hooks, Scripts & Kampagnen",
      brand:  "Brand-Kit & Asset-Verwaltung",
    },
    styles:  ["Editorial Luxury","Cinematic","Minimal Clean","Bold & Vivid","UGC Authentic"],
    formats: { image:["1:1 Quadrat","4:5 Hochformat","16:9 Querformat","3:4 Standard"], video:["16:9 Querformat","9:16 Hochformat","1:1 Quadrat"] },
    styleLabel:         "Stil",
    stylePlaceholder:   "Stil wählen…",
    promptLabel:        "Prompt",
    topicLabel:         "Thema / Produkt",
    uploadLabel:        "Referenz-Bild (optional)",
    uploadHint:         "Datei ablegen — PNG, JPG, max 10 MB",
    formatLabel:        "Format",
    generateImageLabel: "Bild generieren",
    generateVideoLabel: "Video generieren",
    generateHookLabel:  "Hooks generieren",
    mockNote:           "Mock · {credits} Credits",
    emptyState:         "Starte die Generierung,\num dein erstes Asset zu sehen.",
  },

  gallery: {
    overline:    "Studio-Archiv · Mock",
    headline:    "Galerie.",
    assetsCount: "{count} Assets",
    empty:       "Keine Assets in dieser Kategorie.",
    filters: { all:"Alle", images:"Bilder", videos:"Videos", texts:"Texte", campaigns:"Kampagnen", favorites:"Favoriten", failed:"Fehler" },
    sizes:   { small:"Klein",  medium:"Mittel",  large:"Groß"    },
    sorts:   { newest:"Neueste",oldest:"Älteste",tool:"Tool",project:"Projekt",status:"Status" },
    hover:   { open:"Öffnen", download:"Download", favorite:"Favorit" },
  },

  settings: {
    overline:  "Einstellungen",
    headline:  "Workspace Settings.",
    sections:  { account:"Account", billing:"Billing & Credits", workspace:"Workspace", brand:"Brand Defaults", generation:"Generierung", privacy:"Datenschutz", notifications:"Benachrichtigungen", api:"API & Integrationen" },
    save:      "Speichern",
    update:    "Aktualisieren",
    delete:    "Löschen",
    connect:   "Verbinden",
    connected: "Verbunden",
    dangerZone:"Gefahrenzone",
    dangerDesc:"Account dauerhaft löschen — alle Daten werden entfernt.",
    supportTitle:"Support Tickets",
    supportDesc: "Direkte Tickets innerhalb von InfluexAI — bald verfügbar. Erreichbar über support@influexai.com.",
    comingSoon:  "Bald verfügbar",
  },
};

const en: typeof de = {
  systemLine: "INFLUEXAI // CREATOR PRODUCTION OS",
  credits: "Credits", plan: "Plan", proPlan: "Pro Plan", mock: "Mock",

  nav: { studio:"Studio", agent:"Agent", tools:"Tools", gallery:"Gallery", settings:"Settings" },

  studio: {
    overline:      "Creator Production OS",
    headline:      "Turn one idea into a\ncomplete creator campaign.",
    subline:       "InfluexAI connects agent, image, video, hooks and assets inside an AI-native production OS.",
    pipelineLabel: "Production Pipeline",
    pipelineSteps: [
      { num:"01", label:"Idea",      desc:"Describe your goal."             },
      { num:"02", label:"Agent",     desc:"InfluexAI analyzes the request." },
      { num:"03", label:"Tool",      desc:"The right tool is activated."    },
      { num:"04", label:"Generate",  desc:"AI produces the asset."          },
      { num:"05", label:"Review",    desc:"You rate the result."            },
      { num:"06", label:"Export",    desc:"Ready for all platforms."        },
    ],
    areasLabel:    "Production Areas",
    toolsOverline: "Studio Tools",
    toolsCta:      "View all →",
    recentLabel:   "Recent Outputs · Mock",
    recentCta:     "Gallery →",
  },

  agent: {
    overline:    "Agent Command Center",
    headline:    "What do you want to\ncreate today?",
    subline:     "Describe your idea. InfluexAI selects the right tool and guides the next step.",
    generate:    "Generate",
    generating:  "Creating…",
    enterHint:   "Enter to generate · Shift+Enter for new line",
    promptsLabel:"Try:",
    statusMessages: ["Analyzing idea…","Selecting best tool…","Preparing workflow…"],
    quickActions: ["Create image","Create video","Start campaign","Write hook","Create avatar"],
    prompts: [
      "Create a TikTok video for my product",
      "Write 5 hooks for a beauty campaign",
      "Turn this image into a short video",
      "Create a UGC-style ad for Instagram",
      "Build a campaign for a restaurant",
    ],
    workflowLabel:"How it works:",
    workflowSteps:[
      { step:"01", title:"Describe idea",   desc:"Explain your product or campaign in one sentence." },
      { step:"02", title:"Tool selection",  desc:"InfluexAI selects the right tool automatically."   },
      { step:"03", title:"Generate asset",  desc:"Your asset is ready in seconds."                   },
    ],
  },

  tools: {
    overline:      "Studio Tools",
    headline:      "Capabilities.",
    backCta:       "← Back",
    selectCta:     "Select →",
    startCta:      "Start →",
    credits:       "Credits",
    free:          "Free",
    statusActive:  "Active",
    statusPreview: "Preview",
    statusSoon:    "Soon",
    engineLabel:   "Engine / Model",
    outputLabel:   "Output",
    toolsCount:    "{count} Tools",
    categories: { foto:"Photo", video:"Video", avatar:"Avatar & Voice", text:"Text & Campaign", brand:"Brand / Assets" },
    catDesc: {
      foto:   "Generate & edit images",
      video:  "Create & animate videos",
      avatar: "Avatars & voice synthesis",
      text:   "Hooks, scripts & campaigns",
      brand:  "Brand kit & asset management",
    },
    styles:  ["Editorial Luxury","Cinematic","Minimal Clean","Bold & Vivid","UGC Authentic"],
    formats: { image:["1:1 Square","4:5 Portrait","16:9 Landscape","3:4 Standard"], video:["16:9 Landscape","9:16 Portrait","1:1 Square"] },
    styleLabel:         "Style",
    stylePlaceholder:   "Choose style…",
    promptLabel:        "Prompt",
    topicLabel:         "Topic / Product",
    uploadLabel:        "Reference Image (optional)",
    uploadHint:         "Drop file here — PNG, JPG, max 10 MB",
    formatLabel:        "Format",
    generateImageLabel: "Generate image",
    generateVideoLabel: "Generate video",
    generateHookLabel:  "Generate hooks",
    mockNote:           "Mock · {credits} Credits",
    emptyState:         "Start generation to\nsee your first asset.",
  },

  gallery: {
    overline:    "Studio Archive · Mock",
    headline:    "Gallery.",
    assetsCount: "{count} Assets",
    empty:       "No assets in this category.",
    filters: { all:"All", images:"Images", videos:"Videos", texts:"Texts", campaigns:"Campaigns", favorites:"Favorites", failed:"Failed" },
    sizes:   { small:"Small", medium:"Medium", large:"Large" },
    sorts:   { newest:"Newest",oldest:"Oldest",tool:"Tool",project:"Project",status:"Status" },
    hover:   { open:"Open", download:"Download", favorite:"Favorite" },
  },

  settings: {
    overline:  "Settings",
    headline:  "Workspace Settings.",
    sections:  { account:"Account", billing:"Billing & Credits", workspace:"Workspace", brand:"Brand Defaults", generation:"Generation", privacy:"Privacy", notifications:"Notifications", api:"API & Integrations" },
    save:      "Save",
    update:    "Update",
    delete:    "Delete",
    connect:   "Connect",
    connected: "Connected",
    dangerZone:"Danger Zone",
    dangerDesc:"Permanently delete account — all data will be removed.",
    supportTitle:"Support Tickets",
    supportDesc: "Direct tickets inside InfluexAI — coming soon. Reach us at support@influexai.com.",
    comingSoon:  "Coming Soon",
  },
};

export const TRANSLATIONS: Record<Lang, typeof de> = { de, en };
export type Translations = typeof de;

// ─── Context ──────────────────────────────────────────────────────────────────

interface LangCtx { lang: Lang; setLang: (l: Lang) => void; t: Translations }

export const LangContext = createContext<LangCtx>({ lang:"de", setLang:()=>{}, t:de });
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("de");
  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}
