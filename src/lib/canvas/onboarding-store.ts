"use client";

import { create } from "zustand";
import type { ToolId } from "@/lib/canvas/toolApiSchema";
import { useCanvasStore } from "@/lib/canvas/canvas-store";
import type { ControlNodeData } from "@/lib/canvas/canvas-store";
import { ONBOARDING_ACTION_FOLLOWUPS } from "@/lib/canvas/onboarding-copilot";

export type OnboardingMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type OnboardingCanvasAction = "params_changed" | "generate_clicked";

const INACTIVITY_MS = 2 * 60 * 1000;

function msgId() {
  return `ob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function findControlNodeId(toolId: ToolId): string | null {
  const node = useCanvasStore
    .getState()
    .nodes.find(
      (n) => n.data.kind === "control" && (n.data as ControlNodeData).toolId === toolId
    );
  return node?.id ?? null;
}

function ensureControlNode(toolId: ToolId): string {
  const existing = findControlNodeId(toolId);
  if (existing) return existing;
  return useCanvasStore.getState().spawnControlNode(toolId);
}

interface OnboardingState {
  greetingVisible: boolean;
  isInactive: boolean;
  chatOpen: boolean;
  messages: OnboardingMessage[];
  loading: boolean;
  highlightedToolId: ToolId | null;
  highlightedNodeId: string | null;
  completedActions: Set<string>;
  lastActivityAt: number;
  dismissGreeting: () => void;
  touchActivity: () => void;
  evaluateInactivity: () => void;
  openChat: () => void;
  closeChat: () => void;
  pushAssistantMessage: (content: string) => void;
  sendUserMessage: (text: string) => Promise<void>;
  applyHighlight: (toolId: ToolId | null) => void;
  recordCanvasAction: (
    action: OnboardingCanvasAction,
    toolId: ToolId,
    nodeId: string
  ) => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  greetingVisible: true,
  isInactive: false,
  chatOpen: false,
  messages: [],
  loading: false,
  highlightedToolId: null,
  highlightedNodeId: null,
  completedActions: new Set<string>(),
  lastActivityAt: Date.now(),

  dismissGreeting: () => set({ greetingVisible: false }),

  touchActivity: () => {
    set({ lastActivityAt: Date.now(), isInactive: false });
  },

  evaluateInactivity: () => {
    const { lastActivityAt, chatOpen } = get();
    if (chatOpen) return;
    const inactive = Date.now() - lastActivityAt >= INACTIVITY_MS;
    if (inactive !== get().isInactive) {
      set({ isInactive: inactive });
    }
  },

  openChat: () => {
    set({ chatOpen: true, isInactive: false });
    if (get().messages.length === 0) {
      set({
        messages: [
          {
            id: msgId(),
            role: "assistant",
            content:
              "Hi — ich bin dein Live-Co-Pilot. Was möchtest du heute erstellen: Bild oder Video?",
          },
        ],
      });
    }
  },

  closeChat: () => set({ chatOpen: false }),

  pushAssistantMessage: (content) =>
    set((s) => ({
      messages: [...s.messages, { id: msgId(), role: "assistant", content }],
    })),

  applyHighlight: (toolId) => {
    if (!toolId) {
      set({ highlightedToolId: null, highlightedNodeId: null, completedActions: new Set() });
      return;
    }
    const nodeId = ensureControlNode(toolId);
    set({
      highlightedToolId: toolId,
      highlightedNodeId: nodeId,
      completedActions: new Set(),
    });
  },

  sendUserMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().loading) return;

    const userMessage: OnboardingMessage = { id: msgId(), role: "user", content: trimmed };
    const priorMessages = get().messages;
    set((s) => ({
      messages: [...s.messages, userMessage],
      loading: true,
      isInactive: false,
      lastActivityAt: Date.now(),
    }));

    const history = priorMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const toolsOnCanvas = useCanvasStore
      .getState()
      .nodes.filter((n) => n.data.kind === "control")
      .map((n) => (n.data as ControlNodeData).toolId);

    try {
      const res = await fetch("/api/onboarding/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          canvasContext: { toolsOnCanvas },
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        answer?: string;
        highlightTool?: ToolId | null;
        error?: string;
      };

      if (!res.ok || !data.success || !data.answer) {
        get().pushAssistantMessage(
          data.error ?? "Co-Pilot nicht erreichbar. Bitte erneut versuchen."
        );
        return;
      }

      get().pushAssistantMessage(data.answer);
      get().applyHighlight(data.highlightTool ?? null);
    } catch {
      get().pushAssistantMessage("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      set({ loading: false });
    }
  },

  recordCanvasAction: (action, toolId, nodeId) => {
    const { highlightedToolId, highlightedNodeId, completedActions } = get();
    if (!highlightedToolId || toolId !== highlightedToolId) return;
    if (highlightedNodeId && highlightedNodeId !== nodeId) return;

    const actionKey = `${toolId}:${action}`;
    if (completedActions.has(actionKey)) return;

    get().touchActivity();
    const followUp = ONBOARDING_ACTION_FOLLOWUPS[action];
    if (followUp) {
      get().pushAssistantMessage(followUp);
    }

    const nextCompleted = new Set(completedActions);
    nextCompleted.add(actionKey);

    if (action === "generate_clicked") {
      set({
        highlightedToolId: null,
        highlightedNodeId: null,
        completedActions: new Set(),
      });
      return;
    }

    set({ completedActions: nextCompleted });
  },
}));

export const ONBOARDING_INACTIVITY_MS = INACTIVITY_MS;
