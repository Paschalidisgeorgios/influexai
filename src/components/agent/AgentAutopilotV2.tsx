"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Calendar,
  ImageIcon,
  Loader2,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  AGENT_TOOLS,
  type AgentToolKey,
} from "@/lib/tools/agent-tool-registry";
import { AgentRunMessages } from "./AgentRunMessages";
import { capsuleShow } from "./SmartCapsule";
import { useAgentAutopilotChat } from "@/hooks/useAgentAutopilotChat";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { createClient } from "@/lib/supabase/client";
import {
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
} from "@/components/dashboard/core/DashboardSurface";
import {
  STUDIO_CARD_BG_SOFT,
  STUDIO_CARD_BORDER,
  STUDIO_MUTED,
  STUDIO_RADIUS,
  STUDIO_TEXT,
} from "@/components/dashboard/studio-ui/tokens";

const TOOL_TAB_LABELS: Record<AgentToolKey, string> = {
  agent: "Autopilot",
  campaign: "Kampagne",
};

const AGENT_PLACEHOLDER_EXAMPLES = [
  "Erstelle 10 virale Hooks für mein Fitness-Business auf TikTok",
  "Plane 7 Tage Content für ein Restaurant",
  "Schreibe ein Trend-Script für ein Beauty-Produkt",
  "Generiere Produktbilder für ein Parfum im Premium-Look",
  "Mach aus diesem Produktfoto ein kurzes Werbevideo",
  "Hilf mir bei einer Kampagne für meine Marke",
] as const;

const CAMPAIGN_PLACEHOLDER_EXAMPLES = [
  "14-Tage Instagram-Kampagne für Fitness-App Launch",
  "7 TikTok Launch Posts für eine neue Beauty-Marke",
  "30-Tage Multi-Platform Content-Kampagne für ein Restaurant",
] as const;

const QUICK_TOOLS = [
  {
    icon: Zap,
    label: "Viral Hook",
    desc: "Einstiege schreiben",
    href: "/dashboard?tool=viral-hook",
  },
  {
    icon: Calendar,
    label: "Content Kalender",
    desc: "Monat planen",
    href: "/dashboard?tool=content-calendar",
  },
  {
    icon: TrendingUp,
    label: "Trend Script",
    desc: "Trend → Script",
    href: "/dashboard?tool=trend-script",
  },
  {
    icon: ImageIcon,
    label: "Bildgenerator",
    desc: "Motive erstellen",
    href: "/dashboard?tool=image-gen",
  },
] as const;

const GREETING_FALLBACK = {
  title: "Willkommen zurück",
  sub: "Was möchtest du vorbereiten?",
};

type GreetingState = { title: string; sub: string };

function getTimeGreeting(hour: number): { title: string; sub: string } {
  if (hour >= 5 && hour < 12) {
    return { title: "Guten Morgen", sub: "Was kreieren wir heute?" };
  }
  if (hour >= 12 && hour < 18) {
    return { title: "Guten Tag", sub: "Was möchtest du heute vorbereiten?" };
  }
  return { title: "Guten Abend", sub: "Was erstellen wir jetzt?" };
}

function useRotatingPlaceholder(examples: readonly string[], active: boolean) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % examples.length);
        setVisible(true);
      }, 280);
    }, 4800);
    return () => window.clearInterval(interval);
  }, [active, examples]);

  return { text: examples[index] ?? examples[0], visible };
}

function useAgentGreeting() {
  const [greeting, setGreeting] = useState<GreetingState>(GREETING_FALLBACK);

  useEffect(() => {
    const hour = new Date().getHours();
    const base = getTimeGreeting(hour);

    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setGreeting(base);
          return;
        }
        const metaName = user.user_metadata?.full_name as string | undefined;
        const first =
          metaName?.trim().split(/\s+/)[0] || user.email?.split("@")[0]?.trim();
        if (first && first.length >= 2) {
          setGreeting({ title: `${base.title}, ${first}`, sub: base.sub });
          return;
        }
        setGreeting(base);
      } catch {
        setGreeting(base);
      }
    })();
  }, []);

  return greeting;
}

