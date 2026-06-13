"use client";

import { useDashboardV2 } from "@/contexts/DashboardV2Context";

export function PromptCapsule() {
  const { tool, prompt, setPrompt, themeRgb } = useDashboardV2();

  if (!tool?.hasPrompt) return null;

  return (
    <div className="shrink-0 px-1 pb-1">
      <div
        className="flex items-center gap-2 rounded-full border px-4 py-2.5 backdrop-blur-md"
        style={{
          background: "rgba(8,8,10,0.75)",
          borderColor: `rgba(${themeRgb},0.18)`,
          boxShadow: `0 0 0 3px rgba(${themeRgb},0.04)`,
        }}
      >
        <span
          className="hidden shrink-0 text-[9px] tracking-widest uppercase sm:inline"
          style={{ color: `rgba(${themeRgb},0.55)` }}
        >
          Prompt
        </span>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Beschreibe deine ${tool.label}-Aufgabe…`}
          className="min-w-0 flex-1 bg-transparent font-sans text-sm text-white outline-none placeholder:text-white/25"
        />
        <span className="shrink-0 text-[9px] text-white/20">↵</span>
      </div>
    </div>
  );
}
