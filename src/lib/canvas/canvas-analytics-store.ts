"use client";

import { create } from "zustand";
import type { SharePlatform } from "./share-platforms";
import type { CanvasActivityItem, CanvasAnalyticsSnapshot } from "./analytics-types";

type LocalEvent = {
  id: string;
  toolId: string;
  toolLabel: string;
  toolIcon: string;
  creditsUsed: number;
  createdAt: string;
  status: "generated" | "posted";
  platform?: SharePlatform;
  liveUrl?: string;
};

interface CanvasAnalyticsStore {
  localEvents: LocalEvent[];
  recordGeneration: (payload: {
    toolId: string;
    toolLabel: string;
    toolIcon: string;
    creditsUsed: number;
    prompt?: string;
  }) => void;
  recordShare: (payload: {
    toolId: string;
    toolLabel: string;
    toolIcon: string;
    platform: SharePlatform;
    liveUrl: string;
    creditsUsed?: number;
  }) => void;
  mergeSnapshot: (snapshot: CanvasAnalyticsSnapshot) => CanvasAnalyticsSnapshot;
}

function toActivity(event: LocalEvent): CanvasActivityItem {
  return {
    id: event.id,
    toolId: event.toolId,
    toolLabel: event.toolLabel,
    toolIcon: event.toolIcon,
    createdAt: event.createdAt,
    creditsUsed: event.creditsUsed,
    status: event.status,
    platform: event.platform,
    liveUrl: event.liveUrl,
  };
}

export const useCanvasAnalyticsStore = create<CanvasAnalyticsStore>((set, get) => ({
  localEvents: [],

  recordGeneration: (payload) => {
    const event: LocalEvent = {
      id: `local-gen-${Date.now()}`,
      toolId: payload.toolId,
      toolLabel: payload.toolLabel,
      toolIcon: payload.toolIcon,
      creditsUsed: payload.creditsUsed,
      createdAt: new Date().toISOString(),
      status: "generated",
    };
    set((state) => ({
      localEvents: [event, ...state.localEvents].slice(0, 40),
    }));
  },

  recordShare: (payload) => {
    const event: LocalEvent = {
      id: `local-share-${Date.now()}`,
      toolId: payload.toolId,
      toolLabel: payload.toolLabel,
      toolIcon: payload.toolIcon,
      creditsUsed: payload.creditsUsed ?? 0,
      createdAt: new Date().toISOString(),
      status: "posted",
      platform: payload.platform,
      liveUrl: payload.liveUrl,
    };
    set((state) => ({
      localEvents: [event, ...state.localEvents].slice(0, 40),
    }));
  },

  mergeSnapshot: (snapshot) => {
    const local = get().localEvents.map(toActivity);
    const seen = new Set(snapshot.activity.map((a) => a.id));
    const mergedActivity = [
      ...local.filter((a) => !seen.has(a.id)),
      ...snapshot.activity,
    ]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 24);

    return {
      ...snapshot,
      activity: mergedActivity,
    };
  },
}));
