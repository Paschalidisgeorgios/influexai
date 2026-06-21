export type CreditPackageId = "micro" | "small" | "medium" | "large";

export type CreditPackage = {
  id: CreditPackageId;
  label: string;
  /** Total credits granted after purchase (incl. bonus). */
  credits: number;
  /** Bonus credits included on top of the base rate (0 for backup packs). */
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

/** Active one-time credit pack Stripe price env keys (pricing UI source of truth). */
export const STRIPE_CREDITS_25_ENV = "STRIPE_CREDITS_25";
export const STRIPE_CREDITS_70_ENV = "STRIPE_CREDITS_70";
export const STRIPE_CREDITS_160_ENV = "STRIPE_CREDITS_160";
export const STRIPE_CREDITS_320_ENV = "STRIPE_CREDITS_320";

export const ACTIVE_CREDIT_PACK_ENV_KEYS = [
  STRIPE_CREDITS_25_ENV,
  STRIPE_CREDITS_70_ENV,
  STRIPE_CREDITS_160_ENV,
  STRIPE_CREDITS_320_ENV,
] as const;

/** One-time credit top-ups for users with an active plan */
export const CREDIT_PACKS: CreditPackage[] = [
  buildCreditPackage({
    id: "micro",
    label: "Micro",
    credits: 25,
    bonusCredits: 0,
    price: "5,00 €",
    priceNumeric: 5.0,
    envKey: STRIPE_CREDITS_25_ENV,
    description: "Für den Einstieg",
    popular: false,
  }),
  buildCreditPackage({
    id: "small",
    label: "Small",
    credits: 70,
    bonusCredits: 0,
    price: "12,00 €",
    priceNumeric: 12.0,
    envKey: STRIPE_CREDITS_70_ENV,
    description: "Kompakter Top-up",
    popular: false,
  }),
  buildCreditPackage({
    id: "medium",
    label: "Medium",
    credits: 160,
    bonusCredits: 0,
    price: "25,00 €",
    priceNumeric: 25.0,
    envKey: STRIPE_CREDITS_160_ENV,
    description: "Mehr Output pro Euro",
    popular: false,
  }),
  buildCreditPackage({
    id: "large",
    label: "Large",
    credits: 320,
    bonusCredits: 0,
    highlightBadge: "BESTE WAHL",
    price: "45,00 €",
    priceNumeric: 45.0,
    envKey: STRIPE_CREDITS_320_ENV,
    description: "Für aktive Creator",
    popular: true,
  }),
];

export const CREDIT_PACKAGES = CREDIT_PACKS;

export const DEFAULT_CHECKOUT_PACKAGE: CreditPackageId = "medium";

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

/** Stripe price env keys for a pack (one active key per tier). */
export function getStripePriceEnvKeysForPackage(
  pkg: CreditPackage
): readonly string[] {
  return [pkg.envKey];
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
  if (missing <= 25) return "micro";
  if (missing <= 70) return "small";
  if (missing <= 160) return "medium";
  return "large";
}

export const CREDIT_CALCULATOR_TIERS = [25, 70, 160, 320] as const;

export const EXTRA_CREDIT_RATE_LABEL = "€0,20 / Credit";
