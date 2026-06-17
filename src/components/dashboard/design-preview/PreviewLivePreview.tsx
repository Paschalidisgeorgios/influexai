"use client";

/**
 * PreviewLivePreview — right-side asset / motion preview area.
 * MOCK — design-preview only.
 */

import type { PreviewIntentId } from "./preview-intent";
import { engineLabelForIntent } from "./preview-intent";
import { useLang } from "./PreviewLang";
import {
  PREVIEW_ACCENT,
  PREVIEW_DARK,
  PREVIEW_HL,
  PREVIEW_LIGHT_BORDER,
  PREVIEW_META,
  PREVIEW_SURFACE_DARK,
  PREVIEW_SUBLINE,
} from "./preview-tokens";

type Props = {
  intent: PreviewIntentId;
  format?: string;
  generating?: boolean;
};

export function PreviewLivePreview({ intent, format = "4:5", generating = false }: Props) {
  const { t } = useLang();
  const p = t.commandOs.preview;

  const aspect =
    format === "9:16"
      ? "aspect-[9/16]"
      : format === "16:9"
        ? "aspect-video"
        : format === "1:1"
          ? "aspect-square"
          : "aspect-[4/5]";

  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: PREVIEW_META }}>
          {p.label}
        </span>
        <span
          className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style={{ background: "rgba(180,255,0,0.12)", color: PREVIEW_DARK }}
        >
          {engineLabelForIntent(intent)}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded border"
        style={{ borderColor: PREVIEW_LIGHT_BORDER, background: PREVIEW_SURFACE_DARK }}
      >
        <div className={`mx-auto w-full max-w-[280px] ${aspect} flex items-center justify-center p-6 sm:max-w-none`}>
          {generating ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
                style={{ borderTopColor: PREVIEW_ACCENT, borderRightColor: PREVIEW_ACCENT }}
              />
              <p className="text-[13px] text-neutral-400">{p.generating}</p>
            </div>
          ) : (
            <PreviewPlaceholder intent={intent} emptyLabel={p.empty} />
          )}
        </div>
      </div>

      <p className="text-[12px] leading-relaxed" style={{ color: PREVIEW_SUBLINE }}>
        {intent === "campaign_planning" ? p.campaignHint : p.assetHint}
      </p>
    </aside>
  );
}

function PreviewPlaceholder({ intent, emptyLabel }: { intent: PreviewIntentId; emptyLabel: string }) {
  if (intent === "campaign_planning") {
    return (
      <div className="w-full space-y-2 text-left">
        {["Hook A — Problem → Lösung", "Hook B — Social Proof", "Hook C — Before / After"].map((h) => (
          <div
            key={h}
            className="rounded border px-3 py-2 text-[12px]"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}
          >
            {h}
          </div>
        ))}
      </div>
    );
  }

  if (intent === "asset_reuse") {
    return (
      <div className="grid w-full grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="aspect-square rounded border"
            style={{
              borderColor: n === 1 ? PREVIEW_ACCENT : "rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-[13px] font-medium text-neutral-500" style={PREVIEW_HL}>
        {emptyLabel}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
        {intent === "image_to_video" ? "Motion Preview" : "Asset Preview"}
      </p>
    </div>
  );
}