export function AgentAutopilotV2({ initialPrompt = "" }: { initialPrompt?: string } = {}) {
  const [activeTool, setActiveTool] = useState<AgentToolKey>("agent");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { profile, loading: profileLoading } = useCreatorProfile();
  const { messages, running, error, sendMessage, retryLast, hasSession } =
    useAgentAutopilotChat(initialPrompt);
  const greeting = useAgentGreeting();

  const T = AGENT_TOOLS[activeTool];
  const placeholderExamples =
    activeTool === "campaign" ? CAMPAIGN_PLACEHOLDER_EXAMPLES : AGENT_PLACEHOLDER_EXAMPLES;
  const showRotatingPlaceholder = !prompt.trim() && !running;
  const { text: rotatingPlaceholder, visible: placeholderVisible } =
    useRotatingPlaceholder(placeholderExamples, showRotatingPlaceholder);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      capsuleShow("Bitte zuerst ein Briefing eingeben.", 4000);
      textareaRef.current?.focus();
      return;
    }
    capsuleShow("Agent bereitet einen Vorschlag vor…", 3000);
    const ok = await sendMessage(prompt.trim());
    if (ok) {
      setPrompt("");
      setSelectedChip(null);
      requestAnimationFrame(handleInput);
    }
  }, [prompt, sendMessage, handleInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleGenerate();
    }
  };

  const selectChip = (idx: number) => {
    setSelectedChip(idx);
    setPrompt(T.chips[idx].prompt);
    textareaRef.current?.focus();
    requestAnimationFrame(handleInput);
  };

  const switchTool = (tool: AgentToolKey) => {
    setActiveTool(tool);
    setPrompt("");
    setSelectedChip(null);
    capsuleShow(
      tool === "agent"
        ? "Autopilot bereit — Briefing eingeben."
        : "Kampagnenmodus — Briefing für mehrere Kanäle.",
      4000
    );
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setSelectedChip(null);
    requestAnimationFrame(handleInput);
  };

  const showResults = messages.length > 0 || running || Boolean(error);
  const canSubmit = Boolean(prompt.trim()) && !running;

  useEffect(() => {
    if (!showResults) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [showResults, messages.length, running, error]);

  const chipButtons = (
    <div className="flex flex-wrap gap-2">
      {T.chips.map((chip, i) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => selectChip(i)}
          className={`border px-3.5 py-2 text-[12px] font-medium transition-all duration-200 ${STUDIO_RADIUS.button} ${
            selectedChip === i
              ? "border-[#B4FF00]/35 bg-[#B4FF00]/10 text-[#080808]"
              : "border-black/[0.08] bg-transparent text-black/55 hover:border-black/14 hover:bg-black/[0.02] hover:text-black/80"
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-8 md:space-y-10 md:pb-10">
      <div className="flex flex-wrap gap-2">
        {(["agent", "campaign"] as AgentToolKey[]).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => switchTool(tool)}
            className={`border px-4 py-2 text-sm font-medium transition-all duration-200 ${STUDIO_RADIUS.button} ${
              activeTool === tool
                ? "border-[#B4FF00]/40 bg-[#B4FF00]/12 text-[#080808]"
                : "border-black/[0.08] bg-transparent text-black/50 hover:border-black/14 hover:text-black/75"
            }`}
          >
            {TOOL_TAB_LABELS[tool]}
          </button>
        ))}
      </div>

      <header className="space-y-3 pt-1 md:pt-2">
        <div className="space-y-2">
          <h1
            className="font-display text-[1.75rem] font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-[2.65rem]"
            style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.03em" }}
          >
            {greeting.title}
          </h1>
          <p
            className="max-w-xl text-base leading-relaxed md:text-[17px]"
            style={{ color: DASHBOARD_MUTED }}
          >
            {activeTool === "campaign" ? T.sub : greeting.sub}
          </p>
        </div>

        {!profileLoading && !profile && (
          <p className="text-xs" style={{ color: STUDIO_MUTED }}>
            Creator-Profil für personalisierte Vorschläge in{" "}
            <Link
              href="/dashboard/settings"
              className="font-medium underline underline-offset-2 hover:opacity-80"
              style={{ color: STUDIO_TEXT }}
            >
              Einstellungen
            </Link>{" "}
            hinterlegen.
          </p>
        )}

        {profile ? (
          <div
            className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[11px] ${STUDIO_RADIUS.pill}`}
            style={{
              borderColor: STUDIO_CARD_BORDER,
              background: STUDIO_CARD_BG_SOFT,
              color: STUDIO_MUTED,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#B4FF00] opacity-70" aria-hidden />
            {profile.nische} · {profile.plattformen?.[0]} · {profile.tonalitaet}
          </div>
        ) : null}
      </header>

      <section className="space-y-4 md:space-y-5">
        <div
          className={`relative overflow-hidden rounded-[24px] border transition-all duration-300 ${
            running
              ? "animate-pulse border-[#B4FF00] shadow-[0_0_0_2px_rgba(180,255,0,0.18),0_0_28px_rgba(180,255,0,0.12)] ring-2 ring-[#B4FF00]/25"
              : inputFocused
                ? "border-[#B4FF00] shadow-[0_0_0_4px_rgba(180,255,0,0.1)]"
                : "border-[#b4ff00]/45 shadow-[0_1px_2px_rgba(8,8,8,0.04)]"
          }`}
          style={{ background: "rgba(255,250,242,0.55)" }}
        >
          {showRotatingPlaceholder ? (
            <p
              aria-hidden
              className="pointer-events-none absolute left-5 top-5 z-0 max-w-[calc(100%-5.5rem)] pr-2 text-base leading-relaxed transition-opacity duration-300 md:text-lg"
              style={{
                color: "rgba(8,8,8,0.34)",
                opacity: placeholderVisible ? 1 : 0,
              }}
            >
              {rotatingPlaceholder}
            </p>
          ) : null}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={showRotatingPlaceholder ? "" : T.placeholder}
            disabled={running}
            rows={4}
            aria-label="Briefing eingeben"
            className="relative z-[1] max-h-[280px] min-h-[148px] w-full resize-none border-0 bg-transparent px-5 pb-16 pt-5 pr-16 font-sans text-base leading-relaxed outline-none disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[168px] md:text-lg md:leading-relaxed"
            style={{
              color: DASHBOARD_TEXT,
              caretColor: DASHBOARD_TEXT,
            }}
          />
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!canSubmit}
            aria-label={running ? "Vorschlag wird erstellt" : "Vorschlag senden"}
            className={`absolute bottom-3 right-3 z-[2] inline-flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 ${STUDIO_RADIUS.button}`}
            style={{
              background: canSubmit ? "#B4FF00" : "rgba(8,8,8,0.08)",
              color: canSubmit ? "#08080a" : "rgba(8,8,8,0.35)",
              boxShadow: canSubmit ? "0 2px 10px rgba(180,255,0,0.28)" : "none",
            }}
          >
            {running ? (
              <Loader2 size={18} className="animate-spin" aria-hidden />
            ) : (
              <ArrowUp size={18} strokeWidth={2.25} aria-hidden />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <p className="text-[11px]" style={{ color: DASHBOARD_MUTED }}>
            Enter zum Senden · Shift+Enter für neue Zeile
          </p>
          {running ? (
            <p className="text-[11px] font-medium" style={{ color: STUDIO_TEXT }}>
              Vorschlag wird erstellt…
            </p>
          ) : null}
        </div>

        <p className="px-0.5 text-[11px]" style={{ color: DASHBOARD_MUTED }}>
          {T.creditsCost} Credit{T.creditsCost === 1 ? "" : "s"} · Ergebnis als Vorschlag, nicht
          als Generierung
        </p>

        {!hasSession ? chipButtons : null}

        {showResults ? (
          <div ref={resultsRef} className="scroll-mt-24 pt-1 md:scroll-mt-28">
            <AgentRunMessages
              messages={messages}
              running={running}
              error={error}
              onRetry={retryLast}
            />
          </div>
        ) : null}

        {hasSession ? chipButtons : null}
      </section>

      <section className="pt-2 md:pt-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/[0.05]" />
          <span className="text-[11px] font-medium tracking-wide" style={{ color: "rgba(8,8,8,0.38)" }}>
            Direkt in Tools
          </span>
          <div className="h-px flex-1 bg-black/[0.05]" />
        </div>
        <p className="mb-3 text-center text-[11px] md:text-left" style={{ color: DASHBOARD_MUTED }}>
          Oder starte ohne Agent — Tools sind jederzeit direkt erreichbar.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {QUICK_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group border p-3.5 transition-colors duration-200 hover:border-black/12 ${STUDIO_RADIUS.card}`}
                style={{
                  borderColor: "rgba(8,8,8,0.07)",
                  background: "rgba(255,255,255,0.28)",
                }}
              >
                <div
                  className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "rgba(8,8,8,0.04)", color: DASHBOARD_TEXT }}
                >
                  <Icon size={14} strokeWidth={1.75} />
                </div>
                <div className="mb-0.5 text-[11px] font-semibold tracking-tight" style={{ color: STUDIO_TEXT }}>
                  {tool.label}
                </div>
                <div className="text-[10px] leading-snug" style={{ color: STUDIO_MUTED }}>
                  {tool.desc}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
