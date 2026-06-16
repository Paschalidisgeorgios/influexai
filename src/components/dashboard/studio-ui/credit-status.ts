/** Unified credit balance display — calm account status, not error UI */

export const LOW_CREDIT_THRESHOLD = 10;

export type CreditBalanceStatus = "healthy" | "low" | "empty";

export function getCreditBalanceStatus(credits: number): CreditBalanceStatus {
  if (credits <= 0) return "empty";
  if (credits < LOW_CREDIT_THRESHOLD) return "low";
  return "healthy";
}

/** Dark shell (sidebar) */
export function getShellCreditStyles(credits: number) {
  const status = getCreditBalanceStatus(credits);
  switch (status) {
    case "empty":
      return {
        text: "rgba(251, 146, 60, 0.92)",
        dot: "#fb923c",
        showDot: true,
      };
    case "low":
      return {
        text: "rgba(255, 255, 255, 0.78)",
        dot: "#f59e0b",
        showDot: true,
      };
    default:
      return {
        text: "rgba(255, 255, 255, 0.68)",
        dot: "#b4ff00",
        showDot: true,
      };
  }
}

/** Ivory stage (dashboard panels, credits page) */
export function getStageCreditStyles(_credits: number) {
  return {
    text: "#080808",
    muted: "rgba(8,8,8,0.58)",
    showAccentDot: getCreditBalanceStatus(_credits) === "healthy",
    warnDot:
      getCreditBalanceStatus(_credits) === "low"
        ? "#f59e0b"
        : getCreditBalanceStatus(_credits) === "empty"
          ? "#fb923c"
          : undefined,
  };
}
