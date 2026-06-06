"use client";

import type { ReactNode } from "react";
import type { ViralScoreResult } from "@/lib/viral-score";

function TextBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#060608]/60 p-3">
      <h5 className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent,#B4FF00)] mb-2">
        {title}
      </h5>
      <div className="text-xs text-white/75 leading-relaxed whitespace-pre-wrap break-words">
        {children}
      </div>
    </div>
  );
}

type ScriptShape = {
  script?: string;
  hookVariants?: string[];
  wordCount?: number;
  estimatedSeconds?: number;
  toneDescription?: string;
};

export function AgentScriptResult({ data }: { data: unknown }) {
  const s = data as ScriptShape;
  const scriptText =
    typeof s.script === "string"
      ? s.script
      : typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2);

  return (
    <div className="space-y-2">
      {Array.isArray(s.hookVariants) && s.hookVariants.length > 0 && (
        <TextBlock title="Hook-Varianten">
          <ul className="space-y-1.5 list-none">
            {s.hookVariants.map((hook, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--accent,#B4FF00)] shrink-0">
                  {i + 1}.
                </span>
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        </TextBlock>
      )}
      <TextBlock title="Script">{scriptText}</TextBlock>
      {(s.wordCount != null || s.estimatedSeconds != null) && (
        <p className="text-[10px] text-white/45 px-1">
          {s.wordCount != null ? `${s.wordCount} Wörter` : null}
          {s.wordCount != null && s.estimatedSeconds != null ? " · " : null}
          {s.estimatedSeconds != null ? `~${s.estimatedSeconds}s` : null}
        </p>
      )}
    </div>
  );
}

export function AgentViralScoreResult({ data }: { data: unknown }) {
  const score = data as ViralScoreResult;
  const total = score.total_score ?? 0;
  const rows = [
    { label: "Hook", value: score.hook_score },
    { label: "Retention", value: score.retention_score },
    { label: "CTR", value: score.ctr_score },
    { label: "Trend", value: score.trend_score },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--accent,#B4FF00)]/35 bg-[var(--accent,#B4FF00)]/10 text-xl font-bold text-[var(--accent,#B4FF00)]"
          style={{ fontFamily: "var(--font-bebas, sans-serif)" }}
        >
          {total}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F0EFE8]">Viral Score</p>
          <p className="text-xs text-white/55">{score.verdict}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-white/10 bg-[#060608]/60 px-3 py-2"
          >
            <p className="text-[10px] uppercase text-white/45">{row.label}</p>
            <p className="text-sm font-bold text-white/85">{row.value}/25</p>
          </div>
        ))}
      </div>
      {score.strengths?.length > 0 && (
        <TextBlock title="Stärken">
          <ul className="list-disc pl-4 space-y-1">
            {score.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </TextBlock>
      )}
      {score.improvements?.length > 0 && (
        <TextBlock title="Verbesserungen">
          <ul className="list-disc pl-4 space-y-1">
            {score.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </TextBlock>
      )}
      {score.improved_hook ? (
        <TextBlock title="Verbesserter Hook">{score.improved_hook}</TextBlock>
      ) : null}
    </div>
  );
}

export function AgentNicheResult({ data }: { data: unknown }) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <div className="space-y-2">
      {list.slice(0, 5).map((item, i) => {
        const n = item as Record<string, unknown>;
        const title = String(n.title ?? n.name ?? `Nische ${i + 1}`);
        return (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-[#060608]/60 p-3"
          >
            <p className="text-sm font-semibold text-[#F0EFE8]">{title}</p>
            {n.description ? (
              <p className="mt-1 text-xs text-white/60">
                {String(n.description)}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function AgentThumbnailResult({ data }: { data: unknown }) {
  const concepts = Array.isArray(data) ? data : [data];
  return (
    <div className="space-y-2">
      {concepts.slice(0, 3).map((item, i) => {
        const c = item as Record<string, unknown>;
        return (
          <TextBlock key={i} title={`Konzept ${i + 1}`}>
            {c.headline ? (
              <p className="font-semibold text-white/85 mb-1">
                {String(c.headline)}
              </p>
            ) : null}
            {c.description ? String(c.description) : JSON.stringify(c, null, 2)}
          </TextBlock>
        );
      })}
    </div>
  );
}

export function AgentGenericJsonResult({ data }: { data: unknown }) {
  return (
    <pre className="text-[11px] font-mono text-white/65 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
