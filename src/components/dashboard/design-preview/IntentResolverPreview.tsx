"use client";

import {
  engineLabelForIntent,
  intentLabelFor,
  type PreviewIntent,
} from "./preview-intent";
import { PREVIEW_ACCENT } from "./preview-tokens";

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
      data-preview-stagger-item
    >
      <span
        className="preview-type-chip rounded px-2.5 py-1 uppercase tracking-[0.08em]"
        style={{ background: "rgba(180,255,0,0.12)", color: PREVIEW_ACCENT }}
      >
        {intentLabelFor(intent, lang)}
      </span>
      <span className="preview-type-meta">{engineLabelForIntent(intent)}</span>
      {platformAsk ? (
        <p className="preview-type-body w-full text-[0.8125rem]">{platformAsk}</p>
      ) : null}
    </div>
  );
}
