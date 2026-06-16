"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { AgentRunMessages } from "@/components/agent/AgentRunMessages";
import { LoadingButton } from "@/components/ui/LoadingButton";
import {
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPageHeader,
  DashboardPanel,
} from "@/components/dashboard/core/DashboardSurface";
import { useAgentAutopilotChat } from "@/hooks/useAgentAutopilotChat";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";

type Props = {
  initialPrompt?: string;
};

export function AgentAutopilotChat({ initialPrompt = "" }: Props) {
  const { profileLabel, loading: profileLoading } = useCreatorProfile();
  const { messages, running, error, sendMessage, retryLast } =
    useAgentAutopilotChat(initialPrompt);
  const [input, setInput] = useState(initialPrompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const growTextarea = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    growTextarea(textareaRef.current);
  }, [input, growTextarea]);

  const handleSubmit = () => {
    void sendMessage(input).then((ok) => {
      if (ok) {
        setInput("");
        requestAnimationFrame(() => growTextarea(textareaRef.current));
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
      <DashboardPageHeader
        kicker="Command Center"
        title="Agent"
        subtitle="Briefing wird analysiert, Tool wird gewählt, Output vorbereitet."
      />

      {!profileLoading && profileLabel ? (
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px]"
          style={{
            borderColor: "rgba(8,8,8,0.10)",
            background: "rgba(255,255,255,0.45)",
            color: "rgba(8,8,8,0.55)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#B4FF00] opacity-80" />
          Profil: {profileLabel}
        </div>
      ) : !profileLoading ? (
        <p className="text-xs" style={{ color: DASHBOARD_MUTED }}>
          Richte dein Creator-Profil ein für personalisierte Ergebnisse →{" "}
          <Link href="/dashboard/settings" className="font-medium underline" style={{ color: DASHBOARD_TEXT }}>
            Einstellungen
          </Link>
        </p>
      ) : null}

      <DashboardPanel>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            growTextarea(e.currentTarget);
          }}
          onKeyDown={handleKeyDown}
          disabled={running}
          placeholder="Beschreibe was du brauchst — der Agent erledigt den Rest."
          rows={4}
          className="max-h-[260px] min-h-[120px] w-full resize-none rounded-2xl border px-4 py-4 font-sans text-[15px] leading-relaxed outline-none transition-all duration-300 placeholder:text-black/35 focus:border-[#B4FF00]/40 focus:shadow-[0_0_0_4px_rgba(180,255,0,0.10)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "#FFFCF7",
            borderColor: "rgba(8,8,8,0.14)",
            color: DASHBOARD_TEXT,
          }}
        />
        <p className="mt-2 pl-1 text-[10px] tracking-wide" style={{ color: DASHBOARD_MUTED }}>
          Enter zum Senden · Shift+Enter für neue Zeile
        </p>
        <LoadingButton
          mode="agent"
          isLoading={running}
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="mt-4 h-[3.25rem] w-full rounded-xl bg-[#B4FF00] text-sm font-bold tracking-wide text-[#08080a] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_6px_32px_rgba(180,255,0,0.32)] active:scale-[0.99] disabled:opacity-40"
        >
          ERSTELLEN — Produktionspfad starten
        </LoadingButton>
      </DashboardPanel>

      <AgentRunMessages
        messages={messages}
        running={running}
        error={error}
        onRetry={retryLast}
      />

      <Link
        href="/dashboard/ki-agent"
        className="inline-flex text-sm no-underline"
        style={{ color: DASHBOARD_MUTED }}
      >
        ← Zurück zum Agent
      </Link>
    </div>
  );
}
