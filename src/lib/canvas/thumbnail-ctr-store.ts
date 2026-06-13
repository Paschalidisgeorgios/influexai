"use client";

import { create } from "zustand";
import type { ThumbnailCtrRating } from "@/utils/thumbnailAnalyzer";

export type ThumbnailCtrEntry = ThumbnailCtrRating & {
  compareDelta?: number;
  compareReason?: string;
  isWinner?: boolean;
  analyzing?: boolean;
};

interface ThumbnailCtrState {
  ratings: Record<string, ThumbnailCtrEntry>;
  setAnalyzing: (nodeId: string, analyzing: boolean) => void;
  setRating: (nodeId: string, entry: ThumbnailCtrEntry) => void;
  setCompare: (
    winnerId: string,
    loserId: string,
    deltaPercent: number,
    reason: string
  ) => void;
  clearNode: (nodeId: string) => void;
}

export const useThumbnailCtrStore = create<ThumbnailCtrState>((set, get) => ({
  ratings: {},

  setAnalyzing: (nodeId, analyzing) =>
    set((s) => ({
      ratings: {
        ...s.ratings,
        [nodeId]: { ...s.ratings[nodeId], score: 0, deltaPercent: 0, highlights: [], analyzing },
      },
    })),

  setRating: (nodeId, entry) =>
    set((s) => ({
      ratings: { ...s.ratings, [nodeId]: { ...entry, analyzing: false } },
    })),

  setCompare: (winnerId, loserId, deltaPercent, reason) => {
    const { ratings } = get();
    const winner = ratings[winnerId];
    const loser = ratings[loserId];
    if (!winner || !loser) return;

    set({
      ratings: {
        ...ratings,
        [winnerId]: {
          ...winner,
          compareDelta: deltaPercent,
          compareReason: reason,
          isWinner: true,
        },
        [loserId]: {
          ...loser,
          compareDelta: -deltaPercent,
          compareReason: reason,
          isWinner: false,
        },
      },
    });
  },

  clearNode: (nodeId) =>
    set((s) => {
      const next = { ...s.ratings };
      delete next[nodeId];
      return { ratings: next };
    }),
}));
