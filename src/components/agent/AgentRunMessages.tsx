"use client";

import { useEffect, useRef } from "react";
import { AgentMarkdown } from "@/components/agent/AgentMarkdown";
import { AgentTypingIndicator } from "@/components/agent/AgentTypingIndicator";
import { AgentWorkingStatus } from "@/components/agent/AgentWorkingStatus";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPanel,
} from "@/components/dashboard/core/DashboardSurface";
import type { AgentUiMessage } from "@/hooks/useAgentAutopilotChat";

function statusLabel(message: AgentUiMessage): string {
  if (message.activeTool) return "Tool wird gewählt";
  if (message.content) return "Output wird vorbereitet";
  return "Briefing wird analysiert";
}

type Props = {
  messages: AgentUiMessage[];
  running: boolean;
  error: string | null;
  onRetry?: () => void;
};

export function AgentRunMessages({ messages, running, error, onRetry }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, running, error]);

  if (messages.length === 0 && !running && !error) return null;

  return (
    <div ref={scrollRef} className="w-full min-w-0 space-y-4">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <div
              key={m.id}
              className="rounded-xl border px-4 py-3"
              style={{
                borderColor: "rgba(180,255,0,0.28)",
                background: "rgba(180,255,0,0.10)",
              }}
            >
              <p
                className="mb-1 font-mono text-[9px] uppercase tracking-widest"
                style={{ color: DASHBOARD_MUTED }}
              >
                Dein Briefing
              </p>
              <p
                className="whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: DASHBOARD_TEXT }}
              >
                {m.content}
              </p>
            </div>
          );
        }

        return (
          <DashboardPanel key={m.id} title="Agent">
            {m.pending && m.activeTool ? (
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium" style={{ color: DASHBOARD_MUTED }}>
                  {statusLabel(m)}
                </p>
                <AgentWorkingStatus
                  tool={m.activeTool.name}
                  fallbackLabel={m.activeTool.label}
                  variant="light"
                />
              </div>
            ) : null}

            {m.pending && !m.activeTool && !m.content ? (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: DASHBOARD_MUTED }}>
                  Briefing wird analysiert
                </p>
                <AgentTypingIndicator label="Tool wird gewählt…" variant="light" />
              </div>
            ) : null}

            {m.content ? (
              <>
                <AgentMarkdown content={m.content} variant="light" />
                {!m.pending ? (
                  <AiOutputDisclaimer className="mt-3 border-t pt-2" tone="light" />
                ) : null}
              </>
            ) : null}
          </DashboardPanel>
        );
      })}

      {running && messages.length === 0 ? (
        <DashboardPanel title="Status">
          <p className="mb-2 text-xs font-medium" style={{ color: DASHBOARD_MUTED }}>
            Briefing wird analysiert
          </p>
          <AgentTypingIndicator label="Tool wird gewählt…" variant="light" />
        </DashboardPanel>
      ) : null}

      {error ? (
        <DashboardPanel title="Hinweis">
          <p className="mb-4 text-sm leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            Der Vorgang konnte nicht abgeschlossen werden.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
            >
              Erneut versuchen
            </button>
          ) : null}
        </DashboardPanel>
      ) : null}
    </div>
  );
}
