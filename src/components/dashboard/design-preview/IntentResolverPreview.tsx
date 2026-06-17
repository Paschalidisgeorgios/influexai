"use client";

import {
  detectEngineMismatch,
  getAgentCapabilityHint,
  resolveEngineForIntent,
} from "./studio-engine-registry";
import {
  intentLabelFor,
  type PreviewIntent,
} from "./preview-intent";
import { PREVIEW_ACCENT } from "./preview-tokens";

type IntentResolverPreviewProps = {
  intent: PreviewIntent;
  input: string;
  lang: "de" | "en";
  platformAsk?: string;
  hasImageContext?: boolean;
  hasVideoContext?: boolean;
};

export function IntentResolverPreview({
  intent,
  input,
  lang,
  platformAsk,
  hasImageContext = false,
  hasVideoContext = false,
}: IntentResolverPreviewProps) {
  if (intent === "unknown") return null;

  const engine = resolveEngineForIntent(intent, input);
  const mismatch = detectEngineMismatch(input, intent, lang);
  const capabilityHint = getAgentCapabilityHint(intent, input, lang, {
    hasImageAsset: hasImageContext,
    hasVideoAsset: hasVideoContext,
  });

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
      <span className="preview-type-meta">{engine.label}</span>
      {platformAsk ? (
        <p className="preview-type-body w-full text-[0.8125rem]">{platformAsk}</p>
      ) : null}
      {mismatch ? (
        <p
          className="preview-type-body w-full text-[0.8125rem]"
          style={{ color: "rgba(244,240,232,0.72)" }}
        >
          {mismatch}
        </p>
      ) : null}
      {capabilityHint ? (
        <p
          className="preview-type-body w-full text-[0.8125rem]"
          style={{ color: "rgba(244,240,232,0.72)" }}
        >
          {capabilityHint}
        </p>
      ) : null}
    </div>
  );
}
