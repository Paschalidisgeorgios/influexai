"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AGENT_TOOLS,
  type AgentToolKey,
} from "@/lib/tools/agent-tool-registry";
import { capsuleShow } from "./SmartCapsule";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPanel,
} from "@/components/dashboard/core/DashboardSurface";

const QUICK_TOOLS = [
  {
    icon: "⚡",
    label: "Viral Hook Generator",
    desc: "Hooks die stoppen",
    href: "/dashboard/viral-hook",
    color: "rgba(180,255,0,0.08)",
  },
  {
    icon: "📅",
    label: "Content Kalender",
    desc: "30-Tage-Plan mit Hooks",
    href: "/dashboard/content-kalender",
    color: "rgba(40,160,255,0.08)",
  },
  {
    icon: "📈",
    label: "Trend Script",
    desc: "Trend → Script sofort",
    href: "/dashboard/trend-to-script",
    color: "rgba(160,64,255,0.08)",
  },
  {
    icon: "🖼",
    label: "Bild Generator",
    desc: "KI-Bilder für Content",
    href: "/dashboard/image-generator",
    color: "rgba(224,169,81,0.08)",
  },
] as const;

export function AgentAutopilotV2() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<AgentToolKey>("agent");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { profile, loading: profileLoading } = useCreatorProfile();

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
    setIsGenerating(true);
    capsuleShow("Agent berechnet deine Anfrage…", 3000);
    router.push(
      `/dashboard/ki-agent/chat?prompt=${encodeURIComponent(prompt.trim())}&tool=${activeTool}`
    );
  }, [prompt, router, activeTool]);

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

  const realtimePayload = T.buildPayload(
    prompt,
    profile
      ? {
          nische: profile.nische,
          tonalitaet: profile.tonalitaet,
          plattformen: profile.plattformen,
        }
      : undefined
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 md:space-y-7">
      <div className="flex flex-wrap gap-2">
        {(["agent", "campaign"] as AgentToolKey[]).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => switchTool(tool)}
            className={`rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
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
          Command Center
        </p>
        <h1
          className="font-display mb-2 text-3xl leading-none font-extrabold tracking-tight md:text-[2.75rem]"
          style={{ color: DASHBOARD_TEXT, letterSpacing: "-0.03em" }}
        >
          Idee eingeben
        </h1>
        <p className="max-w-2xl font-sans text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
          {T.sub} — Briefing wird analysiert, Tool wird gewählt, Output vorbereitet.
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
            disabled={isGenerating}
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
          isLoading={isGenerating}
          onClick={() => void handleGenerate()}
          disabled={!prompt.trim()}
          className="mt-4 h-[3.25rem] w-full rounded-xl bg-[#B4FF00] text-sm font-bold tracking-wide text-[#08080a] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_6px_32px_rgba(180,255,0,0.32)] active:scale-[0.99] disabled:opacity-40"
        >
          ERSTELLEN — Produktionspfad starten
        </LoadingButton>

        <p className="mt-2 text-center text-[10px] tracking-wide" style={{ color: DASHBOARD_MUTED }}>
          Kostet {T.creditsCost} Credit{T.creditsCost === 1 ? "" : "s"} — ehrliche Abrechnung pro Anfrage
        </p>
      </DashboardPanel>

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
              className="group cursor-pointer rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B4FF00]/28"
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

      <div
        className="mt-2 overflow-hidden rounded-xl border opacity-90"
        style={{ borderColor: "rgba(8,8,8,0.07)", background: "rgba(255,255,255,0.35)" }}
      >
        <button
          type="button"
          onClick={() => setPayloadOpen(!payloadOpen)}
          className="flex w-full items-center justify-between px-4 py-2.5 font-mono text-[9px] tracking-wider transition-colors duration-150"
          style={{ color: "rgba(8,8,8,0.40)" }}
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B4FF00] opacity-60" />
            <span>Technische Vorschau</span>
          </div>
          <span
            className={`transition-transform duration-200 ${payloadOpen ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        {payloadOpen && (
          <div
            className="max-h-48 overflow-auto border-t px-4 py-3"
            style={{ borderColor: "rgba(8,8,8,0.06)", background: "rgba(8,8,8,0.04)" }}
          >
            <pre className="font-mono text-[10px] leading-relaxed text-[#080808]/70">
              {JSON.stringify(realtimePayload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
