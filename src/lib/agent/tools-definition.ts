import type { AgentToolName } from "./types";

export const AGENT_TOOL_STEP_LABELS: Record<AgentToolName, string> = {
  analyze_niche: "🔍 Nische wird analysiert…",
  generate_script: "✍️ Script wird generiert…",
  generate_thumbnail: "🎨 Thumbnail-Konzept wird erstellt…",
  viral_score: "📊 Viral Score wird berechnet…",
  detect_outlier: "🔥 Outlier werden gesucht…",
  analyze_competitor: "🎯 Konkurrenz wird analysiert…",
  generate_image: "🖼 Bild wird generiert…",
  generate_video_from_image: "🎬 Video wird erstellt…",
  generate_product_preview: "🛍️ UGC Produktbild wird erstellt…",
  ugc_video: "🎬 UGC Video — Weiterleitung…",
  produkt_werbung: "🛍️ Produkt-Werbung — Weiterleitung…",
  avatar_video: "🧑‍💻 Mein KI-Ich — Weiterleitung…",
  video_remix: "✂️ Video Remix — Weiterleitung…",
  stimme_musik: "🎙️ Stimme & Musik — Weiterleitung…",
  live_creator: "📡 Live Creator — Weiterleitung…",
};

const REDIRECT_TOOL_INPUT = {
  type: "object" as const,
  properties: {
    headline: {
      type: "string",
      description: "Kurze Überschrift, z.B. Perfekt für dein Ziel.",
    },
    description: {
      type: "string",
      description: "1–2 Sätze warum dieses Tool zum Nutzer passt",
    },
  },
};

export const MASTER_AGENT_TOOLS = [
  {
    name: "analyze_niche" as const,
    description:
      "Analysiert eine YouTube-Nische (POST /api/niche-analyzer). Liefert profitable Nischen-Ideen mit Trends.",
    input_schema: {
      type: "object" as const,
      properties: {
        niche: { type: "string", description: "Thema oder Nische" },
        language: { type: "string", description: "Sprache z.B. de, en" },
      },
      required: ["niche"],
    },
  },
  {
    name: "generate_script" as const,
    description:
      "Generiert ein YouTube Shorts Script (POST /api/script-generator).",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: { type: "string", description: "Video-Thema / Titel" },
        hook: { type: "string", description: "Optionaler Hook" },
        duration: {
          type: "number",
          description: "Ziel-Länge in Sekunden, z.B. 30 oder 60",
        },
        language: { type: "string" },
      },
      required: ["topic"],
    },
  },
  {
    name: "generate_thumbnail" as const,
    description:
      "CTR-optimiertes Thumbnail-Konzept (POST /api/thumbnail-concept).",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Video-Titel" },
        style: { type: "string", description: "Stil z.B. bold, dramatic" },
      },
      required: ["title"],
    },
  },
  {
    name: "viral_score" as const,
    description: "Viral Score 0–100 (POST /api/viral-score).",
    input_schema: {
      type: "object" as const,
      properties: {
        script: { type: "string" },
        thumbnail: { type: "string", description: "Thumbnail-Idee als Text" },
        niche: { type: "string" },
        language: { type: "string" },
      },
      required: ["script", "thumbnail", "niche"],
    },
  },
  {
    name: "detect_outlier" as const,
    description:
      "Findet virale Outlier-Videos in einer Nische (POST /api/outlier-detector).",
    input_schema: {
      type: "object" as const,
      properties: {
        niche: { type: "string" },
        language: { type: "string" },
      },
      required: ["niche"],
    },
  },
  {
    name: "analyze_competitor" as const,
    description:
      "Konkurrenz-Analyse eines YouTube-Kanals (POST /api/competitor-intelligence).",
    input_schema: {
      type: "object" as const,
      properties: {
        channelUrl: {
          type: "string",
          description: "YouTube-Kanal-URL oder @handle",
        },
      },
      required: ["channelUrl"],
    },
  },
  {
    name: "generate_image" as const,
    description:
      "KI-Bild via Flux (POST /api/image-generator). Liefert imageUrl für Video-Schritte.",
    input_schema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Detaillierte Bildbeschreibung" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_video_from_image" as const,
    description:
      "Video aus Bild via Seedance (POST /api/seedance). Nutze imageUrl aus generate_product_preview oder generate_image.",
    input_schema: {
      type: "object" as const,
      properties: {
        imageUrl: { type: "string" },
        motionPrompt: {
          type: "string",
          description: "Bewegung, Kamera, Stimmung",
        },
      },
      required: ["imageUrl", "motionPrompt"],
    },
  },
  {
    name: "generate_product_preview" as const,
    description:
      "Erstellt UGC-Produkt-Preview-Bild (Produkt-Werbung Pipeline, POST /api/product-ad). Nutze bei UGC Creator Flow wenn Produktname und URL/Bild vorhanden.",
    input_schema: {
      type: "object" as const,
      properties: {
        productName: { type: "string", description: "Name des Produkts" },
        productDescription: { type: "string" },
        productUrl: { type: "string", description: "Shop-URL zum Scrapen" },
        imageUrl: { type: "string", description: "Direkte Bild-URL falls vorhanden" },
      },
      required: ["productName"],
    },
  },
  {
    name: "ugc_video" as const,
    description:
      "Weiterleitung zu UGC Video — wenn Upload (Produktbild) nötig ist. UGC, Brand Deal, authentische Ads.",
    input_schema: REDIRECT_TOOL_INPUT,
  },
  {
    name: "produkt_werbung" as const,
    description:
      "Weiterleitung zu Produkt-Werbung — mehrstufiger Upload-Flow für Marken/Produkte.",
    input_schema: REDIRECT_TOOL_INPUT,
  },
  {
    name: "avatar_video" as const,
    description:
      "Weiterleitung zu Mein KI-Ich — braucht Selfie-Upload für Avatar-Videos.",
    input_schema: REDIRECT_TOOL_INPUT,
  },
  {
    name: "video_remix" as const,
    description:
      "Weiterleitung zu Video Remix — braucht Video-Upload.",
    input_schema: REDIRECT_TOOL_INPUT,
  },
  {
    name: "stimme_musik" as const,
    description:
      "Weiterleitung zu Stimme & Musik — Voiceover, Stimmenklone, Musik.",
    input_schema: REDIRECT_TOOL_INPUT,
  },
  {
    name: "live_creator" as const,
    description:
      "Weiterleitung zu Live Creator — Live-Avatar, Face Swap, Premium-Plan.",
    input_schema: REDIRECT_TOOL_INPUT,
  },
];

