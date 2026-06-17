"use client";

import {
  engineLabelForIntent,
  intentLabelFor,
  type PreviewIntent,
} from "./preview-intent";

const ACCENT = "#b4ff00";

type IntentResolverPreviewProps = {
  intent: PreviewIntent;
  lang: "de" | "en";
  platformAsk?: string;
};

export function IntentResolverPreview({
  intent,
  lang,
  platformAsk,
}: IntentResolverPreviewProps) {
  if (intent === "unknown") return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b py-3"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      data-preview-stagger
    >
      <span
        className="rounded px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
        style={{ background: "rgba(180,255,0,0.12)", color: ACCENT }}
      >
        {intentLabelFor(intent, lang)}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-500">
        {engineLabelForIntent(intent)}
      </span>
      {platformAsk ? (
        <p
          className="w-full text-[13px] leading-relaxed"
          style={{ color: "rgba(244,240,232,0.78)" }}
        >
          {platformAsk}
        </p>
      ) : null}
    </div>
  );
}
