export type CreditPackageId =
  | "extra_100"
  | "extra_300"
  | "extra_700"
  | "extra_1500";

export type CreditPackage = {
  id: CreditPackageId;
  label: string;
  priceEur: number;
  priceCents: number;
  credits: number;
  pricePerCredit: number;
  stripePriceEnv: string;
  popular?: boolean;
};

/** Pay-as-you-go credit top-ups */
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "extra_100",
    label: "100 Credits",
    priceEur: 5,
    priceCents: 500,
    credits: 100,
    pricePerCredit: 0.05,
    stripePriceEnv: "STRIPE_CREDITS_100",
  },
  {
    id: "extra_300",
    label: "300 Credits",
    priceEur: 12,
    priceCents: 1200,
    credits: 300,
    pricePerCredit: 0.04,
    stripePriceEnv: "STRIPE_CREDITS_300",
    popular: true,
  },
  {
    id: "extra_700",
    label: "700 Credits",
    priceEur: 25,
    priceCents: 2500,
    credits: 700,
    pricePerCredit: 0.036,
    stripePriceEnv: "STRIPE_CREDITS_700",
  },
  {
    id: "extra_1500",
    label: "1500 Credits",
    priceEur: 45,
    priceCents: 4500,
    credits: 1500,
    pricePerCredit: 0.03,
    stripePriceEnv: "STRIPE_CREDITS_1500",
  },
];

export const DEFAULT_CHECKOUT_PACKAGE: CreditPackageId = "extra_300";

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

export function getStripePriceIdForPackage(pkg: CreditPackage): string | undefined {
  return process.env[pkg.stripePriceEnv]?.trim() || undefined;
}

export const CREDIT_CALCULATOR_TIERS = [100, 300, 700, 1500] as const;

export const EXTRA_CREDIT_RATE_LABEL = "€0.04 / Credit";