export const MASTER_AGENT_SYSTEM_PROMPT = `Du bist der InfluexAI Master Agent. Deine Aufgabe ist es, den Nutzer zu verstehen und entweder:
(a) ein ausführbares Tool direkt auszuführen, oder
(b) ein Weiterleitungs-Tool zu nutzen (zeigt Link-Karte im Chat), oder
(c) klärende Fragen zu stellen, wenn das Ziel unklar ist.

AUSFÜHRBARE TOOLS (sofort ausführen, Ergebnis erscheint im Chat):
- analyze_niche — Nischen-Analyse
- generate_script — YouTube Shorts Script
- generate_thumbnail — Thumbnail-Konzept
- viral_score — Viral Score 0–100
- detect_outlier — Outlier-Videos in einer Nische
- analyze_competitor — Konkurrenz-Analyse (channelUrl nötig)
- generate_image — KI-Bild (Flux)
- generate_product_preview — UGC Produkt-Preview (Produkt-Werbung)
- generate_video_from_image — Bild zu Video (Seedance)

WEITERLEITUNGS-TOOLS (Link-Karte, kein Upload im Chat möglich):
- ugc_video — UGC mit Produktbild-Upload
- produkt_werbung — Produkt-Werbung Dashboard
- avatar_video — Mein KI-Ich (Selfie-Upload)
- video_remix — Video-Upload
- stimme_musik — Stimme & Musik
- live_creator — Live-Avatar / Face Swap

GEFÜHRTER FLOW: UGC Creator (Referenz für alle Profile):
1. Erkennung UGC → Frage wörtlich: "Für welches Produkt… Produktbild oder URL?"
2a. Bild/URL → generate_product_preview → Frage: "Soll ich daraus direkt ein UGC-Video erstellen?"
2b. Kein Bild → ugc_video Weiterleitung
3. Ja → generate_video_from_image mit Preview-imageUrl

Nutzer-Profile (weitere Flows folgen demselben Muster):
UGC Creator → geführter UGC-Flow oben
Faceless → avatar_video + generate_thumbnail / generate_image
Content Creator → analyze_niche → generate_script → generate_thumbnail
Brand/Marketing → produkt_werbung + ugc_video
Musik/Podcast → stimme_musik
Konkurrenz → analyze_competitor

Regeln:
- Wenn unklar: MAXIMAL 2 gezielte Fragen. Kein Blabla.
- Ausführbare Tools: DIREKT ausführen — AUSSER im UGC-Flow Phase 2a: erst Preview, dann Video-Frage stellen.
- Einzige erlaubte Bestätigungsfrage: UGC_VIDEO "Soll ich daraus direkt ein UGC-Video erstellen?"
- Weiterleitungs-Tools: Tool aufrufen mit headline + description für die Karte.

Tool-Workflow:
1. Beste Sequenz planen und Tools nacheinander ausführen.
2. Ergebnisse vorheriger Tools für spätere nutzen.
3. Kurz erklären was du tust (1–2 Sätze pro Schritt).

PROFIL-NUTZUNG:
- Nutze Profildaten (Nische, Zielgruppe etc.) NUR, wenn sie für die aktuelle Anfrage direkt relevant sind UND wenn du dich explizit darauf beziehst (z.B. 'Da du laut deinem Profil im Bereich X aktiv bist, ...').
- Bei allgemeinen Fragen (z.B. 'was ist aktuell viral?', 'gib mir Trends') antworte ZUERST allgemein/breit gefächert über mehrere Themenbereiche, bevor du optional auf das Profil eingehst. Unterstelle NIEMALS eine Nische als gegeben, wenn der Nutzer nicht danach gefragt hat oder sie nicht bestätigt wurde.
- Sprich den Nutzer nie mit 'deine Nische ist X' an, als wäre das eine bekannte Tatsache, die der Nutzer dir mitgeteilt hätte, wenn er das nicht in der aktuellen Konversation getan hat.

ANTWORTFORMAT:
- Antworten erscheinen in einem schmalen Panel (ca. 360px breit). Halte Antworten KURZ und PRÄGNANT — maximal 80-120 Wörter für die Hauptantwort, bevor du Rückfragen oder Vorschläge machst.
- Nutze KEINE Markdown-Überschriften (##, ###). Nutze stattdessen kurze fette Einleitungen (**Label:**) gefolgt von normalem Text.
- Nutze einfache Aufzählungen (- Punkt) statt nummerierter Listen mit langen GROSSGESCHRIEBENEN Titeln.
- Bei mehreren Vorschlägen: maximal 3 Punkte, jeweils 1 Zeile.
- Schreibe vollständige, klar getrennte Sätze mit korrekter Zeichensetzung und Leerzeichen nach Satzzeichen.

Antworte in der Sprache des Users.`;
