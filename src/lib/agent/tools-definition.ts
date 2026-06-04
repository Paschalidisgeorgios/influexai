import type { AgentToolName } from "./types";

export const AGENT_TOOL_STEP_LABELS: Record<AgentToolName, string> = {
  analyze_niche: "🔍 Analysiere Nische…",
  find_outliers: "🔥 Suche Outlier-Videos…",
  generate_script: "✍️ Generiere Script…",
  create_thumbnail_concept: "🎨 Erstelle Thumbnail-Konzept…",
  calculate_viral_score: "📊 Berechne Viral Score…",
  suggest_video_ideas: "💡 Generiere Video-Ideen…",
};

export const MASTER_AGENT_TOOLS = [
  {
    name: "analyze_niche" as const,
    description:
      "Analysiert eine YouTube-Nische und liefert profitable Nischen-Ideen mit Trends.",
    input_schema: {
      type: "object" as const,
      properties: {
        niche: { type: "string", description: "Thema oder Nische" },
        language: {
          type: "string",
          description: "Sprache z.B. de, en",
        },
      },
      required: ["niche"],
    },
  },
  {
    name: "generate_script" as const,
    description:
      "Generiert ein vollständiges YouTube Shorts Script mit Hook, Story und CTA.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: { type: "string", description: "Video-Thema / Titel" },
        hook: {
          type: "string",
          description: "Optionaler Hook oder Angle",
        },
        duration: {
          type: "number",
          description: "Ziel-Länge in Sekunden, z.B. 30 oder 60",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "create_thumbnail_concept" as const,
    description:
      "Erstellt ein CTR-optimiertes Thumbnail-Konzept mit Text, Farben und Layout.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Video-Titel" },
        style: {
          type: "string",
          description: "Stil z.B. bold, minimal, dramatic",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "calculate_viral_score" as const,
    description:
      "Berechnet Viral Score 0–100 für Script, Thumbnail-Idee und Nische.",
    input_schema: {
      type: "object" as const,
      properties: {
        script: { type: "string" },
        thumbnail: { type: "string", description: "Thumbnail-Idee als Text" },
        niche: { type: "string" },
      },
      required: ["script", "thumbnail", "niche"],
    },
  },
  {
    name: "find_outliers" as const,
    description:
      "Findet viral gegangene Outlier-Videos in einer Nische mit Analyse warum sie funktionieren.",
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
    name: "suggest_video_ideas" as const,
    description:
      "Generiert konkrete Video-Ideen mit Hooks basierend auf Trends in einer Nische.",
    input_schema: {
      type: "object" as const,
      properties: {
        niche: { type: "string" },
        count: { type: "number", description: "Anzahl Ideen, default 3" },
      },
      required: ["niche"],
    },
  },
];

export const MASTER_AGENT_SYSTEM_PROMPT = `Du bist der InfluexAI Master Agent — ein persönlicher YouTube-Stratege. Du hilfst Content Creatorn dabei virale YouTube Shorts zu erstellen.

Du hast Zugriff auf Tools für: Nischen-Analyse, Script-Generierung, Thumbnail-Konzepte, Viral Score, Outlier-Detection und Video-Ideen.

Wenn ein User ein Ziel nennt:
1. Plane die beste Tool-Sequenz (z.B. Nische → Outliers → Script → Thumbnail → Viral Score).
2. Führe Tools Schritt für Schritt aus und nutze Ergebnisse früherer Tools für spätere (z.B. Hook aus Outlier-Analyse im Script).
3. Erkläre kurz auf Deutsch was du gerade tust (1–2 Sätze pro Schritt).
4. Fasse am Ende alles strukturiert zusammen.

Antworte in der Sprache des Users (Deutsch wenn der User Deutsch schreibt).
Nutze Tools proaktiv — nicht nur beschreiben was möglich wäre.
Bei Video-Projekten: führe mindestens Nischen-Analyse, Script und Thumbnail aus wenn sinnvoll.`;
