export type FeatureKey =
  | "script-generator"
  | "niche-analyzer"
  | "outlier-detector"
  | "thumbnail-concept"
  | "video-remix"
  | "video-ad"
  | "ki-ich"
  | "stimme";

export type NicheKey = keyof typeof NICHES;

export const FEATURES = {
  "script-generator": {
    name: "Script Generator",
    nameDe: "Script Generator",
    description: "KI-generierte Video-Scripts mit Hook, Story und CTA",
    icon: "FileText",
    cta: "Script generieren",
    route: "/dashboard/script-generator",
    creditCost: 2,
    aliases: ["script generator", "video script", "shorts script"],
  },
  "niche-analyzer": {
    name: "Niche Analyzer",
    nameDe: "Niche Analyzer",
    description: "Profitable YouTube-Nischen mit Wettbewerbs-Score finden",
    icon: "TrendingUp",
    cta: "Niche analysieren",
    route: "/dashboard/niche-analyzer",
    creditCost: 2,
    aliases: ["niche analyzer", "nischen analyse", "nische finden"],
  },
  "outlier-detector": {
    name: "Outlier Detector",
    nameDe: "Outlier Detector",
    description: "Viral-Muster und Outlier-Videos in deiner Nische erkennen",
    icon: "Flame",
    cta: "Outliers finden",
    route: "/dashboard/outlier-detector",
    creditCost: 3,
    aliases: ["outlier detector", "viral videos", "viral muster"],
  },
  "thumbnail-concept": {
    name: "Thumbnail Concept",
    nameDe: "Thumbnail Concept",
    description: "CTR-optimierte Thumbnail-Konzepte mit Layout und Farben",
    icon: "Image",
    cta: "Thumbnail erstellen",
    route: "/dashboard/thumbnail-concept",
    creditCost: 1,
    aliases: ["thumbnail", "thumbnail concept", "ctr thumbnail"],
  },
  "video-remix": {
    name: "Video Remix",
    nameDe: "Video Remix",
    description: "Bestehende Videos in neue virale Formate umwandeln",
    icon: "Clapperboard",
    cta: "Video remixen",
    route: "/dashboard/video-remix",
    creditCost: 3,
    aliases: ["video remix", "content remix"],
  },
  "video-ad": {
    name: "Video Ad",
    nameDe: "Video Ad",
    description: "Werbe-Scripts für TikTok, Reels und Shorts",
    icon: "Megaphone",
    cta: "Werbespot erstellen",
    route: "/dashboard/video-ad",
    creditCost: 5,
    aliases: ["video ad", "werbespot", "produkt werbung"],
  },
  "ki-ich": {
    name: "Mein KI-Ich",
    nameDe: "Mein KI-Ich",
    description: "KI-Avatare und Szenen-Fotos für deinen Kanal",
    icon: "User",
    cta: "KI-Bild erstellen",
    route: "/dashboard/ki-ich",
    creditCost: 2,
    aliases: ["ki-ich", "ki ich", "ai avatar"],
  },
  stimme: {
    name: "Stimme",
    nameDe: "KI Stimme",
    description: "Professionelle Voiceovers für Shorts und Longform",
    icon: "Mic",
    cta: "Stimme generieren",
    route: "/dashboard/stimme",
    creditCost: 2,
    aliases: ["stimme", "voiceover", "ki stimme"],
  },
} as const satisfies Record<
  FeatureKey,
  {
    name: string;
    nameDe: string;
    description: string;
    icon: string;
    cta: string;
    route: string;
    creditCost: number;
    aliases: string[];
  }
>;

