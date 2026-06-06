import { AgentTool, AgentIntent } from "./types";

export function detectIntent(prompt: string): AgentIntent {
  const p = prompt.toLowerCase();
  if (/bild|visual|grafik|poster|ad.?bild|thumbnail.?bild/i.test(p))
    return "image_generation";
  if (/video|reel|tiktok|short|\d+.?sek/i.test(p)) return "video_briefing";
  if (/hook|viral|opener|scrollstopper/i.test(p)) return "hook_generation";
  if (/kalender|contentplan|woche|monat|30.?tage|posts.?plan/i.test(p))
    return "content_calendar";
  if (/produkt|werbung|reel.?ad|tiktok.?ad|verkauf/i.test(p))
    return "product_ad";
  if (/script|skript|hook.?story/i.test(p)) return "script_generation";
  if (/avatar|ki.?ich|mein.?gesicht|creator.?avatar/i.test(p))
    return "avatar_workflow";
  if (/thumbnail/i.test(p)) return "thumbnail_concept";
  // Mehrere Dinge → multi_tool
  const signals = [
    /script|skript/i.test(p),
    /kalender|plan/i.test(p),
    /hook|viral/i.test(p),
    /bild|visual/i.test(p),
  ].filter(Boolean).length;
  if (signals >= 2) return "multi_tool_content_package";
  return "unknown";
}

export function routeToTools(intent: AgentIntent): AgentTool[] {
  const map: Record<AgentIntent, AgentTool[]> = {
    image_generation: ["image_generator", "thumbnail_concept"],
    video_briefing: ["script_generator", "produkt_werbung"],
    script_generation: ["script_generator"],
    product_ad: ["produkt_werbung"],
    hook_generation: ["viral_hook_extraktor"],
    content_calendar: ["content_kalender"],
    thumbnail_concept: ["thumbnail_concept"],
    avatar_workflow: ["ki_ich"],
    multi_tool_content_package: [
      "ki_agent",
      "content_kalender",
      "script_generator",
      "viral_hook_extraktor",
    ],
    unknown: ["script_generator"],
  };
  return map[intent];
}

export const STEP_LABELS = [
  "Anfrage verstehen",
  "Ziel erkennen",
  "Nische analysieren",
  "Zielgruppe bestimmen",
  "Tool auswählen",
  "Stilrichtung festlegen",
  "Prompt erstellen",
  "Varianten generieren",
  "Beste Version bewerten",
  "Output optimieren",
  "Exportformat vorbereiten",
  "Ergebnis bereitstellen",
] as const;
