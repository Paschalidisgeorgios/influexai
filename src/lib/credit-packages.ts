export type CreditPackageId =
  | "credits_starter"
  | "credits_creator"
  | "credits_pro";

export type CreditPackage = {
  id: CreditPackageId;
  plan: "starter" | "creator" | "pro";
  label: string;
  priceEur: number;
  priceCents: number;
  credits: number;
  equivalence: string;
  savingsBadge?: string;
  bestFor: string;
  popular?: boolean;
  features: string[];
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "credits_starter",
    plan: "starter",
    label: "Starter",
    priceEur: 4.99,
    priceCents: 499,
    credits: 50,
    equivalence: "= 25 Scripts oder 16 Niche-Analysen",
    bestFor: "Gelegentliche Creator",
    features: [
      "Script Generator",
      "Niche Analyzer",
      "Outlier Detector",
      "Thumbnail Konzept",
    ],
  },
  {
    id: "credits_creator",
    plan: "creator",
    label: "Creator",
    priceEur: 9.99,
    priceCents: 999,
    credits: 120,
    equivalence: "= 60 Scripts oder 40 Niche-Analysen",
    savingsBadge: "Du sparst €2 vs. Starter",
    bestFor: "Aktive Creator",
    popular: true,
    features: [
      "Alle Starter-Flows",
      "Video Remix",
      "Produkt-Werbung",
      "Priority-Generierung",
    ],
  },
  {
    id: "credits_pro",
    plan: "pro",
    label: "Pro",
    priceEur: 19.99,
    priceCents: 1999,
    credits: 300,
    equivalence: "= 150 Scripts oder 100 Niche-Analysen",
    savingsBadge: "Du sparst €10 vs. Starter",
    bestFor: "Daily Creator",
    features: [
      "Alle Creator-Flows",
      "KI-Ich & Voice",
      "Live Creator",
      "Maximale Produktion",
    ],
  },
];

export const DEFAULT_CHECKOUT_PACKAGE: CreditPackageId = "credits_creator";

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

export const CREDIT_CALCULATOR_TIERS = [50, 120, 300] as const;
