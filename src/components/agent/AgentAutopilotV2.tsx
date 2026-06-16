"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ImageIcon,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  AGENT_TOOLS,
  type AgentToolKey,
} from "@/lib/tools/agent-tool-registry";
import { AgentRunMessages } from "./AgentRunMessages";
import { capsuleShow } from "./SmartCapsule";
import { LoadingButton } from "@/components/ui/LoadingButton";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile, loading: profileLoading } = useCreatorProfile();
  const { messages, running, error, sendMessage, retryLast } =
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

      <section className="space-y-5 md:space-y-6">
        <div className="relative">
          {showRotatingPlaceholder ? (
            <p
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-0 max-w-full pr-2 text-lg leading-relaxed transition-opacity duration-300 md:text-xl"
              style={{
                color: "rgba(8,8,8,0.32)",
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
            placeholder={showRotatingPlaceholder ? "" : T.placeholder}
            disabled={running}
            rows={4}
            aria-label="Briefing eingeben"
            className={`relative z-[1] max-h-[280px] min-h-[148px] w-full resize-none border-0 border-b bg-transparent px-0 py-1 font-sans text-lg leading-relaxed outline-none transition-[border-color] duration-200 focus:border-[#B4FF00]/35 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-[172px] md:text-xl md:leading-relaxed`}
            style={{
              borderBottom: "1px solid rgba(8,8,8,0.12)",
              color: DASHBOARD_TEXT,
              caretColor: DASHBOARD_TEXT,
            }}
          />
          <p className="mt-3 text-[11px]" style={{ color: DASHBOARD_MUTED }}>
            Enter zum Senden · Shift+Enter für neue Zeile
          </p>
        </div>

        <div className="space-y-2.5">
          <LoadingButton
            mode="agent"
            isLoading={running}
            onClick={() => void handleGenerate()}
            disabled={!prompt.trim()}
            className={`h-12 w-full text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-40 sm:h-[3.25rem] sm:max-w-xs ${STUDIO_RADIUS.button}`}
            style={{ background: "#B4FF00", color: "#08080a" }}
          >
            {running ? "Vorschlag wird erstellt…" : "Vorschlag erstellen"}
          </LoadingButton>
          <p className="text-[11px]" style={{ color: DASHBOARD_MUTED }}>
            {T.creditsCost} Credit{T.creditsCost === 1 ? "" : "s"} · Ergebnis als Vorschlag, nicht
            als Generierung
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
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
      </section>

      <AgentRunMessages
        messages={messages}
        running={running}
        error={error}
        onRetry={retryLast}
      />

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
