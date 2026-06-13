import { CREDIT_PACKS } from "@/lib/credit-packages";

/** Weighted average €/credit across all top-up packs. */
export function averageEurPerCredit(): number {
  const totalCredits = CREDIT_PACKS.reduce((sum, pack) => sum + pack.credits, 0);
  const totalEur = CREDIT_PACKS.reduce((sum, pack) => sum + pack.priceNumeric, 0);
  if (totalCredits <= 0) return 0.2;
  return totalEur / totalCredits;
}
