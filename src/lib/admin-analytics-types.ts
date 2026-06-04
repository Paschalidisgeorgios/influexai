export type RevenueRange = "30d" | "90d" | "12m";

export type AdminKpis = {
  mrrCents: number;
  mrrChangePct: number;
  totalRevenueCents: number;
  activeUsers7d: number;
  totalUsers: number;
  newUsersThisWeek: number;
  arpuCents: number;
  churnRatePct: number;
};

export type RevenuePoint = { date: string; label: string; revenueEur: number };

export type GrowthPoint = {
  date: string;
  label: string;
  signups: number;
  cumulative: number;
};

export type FeatureUsageRow = {
  type: string;
  label: string;
  count: number;
  pct: number;
};

export type TopUserRow = {
  id: string;
  email: string;
  generations: number;
  creditsSpent: number;
  memberSince: string;
};

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
  pct: number;
};

export type CohortRow = {
  weekLabel: string;
  signupCount: number;
  retention: (number | null)[];
};

export type LiveEvent = {
  id: string;
  at: string;
  type: "signup" | "generation" | "purchase" | "referral" | "churn";
  userLabel: string;
  detail: string;
};

export type AdminAnalyticsPayload = {
  kpis: AdminKpis;
  revenue: RevenuePoint[];
  growth: GrowthPoint[];
  featureUsage: FeatureUsageRow[];
  topUsers: TopUserRow[];
  funnel: FunnelStep[];
  cohorts: CohortRow[];
  landingNote: string;
};