export const NICHES = {
  fitness: {
    name: "Fitness",
    nameDe: "Fitness",
    emoji: "💪",
    examples: ["Workout Routine", "Ernährungstipps", "Transformation"],
    topCreators: ["Pamela Reif Style", "Fitnessoskar Style"],
    searchVolume: "high" as const,
  },
  tech: {
    name: "Tech",
    nameDe: "Technologie",
    emoji: "💻",
    examples: ["iPhone Review", "KI Tools", "Coding Tutorial"],
    topCreators: ["MrMobile Style", "MKBHD Style"],
    searchVolume: "high" as const,
  },
  gaming: {
    name: "Gaming",
    nameDe: "Gaming",
    emoji: "🎮",
    examples: ["Game Review", "Speedrun Tips", "Patch Notes"],
    topCreators: ["Gaming Highlight Style", "Esports Recap"],
    searchVolume: "high" as const,
  },
  kochen: {
    name: "Cooking",
    nameDe: "Kochen",
    emoji: "👨‍🍳",
    examples: ["15-Min Rezept", "Meal Prep", "Kitchen Hacks"],
    topCreators: ["Quick Recipe Style", "Chef Tutorial"],
    searchVolume: "high" as const,
  },
  travel: {
    name: "Travel",
    nameDe: "Reisen",
    emoji: "✈️",
    examples: ["City Guide", "Budget Travel", "Hidden Gems"],
    topCreators: ["Travel Vlog Style", "Itinerary Shorts"],
    searchVolume: "high" as const,
  },
  finance: {
    name: "Finance",
    nameDe: "Finanzen",
    emoji: "💰",
    examples: ["ETF erklärt", "Side Hustle", "Sparen Tipps"],
    topCreators: ["Finance Explainer", "Money Mindset"],
    searchVolume: "high" as const,
  },
  beauty: {
    name: "Beauty",
    nameDe: "Beauty",
    emoji: "💄",
    examples: ["GRWM", "Skincare Routine", "Makeup Tutorial"],
    topCreators: ["Beauty GRWM Style", "Dermatology Tips"],
    searchVolume: "high" as const,
  },
  fashion: {
    name: "Fashion",
    nameDe: "Mode",
    emoji: "👗",
    examples: ["Outfit Check", "Thrift Haul", "Trend Report"],
    topCreators: ["Streetwear Lookbook", "Capsule Wardrobe"],
    searchVolume: "medium" as const,
  },
  sport: {
    name: "Sport",
    nameDe: "Sport",
    emoji: "⚽",
    examples: ["Training Drill", "Match Recap", "Athlete Story"],
    topCreators: ["Sports Analysis", "Highlight Reel"],
    searchVolume: "medium" as const,
  },
  musik: {
    name: "Music",
    nameDe: "Musik",
    emoji: "🎵",
    examples: ["Beat Breakdown", "Cover Short", "Music Theory Bite"],
    topCreators: ["Producer Tips", "Artist Reaction"],
    searchVolume: "medium" as const,
  },
  comedy: {
    name: "Comedy",
    nameDe: "Comedy",
    emoji: "😂",
    examples: ["Sketch", "POV Comedy", "Relatable Bit"],
    topCreators: ["Sketch Comedy", "POV Creator"],
    searchVolume: "high" as const,
  },
  education: {
    name: "Education",
    nameDe: "Bildung",
    emoji: "📚",
    examples: ["Explain in 60s", "Study Hack", "Exam Tips"],
    topCreators: ["Edu Shorts", "Tutor Style"],
    searchVolume: "high" as const,
  },
  business: {
    name: "Business",
    nameDe: "Business",
    emoji: "📈",
    examples: ["Startup Lesson", "Sales Tip", "Leadership Bite"],
    topCreators: ["Founder Story", "B2B Tips"],
    searchVolume: "medium" as const,
  },
  lifestyle: {
    name: "Lifestyle",
    nameDe: "Lifestyle",
    emoji: "✨",
    examples: ["Morning Routine", "Productivity", "Day in Life"],
    topCreators: ["Aesthetic Vlog", "Minimal Living"],
    searchVolume: "high" as const,
  },
  food: {
    name: "Food",
    nameDe: "Food",
    emoji: "🍔",
    examples: ["Restaurant Review", "Street Food", "Taste Test"],
    topCreators: ["Food Review Short", "Mukbang Clip"],
    searchVolume: "medium" as const,
  },
  automotive: {
    name: "Automotive",
    nameDe: "Auto",
    emoji: "🚗",
    examples: ["Car Review", "EV Vergleich", "Detailing Tip"],
    topCreators: ["Car POV", "Garage Build"],
    searchVolume: "medium" as const,
  },
  pets: {
    name: "Pets",
    nameDe: "Haustiere",
    emoji: "🐾",
    examples: ["Pet Training", "Funny Pet Clip", "Care Guide"],
    topCreators: ["Pet Comedy", "Trainer Tips"],
    searchVolume: "medium" as const,
  },
  parenting: {
    name: "Parenting",
    nameDe: "Eltern",
    emoji: "👶",
    examples: ["Parenting Hack", "Toddler Tip", "Family Vlog"],
    topCreators: ["Mom/Dad Tips", "Family Shorts"],
    searchVolume: "medium" as const,
  },
  health: {
    name: "Health",
    nameDe: "Gesundheit",
    emoji: "🏥",
    examples: ["Wellness Tip", "Sleep Hack", "Habit Science"],
    topCreators: ["Health Explainer", "Doctor Style"],
    searchVolume: "medium" as const,
  },
  meditation: {
    name: "Meditation",
    nameDe: "Meditation",
    emoji: "🧘",
    examples: ["Breathwork", "Mindfulness", "Stress Relief"],
    topCreators: ["Calm Guide", "Guided Short"],
    searchVolume: "low" as const,
  },
  yoga: {
    name: "Yoga",
    nameDe: "Yoga",
    emoji: "🧘‍♀️",
    examples: ["Flow Sequence", "Pose Fix", "Flexibility"],
    topCreators: ["Yoga Instructor", "Morning Flow"],
    searchVolume: "medium" as const,
  },
  coding: {
    name: "Coding",
    nameDe: "Programmieren",
    emoji: "⌨️",
    examples: ["Code in 60s", "Dev Tool", "Bug Fix Tip"],
    topCreators: ["Dev Tips", "Tutorial Short"],
    searchVolume: "high" as const,
  },
  marketing: {
    name: "Marketing",
    nameDe: "Marketing",
    emoji: "📣",
    examples: ["Growth Hack", "Ad Creative", "Funnel Tip"],
    topCreators: ["Marketer Tips", "Case Study"],
    searchVolume: "medium" as const,
  },
  crypto: {
    name: "Crypto",
    nameDe: "Krypto",
    emoji: "₿",
    examples: ["Market Update", "Coin Explained", "Risk Warning"],
    topCreators: ["Crypto News", "On-chain Bite"],
    searchVolume: "medium" as const,
  },
  "real-estate": {
    name: "Real Estate",
    nameDe: "Immobilien",
    emoji: "🏠",
    examples: ["Market Tip", "House Tour", "Investment Bite"],
    topCreators: ["Realtor Shorts", "Flip Story"],
    searchVolume: "medium" as const,
  },
  photography: {
    name: "Photography",
    nameDe: "Fotografie",
    emoji: "📷",
    examples: ["Camera Settings", "Edit Trick", "Composition"],
    topCreators: ["Photo Tips", "Before/After Edit"],
    searchVolume: "low" as const,
  },
  art: {
    name: "Art",
    nameDe: "Kunst",
    emoji: "🎨",
    examples: ["Speed Paint", "Art Challenge", "Tool Review"],
    topCreators: ["Process Video", "Digital Art"],
    searchVolume: "medium" as const,
  },
  dance: {
    name: "Dance",
    nameDe: "Tanz",
    emoji: "💃",
    examples: ["Choreo Tutorial", "Trend Dance", "Technique Tip"],
    topCreators: ["Dance Cover", "Studio Short"],
    searchVolume: "medium" as const,
  },
  "language-learning": {
    name: "Language Learning",
    nameDe: "Sprachen lernen",
    emoji: "🗣️",
    examples: ["Phrase a Day", "Grammar Hack", "Pronunciation"],
    topCreators: ["Language Coach", "Vocab Short"],
    searchVolume: "medium" as const,
  },
  "book-review": {
    name: "Book Review",
    nameDe: "Buchrezensionen",
    emoji: "📖",
    examples: ["Book in 60s", "Reading List", "Key Takeaway"],
    topCreators: ["BookTok Style", "Summary Short"],
    searchVolume: "low" as const,
  },
  "movie-review": {
    name: "Movie Review",
    nameDe: "Filmkritik",
    emoji: "🎬",
    examples: ["Review ohne Spoiler", "Ending Explained", "Ranking"],
    topCreators: ["Cinema Short", "Hot Take"],
    searchVolume: "medium" as const,
  },
  science: {
    name: "Science",
    nameDe: "Wissenschaft",
    emoji: "🔬",
    examples: ["Experiment", "Fact Bite", "Myth Bust"],
    topCreators: ["Science Explainer", "Lab Short"],
    searchVolume: "medium" as const,
  },
  history: {
    name: "History",
    nameDe: "Geschichte",
    emoji: "🏛️",
    examples: ["Event in 60s", "Figure Profile", "Timeline"],
    topCreators: ["History Short", "Documentary Bite"],
    searchVolume: "low" as const,
  },
  politics: {
    name: "Politics",
    nameDe: "Politik",
    emoji: "🗳️",
    examples: ["Policy Explained", "News Context", "Debate Clip"],
    topCreators: ["Neutral Explainer", "Analysis Short"],
    searchVolume: "low" as const,
  },
  environment: {
    name: "Environment",
    nameDe: "Umwelt",
    emoji: "🌍",
    examples: ["Climate Fact", "Eco Tip", "Sustainability"],
    topCreators: ["Green Living", "Impact Story"],
    searchVolume: "low" as const,
  },
  diy: {
    name: "DIY",
    nameDe: "DIY",
    emoji: "🔧",
    examples: ["Build Project", "Repair Hack", "Tool Tip"],
    topCreators: ["Maker Short", "Workshop Clip"],
    searchVolume: "medium" as const,
  },
  "home-decor": {
    name: "Home Decor",
    nameDe: "Einrichtung",
    emoji: "🛋️",
    examples: ["Room Makeover", "Budget Decor", "Organization"],
    topCreators: ["Interior Short", "Before/After Room"],
    searchVolume: "medium" as const,
  },
  gardening: {
    name: "Gardening",
    nameDe: "Garten",
    emoji: "🌱",
    examples: ["Plant Care", "Harvest Tip", "Garden Tour"],
    topCreators: ["Urban Garden", "Seasonal Tips"],
    searchVolume: "low" as const,
  },
  fishing: {
    name: "Fishing",
    nameDe: "Angeln",
    emoji: "🎣",
    examples: ["Catch Story", "Gear Tip", "Spot Guide"],
    topCreators: ["Fishing Vlog", "Technique Short"],
    searchVolume: "low" as const,
  },
  hunting: {
    name: "Hunting",
    nameDe: "Jagd",
    emoji: "🏹",
    examples: ["Gear Review", "Safety Tip", "Field Story"],
    topCreators: ["Outdoor Channel", "Ethics Explainer"],
    searchVolume: "low" as const,
  },
  cycling: {
    name: "Cycling",
    nameDe: "Radfahren",
    emoji: "🚴",
    examples: ["Route Tip", "Maintenance", "Race Recap"],
    topCreators: ["Cycling Vlog", "Bike Setup"],
    searchVolume: "low" as const,
  },
  running: {
    name: "Running",
    nameDe: "Laufen",
    emoji: "🏃",
    examples: ["Training Plan", "Race Prep", "Form Fix"],
    topCreators: ["Runner Tips", "Marathon Story"],
    searchVolume: "medium" as const,
  },
  swimming: {
    name: "Swimming",
    nameDe: "Schwimmen",
    emoji: "🏊",
    examples: ["Technique Drill", "Workout Set", "Open Water"],
    topCreators: ["Swim Coach", "Pool Tips"],
    searchVolume: "low" as const,
  },
  boxing: {
    name: "Boxing",
    nameDe: "Boxen",
    emoji: "🥊",
    examples: ["Combo Tutorial", "Training Drill", "Fight Breakdown"],
    topCreators: ["Boxing Coach", "Highlight Edit"],
    searchVolume: "medium" as const,
  },
  football: {
    name: "Football",
    nameDe: "Fußball",
    emoji: "⚽",
    examples: ["Skill Drill", "Tactics Bite", "Match Moment"],
    topCreators: ["Skills Channel", "Analysis Short"],
    searchVolume: "high" as const,
  },
  basketball: {
    name: "Basketball",
    nameDe: "Basketball",
    emoji: "🏀",
    examples: ["Move Tutorial", "Highlights", "Training"],
    topCreators: ["Hoops Tips", "Game Breakdown"],
    searchVolume: "medium" as const,
  },
  tennis: {
    name: "Tennis",
    nameDe: "Tennis",
    emoji: "🎾",
    examples: ["Stroke Tip", "Match Point", "Gear Review"],
    topCreators: ["Tennis Coach", "Pro Analysis"],
    searchVolume: "low" as const,
  },
  golf: {
    name: "Golf",
    nameDe: "Golf",
    emoji: "⛳",
    examples: ["Swing Fix", "Course Vlog", "Club Review"],
    topCreators: ["Golf Tips", "Course Strategy"],
    searchVolume: "low" as const,
  },
  esports: {
    name: "Esports",
    nameDe: "Esports",
    emoji: "🏆",
    examples: ["Meta Update", "Pro Play", "Team News"],
    topCreators: ["Esports News", "Highlight Pack"],
    searchVolume: "high" as const,
  },
  anime: {
    name: "Anime",
    nameDe: "Anime",
    emoji: "🎌",
    examples: ["Episode Recap", "Theory", "Ranking"],
    topCreators: ["Anime Explainer", "Hot Take"],
    searchVolume: "high" as const,
  },
  manga: {
    name: "Manga",
    nameDe: "Manga",
    emoji: "📕",
    examples: ["Chapter Recap", "Recommend List", "Panel Breakdown"],
    topCreators: ["Manga Review", "Reader Guide"],
    searchVolume: "medium" as const,
  },
} as const;

