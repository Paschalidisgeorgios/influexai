export type AgentToolKey = "agent" | "campaign";

export type AgentToolDef = {
  title: string;
  sub: string;
  placeholder: string;
  creditsCost: number;
  chips: { label: string; prompt: string }[];
  capabilities: string[];
  buildPayload: (prompt: string, creatorDNA?: object) => Record<string, unknown>;
};

export const AGENT_TOOLS: Record<AgentToolKey, AgentToolDef> = {
  agent: {
    title: "AGENT AUTOPILOT",
    sub: "Beschreibe was du brauchst — der Agent erledigt den Rest.",
    placeholder:
      "z.B. Erstelle 10 virale Hooks für mein Fitness-Business auf TikTok",
    creditsCost: 1,
    chips: [
      {
        label: "10 virale Hooks · TikTok",
        prompt: "Erstelle 10 virale Hooks für mein Fitness-Business auf TikTok",
      },
      {
        label: "7-Tage Content · Restaurant",
        prompt: "Plane 7 Tage Content für ein lokales Restaurant",
      },
      {
        label: "Produktwerbung · Parfüm",
        prompt: "Erstelle eine Produktwerbung für ein Parfüm",
      },
    ],
    capabilities: [
      "text-generation",
      "hook-creation",
      "calendar",
      "script",
      "strategy",
    ],
    buildPayload: (prompt: string, creatorDNA?: object) => ({
      agent: "autopilot-v2",
      task: prompt.length > 3 ? "content-generation" : "idle",
      prompt,
      credits_cost: 1,
      creator_dna: creatorDNA || null,
      locale: "de-DE",
    }),
  },
  campaign: {
    title: "AUTOPILOT KAMPAGNE",
    sub: "Starte eine vollautomatische Multi-Channel-Kampagne.",
    placeholder: "z.B. 14-Tage Instagram-Kampagne für Fitness-App Launch",
    creditsCost: 3,
    chips: [
      {
        label: "Instagram · 14 Tage",
        prompt: "14-Tage Instagram Kampagne für Fitness-App Launch",
      },
      {
        label: "TikTok Launch · 7 Posts",
        prompt: "7 TikTok Launch Posts für neue App",
      },
      {
        label: "Multi-Platform · 30 Tage",
        prompt: "30-Tage Multi-Platform Content-Kampagne",
      },
    ],
    capabilities: [
      "campaign-planning",
      "multi-platform",
      "scheduling",
      "budget-tracking",
    ],
    buildPayload: (prompt: string, creatorDNA?: object) => ({
      agent: "campaign-autopilot-v1",
      task: "campaign-planning",
      prompt,
      credits_cost: 3,
      duration_days: 14,
      platforms: ["instagram", "tiktok"],
      creator_dna: creatorDNA || null,
      locale: "de-DE",
    }),
  },
};
