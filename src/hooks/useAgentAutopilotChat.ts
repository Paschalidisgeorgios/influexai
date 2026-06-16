"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentIntent } from "@/lib/agent-types";
import { consumeAgentStream } from "@/lib/agent/consumeAgentStream";
import type {
  AgentChatMessage,
  AgentMetaToolName,
  AgentOutputs,
  AgentToolName,
} from "@/lib/agent/types";
import { openNoCreditsModal } from "@/lib/client-credits-ui";

export type AgentUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: AgentIntent;
  pending?: boolean;
  activeTool?: { name: AgentToolName | AgentMetaToolName; label: string } | null;
  outputs?: AgentOutputs;
};

export function useAgentAutopilotChat(initialPrompt = "") {
  const [messages, setMessages] = useState<AgentUiMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialSent = useRef(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || running) return false;

      setError(null);
      setRunning(true);

      const userMsg: AgentUiMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: AgentUiMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        pending: true,
        activeTool: null,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const history: AgentChatMessage[] = messages
        .filter((m) => !m.pending && m.content)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const patchAssistant = (patch: Partial<AgentUiMessage>) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m))
        );
      };

      let streamFailed = false;

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });

        const contentType = res.headers.get("content-type") ?? "";

        if (!res.ok) {
          const data = contentType.includes("json")
            ? ((await res.json().catch(() => ({}))) as {
                error?: string;
                credits?: number;
                required?: number;
              })
            : {};

          if (res.status === 402) {
            openNoCreditsModal({
              required: data.required ?? 1,
              remaining: data.credits ?? 0,
            });
          }
          setError(data.error ?? "Der Vorgang konnte nicht abgeschlossen werden.");
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return false;
        }

        await consumeAgentStream(res, {
          onTextDelta: (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + chunk }
                  : m
              )
            );
          },
          onInsight: (insight) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: insight.htmlOrMarkdownOutput }
                  : m
              )
            );
            patchAssistant({ activeTool: null });
          },
          onToolStart: (tool, label) => {
            patchAssistant({ activeTool: { name: tool, label } });
          },
          onToolDone: () => {
            patchAssistant({ activeTool: null });
          },
          onToolError: () => {
            patchAssistant({ activeTool: null });
          },
          onOutputs: (outputs) => {
            patchAssistant({ outputs });
          },
          onCredits: () => {
            window.dispatchEvent(new Event("credits-updated"));
          },
          onDone: (summary) => {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                return {
                  ...m,
                  pending: false,
                  activeTool: null,
                  content: m.content.trim() || summary,
                };
              })
            );
          },
          onError: (message) => {
            streamFailed = true;
            setError(message || "Der Vorgang konnte nicht abgeschlossen werden.");
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          },
        });

        if (!streamFailed) {
          patchAssistant({ pending: false, activeTool: null });
        }
        return !streamFailed;
      } catch {
        setError("Der Vorgang konnte nicht abgeschlossen werden.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return false;
      } finally {
        setRunning(false);
      }
    },
    [messages, running]
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) void sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  useEffect(() => {
    if (initialPrompt.trim() && !initialSent.current) {
      initialSent.current = true;
      void sendMessage(initialPrompt);
    }
  }, [initialPrompt, sendMessage]);

  return {
    messages,
    running,
    error,
    sendMessage,
    retryLast,
    clearError: () => setError(null),
    hasSession: messages.length > 0 || running,
  };
}
