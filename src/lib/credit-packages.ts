export type CreditPackageId = "small" | "medium" | "large" | "xl";

export type CreditPackage = {
  id: CreditPackageId;
  label: string;
  credits: number;
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

/** Pay-as-you-go credit top-ups */
export const CREDIT_PACKS: CreditPackage[] = [
  buildCreditPackage({
    id: "small",
    label: "Small",
    credits: 50,
    price: "5,00 €",
    priceNumeric: 5.0,
    envKey: "STRIPE_CREDITS_100",
    description: "Für den Einstieg",
    popular: false,
  }),
  buildCreditPackage({
    id: "medium",
    label: "Medium",
    credits: 150,
    price: "12,00 €",
    priceNumeric: 12.0,
    envKey: "STRIPE_CREDITS_300",
    description: "Beliebteste Wahl",
    popular: true,
  }),
  buildCreditPackage({
    id: "large",
    label: "Large",
    credits: 350,
    price: "25,00 €",
    priceNumeric: 25.0,
    envKey: "STRIPE_CREDITS_700",
    description: "Für aktive Creator",
    popular: false,
  }),
  buildCreditPackage({
    id: "xl",
    label: "XL",
    credits: 800,
    price: "45,00 €",
    priceNumeric: 45.0,
    envKey: "STRIPE_CREDITS_1500",
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
  return process.env[pkg.envKey]?.trim() || undefined;
}

/** Smallest pack that covers the credit shortfall (by missing amount). */
export function recommendCreditPackageId(missing: number): CreditPackageId {
  if (missing <= 50) return "small";
  if (missing <= 150) return "medium";
  if (missing <= 350) return "large";
  return "xl";
}

export const CREDIT_CALCULATOR_TIERS = [50, 150, 350, 800] as const;

export const EXTRA_CREDIT_RATE_LABEL = "€0,08 / Credit";
