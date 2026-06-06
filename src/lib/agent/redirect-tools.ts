import type { AgentRedirectOutput, AgentRedirectToolName } from "./types";

export const AGENT_REDIRECT_TOOL_CONFIG: Record<
  AgentRedirectToolName,
  {
    href: string;
    title: string;
    emoji: string;
    defaultHeadline: string;
    defaultDescription: string;
  }
> = {
  ugc_video: {
    href: "/dashboard/ugc-video",
    title: "UGC Video",
    emoji: "🎬",
    defaultHeadline: "Perfekt für dein Ziel.",
    defaultDescription:
      "Lade dein Produktbild hoch und erstelle authentische UGC-Ads.",
  },
  produkt_werbung: {
    href: "/dashboard/produkt-werbung",
    title: "Produkt-Werbung",
    emoji: "🛍️",
    defaultHeadline: "Ideal für Produkt-Launches.",
    defaultDescription:
      "Mehrstufiger Flow: Produkt-URL, Bilder und Werbespot in einem Schritt.",
  },
  avatar_video: {
    href: "/dashboard/mein-ki-ich",
    title: "Mein KI-Ich",
    emoji: "🧑‍💻",
    defaultHeadline: "Dein persönlicher KI-Avatar.",
    defaultDescription:
      "Lade ein Selfie hoch und erstelle Videos mit deinem KI-Ich.",
  },
  video_remix: {
    href: "/dashboard/video-remix",
    title: "Video Remix",
    emoji: "✂️",
    defaultHeadline: "Remixe bestehende Videos.",
    defaultDescription:
      "Lade ein Video hoch und generiere neue Varianten mit KI.",
  },
  stimme_musik: {
    href: "/dashboard/stimme-musik",
    title: "Stimme & Musik",
    emoji: "🎙️",
    defaultHeadline: "KI-Stimme und Musik für deine Videos.",
    defaultDescription:
      "Voiceover, Stimmenklone und lizenzfreie Musik — direkt im Dashboard.",
  },
  live_creator: {
    href: "/dashboard/live-creator",
    title: "Live Creator",
    emoji: "📡",
    defaultHeadline: "Live-Avatar & Face Swap.",
    defaultDescription:
      "Echtzeit-Avatar und Face Swap — ideal für Premium-Workflows.",
  },
};

export const AGENT_REDIRECT_TOOL_NAMES = Object.keys(
  AGENT_REDIRECT_TOOL_CONFIG
) as AgentRedirectToolName[];

export function isAgentRedirectTool(
  name: string
): name is AgentRedirectToolName {
  return name in AGENT_REDIRECT_TOOL_CONFIG;
}

export function buildAgentRedirect(
  tool: AgentRedirectToolName,
  input: Record<string, unknown>
): AgentRedirectOutput {
  const config = AGENT_REDIRECT_TOOL_CONFIG[tool];
  const headline = String(input.headline ?? config.defaultHeadline).trim();
  const description = String(
    input.description ?? config.defaultDescription
  ).trim();

  return {
    tool,
    title: config.title,
    emoji: config.emoji,
    headline: headline || config.defaultHeadline,
    description: description || config.defaultDescription,
    href: config.href,
  };
}