/** Top niches for tools index matrix */
export const TOP_NICHES: NicheKey[] = [
  "fitness",
  "tech",
  "gaming",
  "kochen",
  "beauty",
  "finance",
  "lifestyle",
  "education",
  "comedy",
  "travel",
];

export function isFeatureKey(value: string): value is FeatureKey {
  return value in FEATURES;
}

export function isNicheKey(value: string): value is NicheKey {
  return value in NICHES;
}

export function getAllProgrammaticPaths(): { feature: FeatureKey; niche: NicheKey }[] {
  const paths: { feature: FeatureKey; niche: NicheKey }[] = [];
  for (const feature of Object.keys(FEATURES) as FeatureKey[]) {
    for (const niche of Object.keys(NICHES) as NicheKey[]) {
      paths.push({ feature, niche });
    }
  }
  return paths;
}

export type PageMetadata = {
  title: string;
  description: string;
  h1: string;
  heroText: string;
  keywords: string;
};

export function generatePageMetadata(
  feature: string,
  niche: string
): PageMetadata | null {
  if (!isFeatureKey(feature) || !isNicheKey(niche)) return null;

  const f = FEATURES[feature];
  const n = NICHES[niche];

  return {
    title: `${f.nameDe} für ${n.nameDe} Creator | InfluexAI`,
    description: `Erstelle ${n.nameDe} Content mit dem KI ${f.nameDe}. ${n.examples.slice(0, 2).join(", ")} und mehr. Credits ab €4,99 — sofort loslegen.`,
    h1: `${f.nameDe} für ${n.nameDe} YouTube Creator`,
    heroText: `Erstelle ${n.emoji} ${n.nameDe} Content 10× schneller mit KI`,
    keywords: `${f.nameDe.toLowerCase()} ${n.nameDe.toLowerCase()}, youtube shorts ${n.name}, ki content tools ${n.name}`,
  };
}

