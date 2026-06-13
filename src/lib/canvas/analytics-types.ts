import type { SharePlatform } from "./share-platforms";

export type CreditCategory = "video" | "image" | "text";

export type CreditBreakdown = {
  video: number;
  image: number;
  text: number;
  total: number;
};

export type PostMetricSeries = {
  views: number[];
  likes: number[];
  shares: number[];
  totals: {
    views: number;
    likes: number;
    shares: number;
  };
};

export type CanvasActivityItem = {
  id: string;
  toolId: string;
  toolLabel: string;
  toolIcon: string;
  createdAt: string;
  creditsUsed: number;
  status: "generated" | "posted";
  platform?: SharePlatform;
  liveUrl?: string;
};

export type CanvasAnalyticsSnapshot = {
  creditBreakdown: CreditBreakdown;
  postMetrics: PostMetricSeries;
  roi: {
    creditsPer1000Views: number;
    eurPer1000Views: number;
    eurPerCredit: number;
  };
  activity: CanvasActivityItem[];
};
