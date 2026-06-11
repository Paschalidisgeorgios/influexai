"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import type { AgentIntent, AgentResponse, ChatMessage } from "@/lib/agent-types";
import {
  formatAgentResponseMarkdown,
  INTENT_BADGE_LABELS,
} from "@/lib/agent/format-agent-markdown";
import { AgentMarkdown } from "@/components/agent/AgentMarkdown";
import { AgentTypingIndicator } from "@/components/agent/AgentTypingIndicator";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { openNoCreditsModal } from "@/lib/client-credits-ui";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: AgentIntent;
  pending?: boolean;
};

type Props = {
  initialPrompt?: string;
};

export function AgentAutopilotChat({ initialPrompt = "" }: Props) {
  const { profile, profileLabel, loading: profileLoading } = useCreatorProfile();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState(initialPrompt);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialSent = useRef(false);

  const growTextarea = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    growTextarea(textareaRef.current);
  }, [input, growTextarea]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, running]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || running) return;

      setError(null);
      setRunning(true);

      const userMsg: UiMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: UiMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        pending: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      requestAnimationFrame(() => growTextarea(textareaRef.current));

      const now = new Date().toISOString();
      const history: ChatMessage[] = [
        ...messages
          .filter((m) => !m.pending && m.content)
          .map((m) => ({
            role: m.role,
            content: m.content,
            createdAt: now,
          })),
        { role: "user", content: trimmed, createdAt: now },
      ];

      try {
        const res = await fetch("/api/ki-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          agentResponse?: AgentResponse;
          error?: string;
          credits?: number;
          required?: number;
        };

        if (!res.ok) {
          if (res.status === 402) {
            openNoCreditsModal({
              required: data.required ?? 1,
              remaining: data.credits ?? 0,
            });
          }
          setError(data.error ?? "Anfrage fehlgeschlagen.");
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setRunning(false);
          return;
        }

        const response = data.agentResponse;
        if (!response) {
          setError("Keine Antwort erhalten.");
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setRunning(false);
          return;
        }

        const markdown = formatAgentResponseMarkdown(response);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: markdown,
                  intent: response.intent,
                  pending: false,
                }
              : m
          )
        );
        window.dispatchEvent(new Event("credits-updated"));
      } catch {
        setError("Netzwerkfehler. Bitte erneut versuchen.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setRunning(false);
      }
    },
    [growTextarea, messages, running]
  );

  useEffect(() => {
    if (initialPrompt.trim() && !initialSent.current) {
      initialSent.current = true;
      void sendMessage(initialPrompt);
    }
  }, [initialPrompt, sendMessage]);

  const handleSubmit = () => void sendMessage(input);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 shrink-0 md:mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-white/20 hover:text-white md:hidden"
            aria-label="Zurück zum Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-display min-w-0 flex-1 text-[clamp(24px,6vw,32px)] leading-none text-white">
            AGENT AUTOPILOT
          </h1>
        </div>
        {!profileLoading && profileLabel ? (
          <span className="mt-2 hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60 md:inline-flex">
            Profil: {profileLabel}
          </span>
        ) : !profileLoading ? (
          <Link
            href="/dashboard/settings"
            className="mt-2 hidden text-xs text-white/40 hover:text-[#B4FF00] md:inline-block"
          >
            Profil einrichten →
          </Link>
        ) : null}
        {!profileLoading && !profile && (
          <p className="mt-2 hidden text-xs text-white/35 md:block">
            Richte dein Creator-Profil ein für personalisierte Ergebnisse →{" "}
            <Link href="/dashboard/settings" className="text-[#B4FF00]/70 hover:text-[#B4FF00]">
              Einstellungen
            </Link>
          </p>
        )}
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4"
      >
        {messages.length === 0 && !running && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B4FF00]/20 bg-[#B4FF00]/10">
              <BrainCircuit className="h-6 w-6 animate-pulse text-[#B4FF00]" />
            </div>
            <p className="text-sm text-white/50">
              Beschreibe was du brauchst — der Agent erledigt den Rest.
            </p>
            <p className="mt-1 text-xs text-white/35">
              Jede Anfrage kostet 1 Credit.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "border border-[#B4FF00]/20 bg-[#B4FF00]/10 text-white"
                  : "border border-white/[0.08] bg-[#0d0d0f] text-white"
              }`}
            >
              {m.role === "assistant" && m.intent && !m.pending && (
                <span className="mb-2 inline-flex rounded-full border border-[#B4FF00]/25 bg-[#B4FF00]/10 px-2 py-0.5 text-[11px] font-semibold text-[#B4FF00]">
                  {INTENT_BADGE_LABELS[m.intent] ?? "Strategie"}
                </span>
              )}
              {m.pending ? (
                <AgentTypingIndicator label="Agent Autopilot denkt..." />
              ) : m.role === "assistant" ? (
                <AgentMarkdown content={m.content} />
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {m.content}
                </p>
              )}
              {m.role === "assistant" && !m.pending && m.content && (
                <AiOutputDisclaimer className="mt-3 border-t border-white/[0.06] pt-2" />
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mb-2 shrink-0 text-xs text-[#ff6b7a]">{error}</p>
      )}

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-white/10 bg-[#060608] pt-4 pb-[env(safe-area-inset-bottom,0px)] md:static md:bg-transparent md:pb-0">
        <div className="rounded-xl border border-white/10 bg-[#0d0d0f] p-3 transition-[border-color,box-shadow] focus-within:border-[#B4FF00] focus-within:shadow-[0_0_0_1px_rgba(180,255,0,0.25),0_0_24px_rgba(180,255,0,0.08)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              growTextarea(e.currentTarget);
            }}
            onInput={(e) => growTextarea(e.currentTarget as HTMLTextAreaElement)}
            onKeyDown={handleKeyDown}
            disabled={running}
            placeholder="Was soll Agent Autopilot für dich erstellen?"
            rows={1}
            className="block w-full resize-none overflow-hidden border-none bg-transparent p-0 text-base text-white outline-none placeholder:text-white/35"
            style={{ minHeight: 24, maxHeight: 160 }}
          />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] text-white/35">1 Credit pro Antwort</span>
            <LoadingButton
              mode="agent"
              isLoading={running}
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="min-h-[48px] w-full rounded-xl bg-[#B4FF00] px-5 py-2.5 text-sm text-[#060608] disabled:opacity-40 sm:w-auto"
            >
              Senden
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
}
