"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  AGENT_TOOLS,
  type AgentToolKey,
} from "@/lib/tools/agent-tool-registry";
import { AgentRunMessages } from "./AgentRunMessages";
import { capsuleShow } from "./SmartCapsule";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useAgentAutopilotChat } from "@/hooks/useAgentAutopilotChat";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import {
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPanel,
} from "@/components/dashboard/core/DashboardSurface";

const QUICK_TOOLS = [
  {
    icon: "⚡",
    label: "Viral Hook Generator",
    desc: "Hook aus Thema",
    href: "/dashboard?tool=viral-hook",
    color: "rgba(180,255,0,0.08)",
  },
  {
    icon: "📅",
    label: "Content Kalender",
    desc: "Plan mit Hooks",
    href: "/dashboard?tool=content-calendar",
    color: "rgba(40,160,255,0.08)",
  },
  {
    icon: "📈",
    label: "Trend Script",
    desc: "Trend → Script",
    href: "/dashboard?tool=trend-script",
    color: "rgba(160,64,255,0.08)",
  },
  {
    icon: "🖼",
    label: "Bild Generator",
    desc: "Prompt und Format",
    href: "/dashboard?tool=image-gen",
    color: "rgba(224,169,81,0.08)",
  },
] as const;

export function AgentAutopilotV2({ initialPrompt = "" }: { initialPrompt?: string } = {}) {
  const [activeTool, setActiveTool] = useState<AgentToolKey>("agent");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile, loading: profileLoading } = useCreatorProfile();
  const { messages, running, error, sendMessage, retryLast } =
    useAgentAutopilotChat(initialPrompt);

  const T = AGENT_TOOLS[activeTool];

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      capsuleShow("Sag mir zuerst was du brauchst! Schreib etwas in die Box. 👇", 4000);
      textareaRef.current?.focus();
      return;
    }
    capsuleShow("Agent berechnet deine Anfrage…", 3000);
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
        ? "Agent Autopilot aktiviert. Capabilities geladen. ⚡"
        : "Autopilot Kampagne bereit. Multi-Channel Modus. 🚀",
      4000
    );
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setSelectedChip(null);
    requestAnimationFrame(handleInput);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 md:space-y-7">
      <div className="flex flex-wrap gap-2">
        {(["agent", "campaign"] as AgentToolKey[]).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => switchTool(tool)}
            className={`rounded-full border px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
              activeTool === tool
                ? "border-[#B4FF00]/40 bg-[#B4FF00]/14 text-[#080808]"
                : "border-black/[0.10] bg-[#FFFCF7] text-black/55 hover:border-black/18 hover:text-black/80"
            }`}
          >
            {AGENT_TOOLS[tool].title}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: DASHBOARD_MUTED }}>
          Agent
        </p>
        <h1
          className="font-display mb-2 text-3xl leading-none font-extrabold tracking-tight md:text-[2.75rem]"
          style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.03em" }}
        >
          Idee eingeben
        </h1>
        <p className="max-w-2xl font-sans text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          {activeTool === "campaign"
            ? "Kampagne planen — Briefing eingeben."
            : "Der Agent hilft beim Briefing. Du behältst Kontrolle über Tool, Modell und Output."}
        </p>
      </div>

      {!profileLoading && !profile && (
        <p className="text-xs" style={{ color: "rgba(8,8,8,0.45)" }}>
          Richte dein Creator-Profil ein für personalisierte Ergebnisse →{" "}
          <Link href="/dashboard/settings" className="font-medium text-[#080808] underline hover:opacity-80">
            Einstellungen
          </Link>
        </p>
      )}

      {profile && (
        <div
          className="inline-flex cursor-default items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] transition-all"
          style={{
            borderColor: "rgba(8,8,8,0.10)",
            background: "rgba(255,255,255,0.45)",
            color: "rgba(8,8,8,0.55)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#B4FF00] opacity-80" />
          Profil: {profile.nische} · {profile.plattformen?.[0]} · {profile.tonalitaet}
        </div>
      )}

      <DashboardPanel>
        <div className="flex flex-wrap gap-2 pb-4">
          {T.chips.map((chip, i) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => selectChip(i)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-medium transition-all duration-200 ${
                selectedChip === i
                  ? "border-[#B4FF00]/40 bg-[#B4FF00]/14 text-[#080808]"
                  : "border-black/[0.10] bg-[#FFFCF7] text-black/50 hover:border-[#B4FF00]/28 hover:text-black/75"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={T.placeholder}
            disabled={running}
            rows={5}
            className="max-h-[260px] min-h-[140px] w-full resize-none rounded-2xl border px-4 py-4 font-sans text-[15px] leading-relaxed outline-none transition-all duration-300 placeholder:text-black/35 focus:border-[#B4FF00]/40 focus:shadow-[0_0_0_4px_rgba(180,255,0,0.10)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "#FFFCF7",
              borderColor: "rgba(8,8,8,0.14)",
              color: DASHBOARD_TEXT,
            }}
          />
          <p className="mt-2 pl-1 text-[10px] tracking-wide" style={{ color: DASHBOARD_MUTED }}>
            Enter zum Senden · Shift+Enter für neue Zeile
          </p>
        </div>

        <LoadingButton
          mode="agent"
          isLoading={running}
          onClick={() => void handleGenerate()}
          disabled={!prompt.trim()}
          className="mt-4 h-[3.25rem] w-full rounded-full bg-[#B4FF00] text-sm font-bold tracking-wide text-[#08080a] transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
        >
          ERSTELLEN — Produktionspfad starten
        </LoadingButton>

        <p className="mt-2 text-center text-[10px] tracking-wide" style={{ color: DASHBOARD_MUTED }}>
          Kostet {T.creditsCost} Credit{T.creditsCost === 1 ? "" : "s"} — ehrliche Abrechnung pro Anfrage
        </p>
      </DashboardPanel>

      <AgentRunMessages
        messages={messages}
        running={running}
        error={error}
        onRetry={retryLast}
      />

      <div className="flex flex-wrap items-center justify-center gap-2 py-1 md:gap-3">
        {[
          { icon: "📝", label: "Briefing eingeben" },
          { icon: "🤖", label: "Tool wird gewählt" },
          { icon: "✅", label: "Output wird vorbereitet" },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-xs" style={{ color: "rgba(8,8,8,0.22)" }}>→</span>}
            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
              style={{
                borderColor: "rgba(8,8,8,0.08)",
                background: "#FFFCF7",
                color: DASHBOARD_MUTED,
              }}
            >
              <span>{step.icon}</span>
              <span>{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/[0.06]" />
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{ color: "rgba(8,8,8,0.35)" }}
          >
            Oder einzelne Tools
          </span>
          <div className="h-px flex-1 bg-black/[0.06]" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {QUICK_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group cursor-pointer rounded-[20px] border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B4FF00]/28"
              style={{
                borderColor: "rgba(8,8,8,0.11)",
                background: "#FFFCF7",
                boxShadow: "0 1px 2px rgba(8,8,8,0.04)",
              }}
            >
              <div
                className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-transform duration-200 group-hover:scale-110"
                style={{ background: tool.color }}
              >
                {tool.icon}
              </div>
              <div className="mb-0.5 text-[11px] font-semibold tracking-tight" style={{ color: "#080808" }}>
                {tool.label}
              </div>
              <div className="text-[9px] leading-snug" style={{ color: "rgba(8,8,8,0.45)" }}>
                {tool.desc}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
