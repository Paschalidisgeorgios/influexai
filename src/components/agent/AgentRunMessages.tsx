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
} from "@/components/dashboard/core/DashboardSurface";
import { STUDIO_RADIUS, StudioPanel } from "@/components/dashboard/studio-ui";
import type { AgentUiMessage } from "@/hooks/useAgentAutopilotChat";

function statusLabel(message: AgentUiMessage): string {
  if (message.activeTool) return "Modell und Tool werden gewählt";
  if (message.content) return "Output wird vorbereitet";
  return "Briefing wird ausgewertet";
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
    <div ref={scrollRef} className="w-full min-w-0 space-y-5">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <div
              key={m.id}
              className={`px-5 py-4 ${STUDIO_RADIUS.panel}`}
              style={{
                border: "1px solid rgba(180,255,0,0.22)",
                background: "rgba(180,255,0,0.08)",
              }}
            >
              <p
                className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: DASHBOARD_MUTED }}
              >
                Dein Briefing
              </p>
              <p
                className="whitespace-pre-wrap text-[15px] leading-relaxed"
                style={{ color: DASHBOARD_TEXT }}
              >
                {m.content}
              </p>
            </div>
          );
        }

        return (
          <StudioPanel key={m.id} title="Agent">
            {m.pending && m.activeTool ? (
              <div className="mb-4 space-y-2">
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
                  Briefing wird ausgewertet
                </p>
                <AgentTypingIndicator label="Tool wird vorbereitet…" variant="light" />
              </div>
            ) : null}

            {m.content ? (
              <>
                <AgentMarkdown content={m.content} variant="light" />
                {!m.pending ? (
                  <AiOutputDisclaimer className="mt-4 border-t border-black/[0.06] pt-3" tone="light" />
                ) : null}
              </>
            ) : null}
          </StudioPanel>
        );
      })}

      {running && messages.length === 0 ? (
        <StudioPanel title="Status">
          <p className="mb-2 text-xs font-medium" style={{ color: DASHBOARD_MUTED }}>
            Briefing wird ausgewertet
          </p>
          <AgentTypingIndicator label="Tool wird vorbereitet…" variant="light" />
        </StudioPanel>
      ) : null}

      {error ? (
        <StudioPanel title="Hinweis">
          <p className="mb-5 text-sm leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
            Der Vorgang konnte nicht abgeschlossen werden. Bitte versuche es erneut.
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={`inline-flex min-h-[48px] items-center justify-center px-7 text-sm font-bold transition-opacity hover:opacity-90 ${STUDIO_RADIUS.button}`}
              style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
            >
              Erneut versuchen
            </button>
          ) : null}
        </StudioPanel>
      ) : null}
    </div>
  );
}
