"use client";

import type { AgentOutputs } from "@/lib/agent/types";

type Props = {
  outputs: AgentOutputs;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#060608]/50 p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#B4FF00] mb-2">
        {title}
      </h4>
      <pre className="text-xs text-white/70 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

export function AgentResultCard({ outputs, onSave, saving, saved }: Props) {
  const hasAny = Object.keys(outputs).length > 0;
  if (!hasAny) return null;

  return (
    <div className="mt-4 rounded-2xl border border-[#B4FF00]/25 bg-[#0f0f12] p-4 space-y-3">
      <h3 className="text-sm font-bold text-[#F0EFE8]">Ergebnis-Übersicht</h3>

      {outputs.niche != null && (
        <Section title="Nischen-Analyse">
          {JSON.stringify(outputs.niche, null, 2)}
        </Section>
      )}
      {outputs.outliers != null && (
        <Section title="Outlier">
          {JSON.stringify(outputs.outliers, null, 2)}
        </Section>
      )}
      {outputs.script != null && (
        <Section title="Script">
          {typeof outputs.script === "object" &&
          outputs.script !== null &&
          "script" in outputs.script
            ? String((outputs.script as { script: string }).script)
            : JSON.stringify(outputs.script, null, 2)}
        </Section>
      )}
      {outputs.thumbnail != null && (
        <Section title="Thumbnail">
          {JSON.stringify(outputs.thumbnail, null, 2)}
        </Section>
      )}
      {outputs.viralScore != null && (
        <Section title="Viral Score">
          {JSON.stringify(outputs.viralScore, null, 2)}
        </Section>
      )}
      {outputs.videoIdeas != null && (
        <Section title="Video-Ideen">
          {JSON.stringify(outputs.videoIdeas, null, 2)}
        </Section>
      )}

      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className="w-full min-h-[44px] rounded-xl bg-[#B4FF00] text-[#060608] font-bold text-sm disabled:opacity-50"
        >
          {saved ? "Gespeichert ✓" : saving ? "Speichern…" : "Alles in einem Klick speichern"}
        </button>
      )}
    </div>
  );
}
