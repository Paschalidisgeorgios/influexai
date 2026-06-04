export type AbMetrics = {
  views: number;
  signupClicks: number;
  signups: number;
  clickRate: number;
  conversionRate: number;
};

export type AbResults = {
  a: AbMetrics;
  b: AbMetrics;
};

export function emptyMetrics(): AbMetrics {
  return {
    views: 0,
    signupClicks: 0,
    signups: 0,
    clickRate: 0,
    conversionRate: 0,
  };
}

export function buildAbResults(
  rows: { variant: string; event: string; count: number }[]
): AbResults {
  const result: AbResults = { a: emptyMetrics(), b: emptyMetrics() };

  for (const row of rows) {
    const v = row.variant === "b" ? "b" : "a";
    const m = result[v];
    if (row.event === "view") m.views = row.count;
    if (row.event === "signup_click") m.signupClicks = row.count;
    if (row.event === "signup_complete") m.signups = row.count;
  }

  for (const v of ["a", "b"] as const) {
    const m = result[v];
    m.clickRate = m.views > 0 ? (m.signupClicks / m.views) * 100 : 0;
    m.conversionRate = m.views > 0 ? (m.signups / m.views) * 100 : 0;
  }

  return result;
}

export function rateWinner(aRate: number, bRate: number): "a" | "b" | null {
  const diff = Math.abs(aRate - bRate);
  if (diff <= 5) return null;
  return aRate > bRate ? "a" : "b";
}

export function countWinner(aCount: number, bCount: number): "a" | "b" | null {
  if (aCount === bCount) return null;
  return aCount > bCount ? "a" : "b";
}
