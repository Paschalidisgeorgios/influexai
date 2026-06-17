"use client";

/**
 * PreviewLang — Language context + DE/EN translations.
 * MOCK — used only in /dashboard/design-preview.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

// ─── View type (shared across all preview components) ─────────────────────────

export type PreviewView = "studio" | "command" | "production" | "gallery" | "settings";

// ─── Language ─────────────────────────────────────────────────────────────────

export type Lang = "de" | "en";

// ─── Translations ─────────────────────────────────────────────────────────────

const de = {
  systemLine: "INFLUEXAI // DESIGN PREVIEW",
  previewBanner: "Design Preview — nicht das Produktions-Dashboard.",
  previewBannerCta: "Zum echten Studio →",
  credits: "Credits", plan: "Plan", proPlan: "Pro Plan", mock: "Preview",

  nav: {
    studio:     "Studio",
    command:    "Command",
    production: "Produktion",
    gallery:    "Galerie",
    settings:   "Einstellungen",
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

  commandOs: {
    overline:         "Creator Studio",
    agentOverline:    "Production Command",
    headline:         "Was möchtest du produzieren?",
    subline:          "Beschreibe dein Asset oder deine Kampagne. InfluexAI erkennt den Produktionsweg und öffnet das passende Workflow-Panel — kein Tool-Labyrinth.",
    inputPlaceholder: "Beschreibe, was du produzieren möchtest …",
    submitCta:        "Produktion starten",
    enterHint:        "Enter starten · Umschalt+Enter neue Zeile",
    examplesLabel:    "Beispiele",
    examples: [
      "Erstelle ein Kampagnenbild für Instagram",
      "Verwandle dieses Bild in ein kurzes Reel",
      "Plane 7 Content-Ideen für eine Beauty-Marke",
      "Erstelle Varianten für dieses Asset",
    ],
    platformQuestion:    "Für welche Plattform oder welchen Zweck soll das Asset entstehen?",
    platformPlaceholder: "z. B. Instagram Reel, LinkedIn Post, Website Hero",
    platformApply:       "Übernehmen",
    flowSteps: [
      { num: "01", title: "Command",  desc: "Idee eingeben — das Studio startet hier, nicht bei der Tool-Liste." },
      { num: "02", title: "Workflow", desc: "Passendes Panel mit Format, Stil und Engine-Kontext." },
      { num: "03", title: "Asset",    desc: "Live Preview, Galerie und nächste Produktionsschritte." },
    ],
    prompts: {
      original:  "Original Prompt",
      optimized: "Optimierter Produktionsprompt",
    },
    workflow: {
      panelLabel:   "Dynamic Workflow",
      defaultCta:   "Produktion starten",
      generating:   "Erstelle …",
      unknownHint:  "Beschreibe genauer, was du produzieren möchtest — Bild, Video, Kampagne oder Asset-Variante.",
      promptHint:   "Prompts werden für die Produktions-Engine optimiert.",
      image: {
        format:           "Format",
        style:            "Stil",
        quality:          "Qualität",
        platformDetected: "Plattform erkannt",
        cta:              "Bild erstellen",
      },
      video: {
        startImage:       "Startbild",
        upload:           "Upload",
        gallery:          "Aus Galerie wählen",
        url:              "URL optional",
        motionPrompt:     "Motion Prompt",
        format:           "Format",
        quality:          "Qualität",
        platformDetected: "Plattform erkannt",
        cta:              "Video erstellen",
      },
      campaign: {
        platform:      "Plattform",
        audience:      "Zielgruppe",
        count:         "Anzahl Ideen",
        hookDirection: "Hook-Richtung",
        cta:           "Kampagne planen",
      },
      asset: {
        pickAsset: "Asset aus Galerie wählen",
        action:    "Aktion",
        actions:   ["Variante", "Remix", "Motion", "Speichern"],
        cta:       "Variante erstellen",
      },
    },
    preview: {
      label:        "Live Preview",
      empty:        "Preview erscheint nach Start",
      generating:   "Asset wird erzeugt …",
      assetHint:    "Generiertes Asset erscheint hier — danach Galerie, Export oder nächste Aktion.",
      campaignHint: "Hooks und Content-Plan erscheinen hier nach der Planung.",
    },
    next: {
      recentLabel:  "Recent Assets",
      actionsLabel: "Next Actions",
      actions: [
        "Als Video animieren",
        "Variante erstellen",
        "In Galerie speichern",
        "Kampagne daraus planen",
      ],
      galleryCta: "Zur Galerie →",
    },
    advanced: {
      label:      "Advanced Settings",
      model:      "Modell",
      provider:   "Provider",
      seed:       "Seed",
      resolution: "Auflösung",
      duration:   "Dauer",
      credits:    "Credits",
    },
  },

  productionHub: {
    overline:  "Production Workflows",
    headline:  "Aktive MVP-Workflows — nicht die Tool-Liste.",
    subline:   "InfluexAI führt dich über Produktionswege. Modelle und Provider bleiben im Hintergrund — erreichbar über Advanced Settings.",
    mvpLabel:  "Aktive Workflows",
    openCta:   "Workflow öffnen",
    prepLabel: "In Vorbereitung",
    prepCopy:  "Dieses Studio-Setup ist noch nicht aktiviert. Keine Credits, keine falschen Erwartungen — nur Vorschau der kommenden Flächen.",
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
    overline:      "Production Tools",
    headline:      "Wähle deinen Produktionsbereich.",
    subline:       "Starte mit Foto, Video, Avatar, Text oder Brand Assets — InfluexAI führt dich zur passenden Engine.",
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

  nav: { studio:"Studio", command:"Command", production:"Production", gallery:"Gallery", settings:"Settings" },

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

  commandOs: {
    overline:         "Creator Studio",
    agentOverline:    "Production Command",
    headline:         "What do you want to produce?",
    subline:          "Describe your asset or campaign. InfluexAI detects the production path and opens the matching workflow panel — not a tool maze.",
    inputPlaceholder: "Describe what you want to produce …",
    submitCta:        "Start production",
    enterHint:        "Enter to start · Shift+Enter new line",
    examplesLabel:    "Examples",
    examples: [
      "Create a campaign image for Instagram",
      "Turn this image into a short reel",
      "Plan 7 content ideas for a beauty brand",
      "Create variants for this asset",
    ],
    platformQuestion:    "Which platform or purpose should this asset be created for?",
    platformPlaceholder: "e.g. Instagram Reel, LinkedIn post, website hero",
    platformApply:       "Apply",
    flowSteps: [
      { num: "01", title: "Command",  desc: "Enter your idea — the studio starts here, not at the tool list." },
      { num: "02", title: "Workflow", desc: "Matching panel with format, style and engine context." },
      { num: "03", title: "Asset",    desc: "Live preview, gallery and next production steps." },
    ],
    prompts: {
      original:  "Original prompt",
      optimized: "Optimized production prompt",
    },
    workflow: {
      panelLabel:   "Dynamic Workflow",
      defaultCta:   "Start production",
      generating:   "Creating …",
      unknownHint:  "Describe more precisely — image, video, campaign or asset variant.",
      promptHint:   "Prompts are optimized for the production engine.",
      image: {
        format:           "Format",
        style:            "Style",
        quality:          "Quality",
        platformDetected: "Platform detected",
        cta:              "Create image",
      },
      video: {
        startImage:       "Start frame",
        upload:           "Upload",
        gallery:          "Pick from gallery",
        url:              "URL optional",
        motionPrompt:     "Motion prompt",
        format:           "Format",
        quality:          "Quality",
        platformDetected: "Platform detected",
        cta:              "Create video",
      },
      campaign: {
        platform:      "Platform",
        audience:      "Audience",
        count:         "Number of ideas",
        hookDirection: "Hook direction",
        cta:           "Plan campaign",
      },
      asset: {
        pickAsset: "Pick asset from gallery",
        action:    "Action",
        actions:   ["Variant", "Remix", "Motion", "Save"],
        cta:       "Create variant",
      },
    },
    preview: {
      label:        "Live Preview",
      empty:        "Preview appears after start",
      generating:   "Generating asset …",
      assetHint:    "Generated asset appears here — then gallery, export or next action.",
      campaignHint: "Hooks and content plan appear here after planning.",
    },
    next: {
      recentLabel:  "Recent assets",
      actionsLabel: "Next actions",
      actions: [
        "Animate as video",
        "Create variant",
        "Save to gallery",
        "Plan campaign from this",
      ],
      galleryCta: "Open gallery →",
    },
    advanced: {
      label:      "Advanced settings",
      model:      "Model",
      provider:   "Provider",
      seed:       "Seed",
      resolution: "Resolution",
      duration:   "Duration",
      credits:    "Credits",
    },
  },

  productionHub: {
    overline:  "Production Workflows",
    headline:  "Active MVP workflows — not a tool list.",
    subline:   "InfluexAI guides you through production paths. Models and providers stay in the background — available via advanced settings.",
    mvpLabel:  "Active workflows",
    openCta:   "Open workflow",
    prepLabel: "In preparation",
    prepCopy:  "This studio setup is not activated yet. No credits, no false expectations — preview of upcoming surfaces only.",
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
    overline:      "Production Tools",
    headline:      "Choose your production area.",
    subline:       "Start with image, video, avatar, text or brand assets — InfluexAI guides you to the right engine.",
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
