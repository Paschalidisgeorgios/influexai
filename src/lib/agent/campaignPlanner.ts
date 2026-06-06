import type {
  BrandDNA,
  CampaignMode,
  CampaignPlatform,
  CampaignTone,
  ContentItem,
} from "./types";

export const CAMPAIGN_SPECS: Record<
  CampaignMode,
  {
    days: number;
    reels: number;
    carousels: number;
    stories: number;
    posts: number;
    ads: number;
    visualBriefings: number;
    estimatedCredits: number;
  }
> = {
  sprint: {
    days: 3,
    reels: 1,
    carousels: 1,
    stories: 1,
    posts: 3,
    ads: 0,
    visualBriefings: 2,
    estimatedCredits: 12,
  },
  weekly: {
    days: 7,
    reels: 3,
    carousels: 2,
    stories: 2,
    posts: 5,
    ads: 1,
    visualBriefings: 3,
    estimatedCredits: 24,
  },
  monthly: {
    days: 30,
    reels: 12,
    carousels: 8,
    stories: 6,
    posts: 20,
    ads: 4,
    visualBriefings: 10,
    estimatedCredits: 80,
  },
  product_launch: {
    days: 14,
    reels: 6,
    carousels: 4,
    stories: 4,
    posts: 10,
    ads: 6,
    visualBriefings: 6,
    estimatedCredits: 48,
  },
};

export function buildCampaignSteps(): string[] {
  return [
    "Briefing verstehen",
    "Brand-DNA laden",
    "Zielgruppe analysieren",
    "Themencluster erstellen",
    "Content-Kalender planen",
    "Hooks generieren",
    "Scripts schreiben",
    "Visual-Konzepte erstellen",
    "Captions und Hashtags ergänzen",
    "Qualität prüfen",
    "Fehlerhafte Outputs verbessern",
    "Content-Paket bereitstellen",
  ];
}

export function inferBrandDNA(prompt: string): {
  dna: Partial<BrandDNA>;
  assumptions: string[];
} {
  const assumptions: string[] = [];
  const p = prompt.toLowerCase();

  let industry = "Allgemein";
  if (/immobil|real estate|eigentu/i.test(p)) industry = "Immobilien";
  else if (/finance|finanz|steuer|invest/i.test(p)) industry = "Finance / SaaS";
  else if (/beauty|kosmetik|skincare/i.test(p)) industry = "Beauty";
  else if (/tech|software|app|saas/i.test(p)) industry = "Tech / SaaS";
  else assumptions.push("Branche nicht erkannt — Allgemein angenommen");

  let tone: CampaignTone = "modern";
  if (/seriös|vertrauens|professional/i.test(p)) tone = "trustworthy";
  else if (/frech|bold|provokat/i.test(p)) tone = "bold";
  else if (/direkt/i.test(p)) tone = "direct";
  else assumptions.push("Ton nicht erkannt — Modern angenommen");

  if (assumptions.length === 0)
    assumptions.push("Alle Annahmen aus Prompt abgeleitet");

  return {
    dna: {
      industry,
      toneOfVoice: tone,
      forbiddenClaims: [],
      forbiddenWords: [],
      requiredDisclaimers: [],
      legalSensitivity: "low",
    },
    assumptions,
  };
}

export function buildMockContentItems(
  mode: CampaignMode,
  platforms: CampaignPlatform[]
): ContentItem[] {
  // TODO: echte KI-Generierung hier anbinden
  const spec = CAMPAIGN_SPECS[mode];
  const items: ContentItem[] = [];
  const platform = platforms[0] ?? "instagram";
  let day = 1;

  for (let i = 0; i < spec.reels; i++) {
    items.push({
      id: `reel-${i}`,
      type: "reel",
      platform,
      day: day++,
      title: `Reel ${i + 1}`,
      hook: "Hook wird generiert...",
      caption: "Caption wird generiert...",
      hashtags: ["#content", "#ai"],
      cta: "Link in Bio",
      status: "generated",
      scores: { overallScore: 88, claimRisk: "low", legalRisk: "low" },
    });
  }
  for (let i = 0; i < spec.posts; i++) {
    items.push({
      id: `post-${i}`,
      type: "post",
      platform,
      day: day++,
      title: `Post ${i + 1}`,
      caption: "Caption wird generiert...",
      hashtags: ["#content"],
      status: "generated",
      scores: { overallScore: 85, claimRisk: "low", legalRisk: "low" },
    });
  }
  return items;
}
