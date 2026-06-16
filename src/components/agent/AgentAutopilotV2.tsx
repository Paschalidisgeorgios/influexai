"use client";

import { useCallback, useRef, useState } from "react";
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
import {
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPanel,
} from "@/components/dashboard/core/DashboardSurface";

const TOOL_TAB_LABELS: Record<AgentToolKey, string> = {
  agent: "Autopilot",
  campaign: "Kampagne",
};

const QUICK_TOOLS = [
  {
    icon: Zap,
    label: "Viral Hook",
    desc: "Hook aus Thema",
    href: "/dashboard?tool=viral-hook",
  },
  {
    icon: Calendar,
    label: "Content Kalender",
    desc: "Plan mit Hooks",
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
    desc: "Prompt und Format",
    href: "/dashboard?tool=image-gen",
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
    <div className="mx-auto w-full max-w-6xl space-y-6 md:space-y-7">
      <div className="flex flex-wrap gap-2">
        {(["agent", "campaign"] as AgentToolKey[]).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => switchTool(tool)}
            className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
              activeTool === tool
                ? "border-[#B4FF00]/40 bg-[#B4FF00]/14 text-[#080808]"
                : "border-black/[0.10] bg-[#FFFCF7] text-black/55 hover:border-black/18 hover:text-black/80"
            }`}
          >
            {TOOL_TAB_LABELS[tool]}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium" style={{ color: DASHBOARD_MUTED }}>
          Assistent
        </p>
        <h1
          className="font-display mb-2 text-3xl leading-none font-extrabold tracking-tight md:text-[2.75rem]"
          style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.03em" }}
        >
          Briefing vorbereiten
        </h1>
        <p className="max-w-2xl font-sans text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          {activeTool === "campaign"
            ? "Kampagne strukturieren — der Agent schlägt Tools und Schritte vor. Du entscheidest über Modell und Output."
            : "Der Agent hilft beim Briefing und schlägt einen Produktionspfad vor. Tools bleiben jederzeit direkt erreichbar."}
        </p>
      </div>

      {!profileLoading && !profile && (
        <p className="text-xs" style={{ color: "rgba(8,8,8,0.45)" }}>
          Creator-Profil für personalisierte Vorschläge in{" "}
          <Link href="/dashboard/settings" className="font-medium text-[#080808] underline hover:opacity-80">
            Einstellungen
          </Link>{" "}
          hinterlegen.
        </p>
      )}

      {profile && (
        <div
          className="inline-flex cursor-default items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-all"
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
              className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${
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
          <p className="mt-2 pl-1 text-[11px]" style={{ color: DASHBOARD_MUTED }}>
            Enter zum Senden · Shift+Enter für neue Zeile
          </p>
        </div>

        <LoadingButton
          mode="agent"
          isLoading={running}
          onClick={() => void handleGenerate()}
          disabled={!prompt.trim()}
          className="mt-4 h-[3.25rem] w-full rounded-full bg-[#B4FF00] text-sm font-semibold text-[#08080a] transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
        >
          {running ? "Vorschlag wird erstellt…" : "Produktionspfad vorschlagen"}
        </LoadingButton>

        <p className="mt-2 text-center text-[11px]" style={{ color: DASHBOARD_MUTED }}>
          {T.creditsCost} Credit{T.creditsCost === 1 ? "" : "s"} pro Anfrage
        </p>
      </DashboardPanel>

      <AgentRunMessages
        messages={messages}
        running={running}
        error={error}
        onRetry={retryLast}
      />

      <div className="flex flex-wrap items-center justify-center gap-2 py-1 md:gap-4">
        {["Briefing", "Tool-Vorschlag", "Output vorbereiten"].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && <span className="text-xs" style={{ color: "rgba(8,8,8,0.22)" }}>→</span>}
            <div
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium"
              style={{
                borderColor: "rgba(8,8,8,0.08)",
                background: "#FFFCF7",
                color: DASHBOARD_MUTED,
              }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                style={{ background: "rgba(8,8,8,0.06)", color: DASHBOARD_TEXT }}
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/[0.06]" />
          <span className="text-xs" style={{ color: "rgba(8,8,8,0.40)" }}>
            Direkt in Tools
          </span>
          <div className="h-px flex-1 bg-black/[0.06]" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {QUICK_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
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
                  className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
                  style={{ background: "rgba(8,8,8,0.04)", color: DASHBOARD_TEXT }}
                >
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="mb-0.5 text-[12px] font-semibold tracking-tight" style={{ color: "#080808" }}>
                  {tool.label}
                </div>
                <div className="text-[10px] leading-snug" style={{ color: "rgba(8,8,8,0.45)" }}>
                  {tool.desc}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
