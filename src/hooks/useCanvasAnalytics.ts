"use client";

import { useCallback, useEffect, useState } from "react";
import type { CanvasAnalyticsSnapshot } from "@/lib/canvas/analytics-types";
import { useCanvasAnalyticsStore } from "@/lib/canvas/canvas-analytics-store";

const EMPTY: CanvasAnalyticsSnapshot = {
  creditBreakdown: { video: 0, image: 0, text: 0, total: 0 },
  postMetrics: {
    views: [0, 0, 0, 0, 0, 0, 0],
    likes: [0, 0, 0, 0, 0, 0, 0],
    shares: [0, 0, 0, 0, 0, 0, 0],
    totals: { views: 0, likes: 0, shares: 0 },
  },
  roi: { creditsPer1000Views: 0, eurPer1000Views: 0, eurPerCredit: 0.17 },
  activity: [],
};

export function useCanvasAnalytics(open: boolean) {
  const mergeSnapshot = useCanvasAnalyticsStore((s) => s.mergeSnapshot);
  const [data, setData] = useState<CanvasAnalyticsSnapshot>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/canvas/analytics", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as
        | CanvasAnalyticsSnapshot
        | { error?: string };

      if (!res.ok) {
        throw new Error("error" in json && json.error ? json.error : "Laden fehlgeschlagen");
      }

      setData(mergeSnapshot(json as CanvasAnalyticsSnapshot));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analytics nicht verfügbar");
      setData(mergeSnapshot(EMPTY));
    } finally {
      setLoading(false);
    }
  }, [mergeSnapshot]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  return { data, loading, error, refresh };
}
