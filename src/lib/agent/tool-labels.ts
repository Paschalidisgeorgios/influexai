import type { AgentToolName } from "./types";

/** Shown in chat while a tool runs (Agent arbeitet…). */
export const AGENT_TOOL_WORKING_LABELS: Record<AgentToolName, string> = {
  analyze_niche: "🔍 Analysiere Nische…",
  generate_script: "📝 Schreibe Script…",
  generate_thumbnail: "🎨 Erstelle Thumbnail-Konzept…",
  viral_score: "📊 Berechne Viral Score…",
  detect_outlier: "🔥 Suche Outlier-Videos…",
  analyze_competitor: "🎯 Analysiere Konkurrenz…",
  generate_image: "🖼 Generiere Bild…",
  generate_video_from_image: "🎬 Erstelle Video…",
  generate_product_preview: "🛍️ Erstelle Produkt-Preview…",
  ugc_video: "🎬 Öffne UGC Video…",
  produkt_werbung: "🛍️ Öffne Produkt-Werbung…",
  avatar_video: "🧑‍💻 Öffne Mein KI-Ich…",
  video_remix: "✂️ Öffne Video Remix…",
  stimme_musik: "🎙️ Öffne Stimme & Musik…",
  live_creator: "📡 Öffne Live Creator…",
};
