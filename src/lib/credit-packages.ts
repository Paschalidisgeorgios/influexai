export type CreditPackageId = "small" | "medium" | "large" | "xl";

export type CreditPackage = {
  id: CreditPackageId;
  label: string;
  /** Total credits granted after purchase (incl. bonus). */
  credits: number;
  /** Bonus credits included on top of the base rate (0 for Small). */
  bonusCredits: number;
  /** Optional highlight ribbon on canvas / pricing cards. */
  highlightBadge?: string;
  price: string;
  priceNumeric: number;
  envKey: string;
  description: string;
  popular: boolean;
  /** @deprecated use priceNumeric */
  priceEur: number;
  priceCents: number;
  pricePerCredit: number;
  /** @deprecated use envKey */
  stripePriceEnv: string;
};

function buildCreditPackage(
  pack: Omit<
    CreditPackage,
    "priceEur" | "priceCents" | "pricePerCredit" | "stripePriceEnv"
  >
): CreditPackage {
  return {
    ...pack,
    priceEur: pack.priceNumeric,
    priceCents: Math.round(pack.priceNumeric * 100),
    pricePerCredit: pack.priceNumeric / pack.credits,
    stripePriceEnv: pack.envKey,
  };
}

/** One-time credit top-ups for users with an active plan */
export const CREDIT_PACKS: CreditPackage[] = [
  buildCreditPackage({
    id: "small",
    label: "Small",
    credits: 25,
    bonusCredits: 0,
    price: "5,00 €",
    priceNumeric: 5.0,
    envKey: "STRIPE_CREDITS_50",
    description: "Für den Einstieg",
    popular: false,
  }),
  buildCreditPackage({
    id: "medium",
    label: "Medium",
    credits: 70,
    bonusCredits: 10,
    price: "12,00 €",
    priceNumeric: 12.0,
    envKey: "STRIPE_CREDITS_150",
    description: "Mehr Output pro Euro",
    popular: false,
  }),
  buildCreditPackage({
    id: "large",
    label: "Large",
    credits: 160,
    bonusCredits: 35,
    highlightBadge: "BESTE WAHL",
    price: "25,00 €",
    priceNumeric: 25.0,
    envKey: "STRIPE_CREDITS_350",
    description: "Für aktive Creator",
    popular: true,
  }),
  buildCreditPackage({
    id: "xl",
    label: "XL",
    credits: 320,
    bonusCredits: 90,
    highlightBadge: "MAXIMALER WERT",
    price: "45,00 €",
    priceNumeric: 45.0,
    envKey: "STRIPE_CREDITS_800",
    description: "Maximum Power",
    popular: false,
  }),
];

export const CREDIT_PACKAGES = CREDIT_PACKS;

export const DEFAULT_CHECKOUT_PACKAGE: CreditPackageId = "medium";

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

export function getStripePriceIdForPackage(
  pkg: CreditPackage
): string | undefined {
  const value = process.env[pkg.envKey]?.trim();
  return value || undefined;
}

export function formatBonusLabel(bonusCredits: number): string | null {
  if (bonusCredits <= 0) return null;
  return `Inkl. ${bonusCredits} Bonus-Credits`;
}

/** Smallest pack that covers the credit shortfall (by missing amount). */
export function recommendCreditPackageId(missing: number): CreditPackageId {
  if (missing <= 25) return "small";
  if (missing <= 70) return "medium";
  if (missing <= 160) return "large";
  return "xl";
}

export const CREDIT_CALCULATOR_TIERS = [25, 70, 160, 320] as const;

export const EXTRA_CREDIT_RATE_LABEL = "€0,20 / Credit";