export function toolPagePath(feature: FeatureKey, niche: NicheKey): string {
  return `/tools/${feature}/${niche}`;
}

export function getRelatedFeatures(
  current: FeatureKey,
  niche: NicheKey,
  count = 3
): { feature: FeatureKey; href: string; label: string }[] {
  return (Object.keys(FEATURES) as FeatureKey[])
    .filter((f) => f !== current)
    .slice(0, count)
    .map((feature) => ({
      feature,
      href: toolPagePath(feature, niche),
      label: FEATURES[feature].nameDe,
    }));
}

export function getBenefitsForCombo(
  feature: FeatureKey,
  niche: NicheKey
): string[] {
  const f = FEATURES[feature];
  const n = NICHES[niche];
  return [
    `${f.nameDe} spart ${n.nameDe}-Creatorn Stunden Recherche und Schreibarbeit pro Woche`,
    `Optimiert für YouTube Shorts, Reels und TikTok im ${n.nameDe}-Bereich`,
    `Konkrete Vorlagen für ${n.examples[0]} und ${n.examples[1]}`,
    `Nur ${f.creditCost} Credits pro Generierung — transparent und fair`,
    `Inspiriert von erfolgreichen ${n.nameDe}-Formaten (${n.topCreators.join(", ")})`,
  ];
}

