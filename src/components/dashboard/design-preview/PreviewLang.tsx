"use client";

/**
 * PreviewLang — Language context + DE/EN translations.
 * MOCK — used only in /dashboard/design-preview.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

// ─── View type (shared across all preview components) ─────────────────────────

export type PreviewView = "studio" | "gallery" | "campaigns" | "brandkit" | "settings";

// ─── Language ─────────────────────────────────────────────────────────────────

export type Lang = "de" | "en";

// ─── Translations ─────────────────────────────────────────────────────────────

const de = {
  systemLine: "INFLUEXAI // DESIGN PREVIEW",
  previewBanner: "Design Preview — nicht das Produktions-Dashboard.",
  previewBannerCta: "Zum echten Studio →",
  credits: "Credits", plan: "Plan", proPlan: "Pro Plan", mock: "Preview",

  nav: {
    studio:    "Studio",
    gallery:   "Galerie",
    campaigns: "Kampagnen",
    brandkit:  "Brand Kit",
    settings:  "Einstellungen",
  },

  studioCommand: {
    overline:     "Studio",
    headline:     "Was möchtest du erstellen?",
    subline:
      "Beschreibe dein Ziel. InfluexAI erkennt den passenden Workflow und bereitet die Produktion vor.",
    placeholder:  "Beschreibe, was du erstellen möchtest…",
    enterHint:    "Enter sendet · Umschalt+Enter für neue Zeile",
    loadingHint:  "Workflow wird vorbereitet…",
    idleHint:     "Beschreibe dein Ziel — InfluexAI erkennt den Workflow und zeigt das Ergebnis direkt hier.",
    platformAsk:  "Für welche Plattform oder welchen Zweck soll das Asset entstehen?",
    assetLabel:   "Asset",
    galleryChip:  "Galerie",
    formatChip:   "Format automatisch",
    mvpLabel:     "MVP-Workflows · Produktions-Dashboard",
    rotatingPrompts: [
      "Erstelle einen AI Influencer für Instagram",
      "Produktbild für Olivenöl Premium",
      "Nutze Flux Ultra für ein Portrait",
      "Mach daraus ein Video",
    ],
    chips: [
      { id: "influencer", prompt: { de: "Erstelle einen AI Influencer für Instagram", en: "Create an AI influencer for Instagram" }, label: "AI Influencer" },
      { id: "product", prompt: { de: "Produktbild für Olivenöl Premium", en: "Premium product visual for olive oil" }, label: "Produktvisual" },
      { id: "video", prompt: { de: "Verwandle dieses Bild in ein Video", en: "Turn this image into a video" }, label: "Video" },
      { id: "hook",  prompt: { de: "Schreib mir Hooks für das Bild", en: "Write hooks for this image" }, label: "Hook" },
    ],
    mvpLinks: [
      { label: "image-gen", href: "/dashboard?tool=image-gen" },
      { label: "image-gen ultra", href: "/dashboard?tool=image-gen&quality=ultra&engine=flux-ultra" },
      { label: "ki-influencer", href: "/dashboard/ki-influencer" },
      { label: "img-to-video", href: "/dashboard?tool=img-to-video" },
      { label: "viral-hook", href: "/dashboard?tool=viral-hook" },
    ],
  },

  campaigns: {
    overline:  "Kampagnen",
    headline:  "Kampagnen planen und ausführen",
    subline:   "Content-Kalender und Kampagnen-Workflows — erreichbar über Studio-Command oder direkt im Produktions-Dashboard.",
    cta:       "Content-Kalender öffnen →",
  },

  brandKit: {
    overline:  "Brand Kit",
    headline:  "Brand Defaults & Assets",
    subline:   "Farben, Logos und Marken-Defaults — dieses Studio-Setup ist in der Preview noch nicht aktiviert.",
  },

  studio: {
    overline:      "Studio",
    headline:      "Heute im Studio",
    subline:       "Überblick über Produktionen, Assets und Credits — Cockpit, nicht Agent-Eingabe.",
    pipelineLabel: "Produktionsstatus",
    pipelineSteps: [
      { num:"01", label:"Aktive Jobs",    desc:"Laufende Generierungen."        },
      { num:"02", label:"Letzte Assets",  desc:"Zuletzt erzeugte Inhalte."      },
      { num:"03", label:"Credits",      desc:"Verfügbares Guthaben & Plan."   },
      { num:"04", label:"Schnellstart", desc:"Häufige Tools direkt starten."  },
      { num:"05", label:"Weiter",       desc:"Zum Agent oder zur Galerie."    },
      { num:"06", label:"System",       desc:"Brand Kit, Exporte, Fehler."    },
    ],
    areasLabel:    "Schnell starten",
    toolsOverline: "Tools",
    toolsCta:      "Alle Tools →",
    recentLabel:   "Letzte Assets",
    recentCta:     "Galerie →",
    mediaLabel:    "Asset Library",
    mediaHeadline: "Beispiel-Assets aus der Bibliothek.",
    mediaSubline:  "Vorschau-Daten — im Produktions-Dashboard echte Assets aus der Galerie.",
    mediaPrimaryTag:   "Beispiel",
    mediaPrimaryTitle: "Letztes Asset",
    mediaPrimaryDesc:  "Platzhalter für Bild, Video oder Text aus deiner Asset Library.",
    mediaOutputs: [
      { type: "Bild",  label: "Kampagnenvisual",  ratio: "4/5"  },
      { type: "Video", label: "Kurzvideo",        ratio: "9/16" },
      { type: "Hook",  label: "Hook-Varianten",   ratio: "1/1" },
    ],
    mediaExportLine: "Exporte nach Share/Download in der Galerie",
    continueCta:     "Zum Agent",
    continueHint:    "Idee eingeben und Produktionspfad starten",
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
    overline:      "Workflows",
    headline:      "Produktions-Workflows",
    subline:       "Aktive MVP-Workflows — erreichbar über Command oder direkt hier.",
    mvpLabel:      "Aktive Workflows",
    prepLabel:     "In Vorbereitung",
    prepCopy:      "Dieses Studio-Setup ist noch nicht aktiviert.",
    flowLabel:     "Produktionspfad",
    stepCategory:  "Bereich",
    stepTool:      "Tool",
    stepEngine:    "Engine",
    stepGenerate:  "Generierung",
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
    mockNote:           "Preview · {credits} Credits",
    emptyState:         "Starte die Generierung, um dein erstes Asset zu sehen.",
  },

  gallery: {
    overline:    "Studio-Archiv",
    headline:    "Asset Library",
    subline:     "Alle Bilder, Videos, Hooks und Kampagnen an einem Ort — filterbar, sichtbar und bereit für den Export.",
    assetsCount: "{count} Assets",
    filterLabel: "Filter",
    sizeLabel:   "Größe",
    sortLabel:   "Sortierung",
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
  systemLine: "INFLUEXAI // DESIGN PREVIEW",
  previewBanner: "Design Preview — not the production dashboard.",
  previewBannerCta: "Open production studio →",
  credits: "Credits", plan: "Plan", proPlan: "Pro Plan", mock: "Preview",

  nav: {
    studio:    "Studio",
    gallery:   "Gallery",
    campaigns: "Campaigns",
    brandkit:  "Brand Kit",
    settings:  "Settings",
  },

  studioCommand: {
    overline:     "Studio",
    headline:     "What do you want to create?",
    subline:
      "Describe your goal. InfluexAI recognizes the right workflow and prepares production.",
    placeholder:  "Describe what you want to create…",
    enterHint:    "Enter to send · Shift+Enter for new line",
    loadingHint:  "Preparing workflow…",
    idleHint:     "Describe your goal — InfluexAI recognizes the workflow and shows the result right here.",
    platformAsk:  "Which platform or purpose should this asset target?",
    assetLabel:   "Asset",
    galleryChip:  "Gallery",
    formatChip:   "Format auto",
    mvpLabel:     "MVP workflows · production dashboard",
    rotatingPrompts: [
      "Create an AI influencer for Instagram",
      "Premium product visual for olive oil",
      "Use Flux Ultra for a portrait",
      "Turn this into a video",
    ],
    chips: [
      { id: "influencer", prompt: { de: "Erstelle einen AI Influencer für Instagram", en: "Create an AI influencer for Instagram" }, label: "AI Influencer" },
      { id: "product", prompt: { de: "Produktbild für Olivenöl Premium", en: "Premium product visual for olive oil" }, label: "Product visual" },
      { id: "video", prompt: { de: "Verwandle dieses Bild in ein Video", en: "Turn this image into a video" }, label: "Video" },
      { id: "hook",  prompt: { de: "Schreib mir Hooks für das Bild", en: "Write hooks for this image" }, label: "Hook" },
    ],
    mvpLinks: [
      { label: "image-gen", href: "/dashboard?tool=image-gen" },
      { label: "image-gen ultra", href: "/dashboard?tool=image-gen&quality=ultra&engine=flux-ultra" },
      { label: "ki-influencer", href: "/dashboard/ki-influencer" },
      { label: "img-to-video", href: "/dashboard?tool=img-to-video" },
      { label: "viral-hook", href: "/dashboard?tool=viral-hook" },
    ],
  },

  campaigns: {
    overline:  "Campaigns",
    headline:  "Plan and run campaigns",
    subline:   "Content calendar and campaign workflows — via Studio command or directly in the production dashboard.",
    cta:       "Open content calendar →",
  },

  brandKit: {
    overline:  "Brand Kit",
    headline:  "Brand defaults & assets",
    subline:   "Colors, logos and brand defaults — not activated in this preview yet.",
  },

  studio: {
    overline:      "Studio",
    headline:      "Today in Studio",
    subline:       "Overview of productions, assets and credits — cockpit, not agent input.",
    pipelineLabel: "Production status",
    pipelineSteps: [
      { num:"01", label:"Active jobs",   desc:"Running generations."           },
      { num:"02", label:"Recent assets", desc:"Latest created content."        },
      { num:"03", label:"Credits",       desc:"Available balance & plan."      },
      { num:"04", label:"Quick start",   desc:"Launch frequent tools quickly." },
      { num:"05", label:"Continue",      desc:"Go to Agent or Gallery."        },
      { num:"06", label:"System",        desc:"Brand kit, exports, errors."    },
    ],
    areasLabel:    "Quick start",
    toolsOverline: "Tools",
    toolsCta:      "All tools →",
    recentLabel:   "Recent assets",
    recentCta:     "Gallery →",
    mediaLabel:    "Asset Library",
    mediaHeadline: "Sample assets from the library.",
    mediaSubline:  "Preview data — production dashboard uses real gallery assets.",
    mediaPrimaryTag:   "Sample",
    mediaPrimaryTitle: "Latest asset",
    mediaPrimaryDesc:  "Placeholder for image, video or text from your asset library.",
    mediaOutputs: [
      { type: "Image", label: "Campaign visual", ratio: "4/5"  },
      { type: "Video", label: "Short video",     ratio: "9/16" },
      { type: "Hook",  label: "Hook variants",   ratio: "1/1" },
    ],
    mediaExportLine: "Exports appear after share/download in Gallery",
    continueCta:     "Open Agent",
    continueHint:    "Enter an idea and start the production path",
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
    overline:      "Workflows",
    headline:      "Production workflows",
    subline:       "Active MVP workflows — reachable via Command or directly here.",
    mvpLabel:      "Active workflows",
    prepLabel:     "In preparation",
    prepCopy:      "This studio setup is not activated yet.",
    flowLabel:     "Production Path",
    stepCategory:  "Area",
    stepTool:      "Tool",
    stepEngine:    "Engine",
    stepGenerate:  "Generation",
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
    mockNote:           "Preview · {credits} Credits",
    emptyState:         "Start generation to see your first asset.",
  },

  gallery: {
    overline:    "Studio Archive",
    headline:    "Asset Library",
    subline:     "All images, videos, hooks and campaigns in one place — filtered, visible and ready to export.",
    assetsCount: "{count} Assets",
    filterLabel: "Filter",
    sizeLabel:   "Size",
    sortLabel:   "Sort",
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
