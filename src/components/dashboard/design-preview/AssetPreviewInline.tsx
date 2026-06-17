"use client";

import { engineLabelForIntent, type PreviewIntent } from "./preview-intent";

const ACCENT = "#b4ff00";

export type PreviewAssetKind = "image" | "video" | "hooks" | "campaign" | "none";

type AssetPreviewInlineProps = {
  intent: PreviewIntent;
  kind: PreviewAssetKind;
  lang: "de" | "en";
  visible: boolean;
};

export function AssetPreviewInline({ intent, kind, lang, visible }: AssetPreviewInlineProps) {
  if (!visible || kind === "none") return null;

  const mockLabel =
    kind === "image"
      ? lang === "de"
        ? "Bild-Vorschau"
        : "Image preview"
      : kind === "video"
        ? lang === "de"
          ? "Motion-Vorschau"
          : "Motion preview"
        : kind === "hooks"
          ? "Hooks"
          : lang === "de"
            ? "Kampagnenplan"
            : "Campaign plan";

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(8,8,12,0.92)",
      }}
      data-preview-stagger
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-400">
          {mockLabel}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: ACCENT }}>
          {engineLabelForIntent(intent)}
        </span>
      </div>
      <div className="p-4 md:p-5">
        {(kind === "image" || kind === "video") && (
          <div
            className="mx-auto aspect-[4/5] max-h-[320px] w-full max-w-[280px] rounded border"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background:
                "linear-gradient(145deg, rgba(180,255,0,0.06), rgba(255,255,255,0.03), rgba(8,8,12,0.4))",
            }}
          />
        )}
        {kind === "hooks" && (
          <ul className="space-y-2.5">
            {[
              lang === "de"
                ? "Golden hour vibes — dieses Motiv stoppt den Scroll."
                : "Golden hour vibes — this shot stops the scroll.",
              lang === "de"
                ? "Berg-Sonnenuntergang mit Premium-Campaign-Energie."
                : "Mountain sunset energy your audience saves instantly.",
              lang === "de"
                ? "Warmes Licht, klare Story — perfekt für Feed & Reel."
                : "Warm light, clear story — built for feed and reel.",
              lang === "de"
                ? "Dieses Visual wirkt teurer als dein Budget."
                : "This visual looks more premium than your budget.",
              lang === "de"
                ? "Speichern, teilen, konvertieren — Start here."
                : "Save, share, convert — start here.",
            ].map((hook) => (
              <li
                key={hook}
                className="rounded border px-3 py-2.5 text-[13px] leading-relaxed text-neutral-200"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
              >
                {hook}
              </li>
            ))}
          </ul>
        )}
        {kind === "campaign" && (
          <div className="space-y-3 text-[14px] text-neutral-200">
            <p className="font-semibold text-white">
              {lang === "de" ? "Kampagnenplan bereit" : "Campaign plan ready"}
            </p>
            <ul className="space-y-1.5 text-neutral-300">
              <li>· 3 Visuals</li>
              <li>· 2 Motion Assets</li>
              <li>· 5 Hooks</li>
              <li>· 7 Content-Ideen</li>
            </ul>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-neutral-500">
              {lang === "de" ? "Geschätzte Credits: 48" : "Estimated credits: 48"}
            </p>
          </div>
        )}
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-600">
          {lang === "de" ? "Preview · Mock-Asset" : "Preview · mock asset"}
        </p>
      </div>
    </div>
  );
}
