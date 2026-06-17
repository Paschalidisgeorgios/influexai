"use client";

import { resolveEngineForIntent } from "./studio-engine-registry";
import type { PreviewIntent } from "./preview-intent";

const ACCENT = "#b4ff00";

export type PreviewAssetKind =
  | "image"
  | "video"
  | "hooks"
  | "campaign"
  | "ultra_prepared"
  | "lora_prepared"
  | "none";

type AssetPreviewInlineProps = {
  intent: PreviewIntent;
  kind: PreviewAssetKind;
  lang: "de" | "en";
  visible: boolean;
  input?: string;
};

export function AssetPreviewInline({
  intent,
  kind,
  lang,
  visible,
  input = "",
}: AssetPreviewInlineProps) {
  if (!visible || kind === "none") return null;

  const engine = resolveEngineForIntent(intent, input);
  const de = lang === "de";

  const mockLabel =
    kind === "lora_prepared"
      ? de
        ? "LoRA Training vorbereitet"
        : "LoRA training prepared"
      : kind === "ultra_prepared"
      ? de
        ? "Ultra Engine vorbereitet"
        : "Ultra engine prepared"
      : kind === "image"
        ? de
          ? "Bild-Vorschau"
          : "Image preview"
        : kind === "video"
          ? de
            ? "Motion-Vorschau"
            : "Motion preview"
          : kind === "hooks"
            ? "Hooks"
            : de
              ? "Kampagnenplan"
              : "Campaign plan";

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(8,8,12,0.92)",
      }}
      data-preview-stagger-item
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="preview-type-meta">{mockLabel}</span>
        <span className="preview-type-meta" style={{ color: ACCENT }}>
          {engine.label}
        </span>
      </div>
      <div className="p-4 md:p-5">
        {kind === "lora_prepared" && (
          <div className="space-y-3">
            <p className="preview-type-body text-[0.875rem]" style={{ color: "var(--studio-text-secondary)" }}>
              {de
                ? "Upload, Consent und Trainingsname werden im LoRA-Workflow vorbereitet — kein Training wird hier simuliert."
                : "Upload, consent and training name are prepared in the LoRA workflow — no training is simulated here."}
            </p>
            <div
              className="rounded border border-dashed px-4 py-6 text-center"
              style={{ borderColor: "rgba(180,255,0,0.18)", background: "rgba(180,255,0,0.04)" }}
            >
              <p className="preview-type-meta" style={{ color: ACCENT }}>
                {engine.executionHint[lang]}
              </p>
            </div>
          </div>
        )}
        {kind === "ultra_prepared" && (
          <div className="space-y-3">
            <p className="preview-type-body text-[0.875rem]" style={{ color: "var(--studio-text-secondary)" }}>
              {de
                ? "Produktionsprompt und Engine-Routing sind bereit. Die Ultra-Generierung startet im Bild-Workflow — hier wird nichts simuliert."
                : "Production prompt and engine routing are ready. Ultra generation starts in the image workflow — nothing is simulated here."}
            </p>
            <div
              className="rounded border border-dashed px-4 py-6 text-center"
              style={{ borderColor: "rgba(180,255,0,0.18)", background: "rgba(180,255,0,0.04)" }}
            >
              <p className="preview-type-meta" style={{ color: ACCENT }}>
                {engine.executionHint[lang]}
              </p>
            </div>
          </div>
        )}
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
              de
                ? "Golden hour vibes — dieses Motiv stoppt den Scroll."
                : "Golden hour vibes — this shot stops the scroll.",
              de
                ? "Berg-Sonnenuntergang mit Premium-Campaign-Energie."
                : "Mountain sunset energy your audience saves instantly.",
              de
                ? "Warmes Licht, klare Story — perfekt für Feed & Reel."
                : "Warm light, clear story — built for feed and reel.",
              de
                ? "Dieses Visual wirkt teurer als dein Budget."
                : "This visual looks more premium than your budget.",
              de
                ? "Speichern, teilen, konvertieren — Start here."
                : "Save, share, convert — start here.",
            ].map((hook) => (
              <li
                key={hook}
                className="preview-type-body rounded border px-3 py-2.5 text-[0.8125rem]"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
              >
                {hook}
              </li>
            ))}
          </ul>
        )}
        {kind === "campaign" && (
          <div className="space-y-3 text-[14px] text-neutral-200">
            <p className="preview-type-workflow-title">
              {de ? "Kampagnenplan bereit" : "Campaign plan ready"}
            </p>
            <ul className="preview-type-body space-y-1.5 text-[0.875rem]">
              <li>· 3 Visuals</li>
              <li>· 2 Motion Assets</li>
              <li>· 5 Hooks</li>
              <li>· 7 Content-Ideen</li>
            </ul>
            <p className="preview-type-meta">
              {de ? "Geschätzte Credits: 48" : "Estimated credits: 48"}
            </p>
          </div>
        )}
        <p className="preview-type-meta mt-3">
          {kind === "ultra_prepared" || kind === "lora_prepared"
            ? de
              ? "Preview · Routing bereit"
              : "Preview · routing ready"
            : de
              ? "Preview · Mock-Asset"
              : "Preview · mock asset"}
        </p>
      </div>
    </div>
  );
}