const NICHE_LOOKUP: { key: NicheKey; terms: string[] }[] = (
  Object.entries(NICHES) as [NicheKey, (typeof NICHES)[NicheKey]][]
).map(([key, n]) => ({
  key,
  terms: [
    key,
    key.replace(/-/g, " "),
    n.name.toLowerCase(),
    n.nameDe.toLowerCase(),
  ],
}));

export function resolveNicheSlug(text: string): NicheKey | null {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  if (isNicheKey(normalized)) return normalized;

  for (const { key, terms } of NICHE_LOOKUP) {
    for (const term of terms) {
      if (normalized === term || normalized.includes(term)) {
        return key;
      }
    }
  }

  return null;
}

export function blogCategoryToFeature(category: string): FeatureKey | null {
  const map: Record<string, FeatureKey> = {
    "Niche-Analyse": "niche-analyzer",
    "Script Writing": "script-generator",
    Thumbnail: "thumbnail-concept",
    "Viral Tactics": "outlier-detector",
    "KI Tools": "script-generator",
    "YouTube Algorithm": "outlier-detector",
    "Case Studies": "niche-analyzer",
  };
  return map[category] ?? null;
}

export function resolveFeatureKey(text: string): FeatureKey | null {
  const lower = text.toLowerCase();
  for (const [key, f] of Object.entries(FEATURES) as [
    FeatureKey,
    (typeof FEATURES)[FeatureKey],
  ][]) {
    if (
      lower.includes(key) ||
      lower.includes(f.nameDe.toLowerCase()) ||
      lower.includes(f.name.toLowerCase()) ||
      f.aliases.some((a) => lower.includes(a))
    ) {
      return key;
    }
  }
  return null;
}

export function findNicheInText(text: string): NicheKey | null {
  const lower = text.toLowerCase();
  let best: { key: NicheKey; len: number } | null = null;

  for (const { key, terms } of NICHE_LOOKUP) {
    for (const term of terms) {
      if (term.length < 3) continue;
      if (lower.includes(term)) {
        if (!best || term.length > best.len) {
          best = { key, len: term.length };
        }
      }
    }
  }

  return best?.key ?? null;
}
