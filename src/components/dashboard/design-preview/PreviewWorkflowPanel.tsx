"use client";

/**
 * PreviewWorkflowPanel — dynamic production workflow per detected intent.
 * MOCK — design-preview only.
 */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { PreviewIntentId, PreviewPlatformHint } from "./preview-intent";
import {
  engineLabelForIntent,
  INTENT_LABELS,
  optimizeProductionPrompt,
} from "./preview-intent";
import { mvpRouteForIntent } from "./preview-mvp-routes";
import { PreviewAdvancedSettings } from "./PreviewAdvancedSettings";
import { useLang } from "./PreviewLang";
import {
  PREVIEW_ACCENT,
  PREVIEW_BODY,
  PREVIEW_DARK,
  PREVIEW_HL,
  PREVIEW_LIGHT_BORDER,
  PREVIEW_LIGHT_CARD,
  PREVIEW_META,
} from "./preview-tokens";

const PANEL_SURFACE = PREVIEW_LIGHT_CARD;
const PANEL_BORDER = PREVIEW_LIGHT_BORDER;

type Props = {
  intent: PreviewIntentId;
  originalPrompt: string;
  platform: PreviewPlatformHint | null;
  onGenerate?: () => void;
  onGenerateComplete?: () => void;
};

const IMAGE_FORMATS = ["9:16", "4:5", "1:1", "16:9"] as const;
const IMAGE_STYLES = ["Produkt", "Creator", "Ad", "Cinematic"] as const;
const QUALITIES = ["Schnell", "Standard", "Premium"] as const;

export function PreviewWorkflowPanel({ intent, originalPrompt, platform, onGenerate, onGenerateComplete }: Props) {
  const { t } = useLang();
  const w = t.commandOs.workflow;
  const optimized = optimizeProductionPrompt(originalPrompt, intent);

  const [format, setFormat] = useState(platform?.format ?? "4:5");
  const [style, setStyle] = useState<string>(IMAGE_STYLES[0]);
  const [quality, setQuality] = useState<string>(QUALITIES[1]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    onGenerate?.();
    setTimeout(() => {
      setGenerating(false);
      onGenerateComplete?.();
    }, 1800);
  };

  return (
    <div
      className="flex min-w-0 flex-col gap-5 rounded border p-4 sm:p-5"
      style={{ borderColor: PANEL_BORDER, background: PANEL_SURFACE }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: PREVIEW_META }}>
            {w.panelLabel}
          </p>
          <h2 className="mt-1 text-[22px] font-semibold leading-tight sm:text-[26px]" style={{ color: PREVIEW_DARK, ...PREVIEW_HL }}>
            {INTENT_LABELS[intent]}
          </h2>
        </div>
        <span
          className="rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
          style={{ borderColor: PREVIEW_LIGHT_BORDER, color: PREVIEW_BODY }}
        >
          {engineLabelForIntent(intent)}
        </span>
      </header>

      <PromptBlock original={originalPrompt} optimized={optimized} hint={w.promptHint} />

      {intent === "image_generation" && (
        <ImageGenerationFields
          format={format}
          setFormat={setFormat}
          style={style}
          setStyle={setStyle}
          quality={quality}
          setQuality={setQuality}
          platform={platform}
          labels={w.image}
        />
      )}

      {intent === "image_to_video" && (
        <ImageToVideoFields
          format={format}
          setFormat={setFormat}
          quality={quality}
          setQuality={setQuality}
          platform={platform}
          labels={w.video}
        />
      )}

      {intent === "campaign_planning" && <CampaignFields labels={w.campaign} />}

      {intent === "asset_reuse" && <AssetReuseFields labels={w.asset} />}

      {intent === "unknown" && (
        <p className="text-[14px]" style={{ color: PREVIEW_BODY }}>
          {w.unknownHint}
        </p>
      )}

      <PreviewAdvancedSettings />

      {intent !== "unknown" && (
        <Link
          href={mvpRouteForIntent(intent)}
          onClick={(e) => {
            e.preventDefault();
            if (generating) return;
            handleGenerate();
            window.setTimeout(() => {
              window.location.assign(mvpRouteForIntent(intent));
            }, 1400);
          }}
          className="inline-flex w-full items-center justify-center rounded py-3.5 text-[14px] font-semibold transition-opacity sm:w-auto sm:px-8"
          style={{
            background: PREVIEW_ACCENT,
            color: PREVIEW_DARK,
            opacity: generating ? 0.65 : 1,
            pointerEvents: generating ? "none" : "auto",
          }}
        >
          {generating ? w.generating : primaryCta(intent, w)}
        </Link>
      )}
    </div>
  );
}

function primaryCta(intent: PreviewIntentId, w: ReturnType<typeof useLang>["t"]["commandOs"]["workflow"]) {
  switch (intent) {
    case "image_generation":
      return w.image.cta;
    case "image_to_video":
      return w.video.cta;
    case "campaign_planning":
      return w.campaign.cta;
    case "asset_reuse":
      return w.asset.cta;
    default:
      return w.defaultCta;
  }
}

function PromptBlock({
  original,
  optimized,
  hint,
}: {
  original: string;
  optimized: string;
  hint: string;
}) {
  const { t } = useLang();
  const p = t.commandOs.prompts;

  return (
    <div
      className="space-y-3 rounded border p-4"
      style={{ borderColor: PREVIEW_LIGHT_BORDER, background: PREVIEW_LIGHT_CARD }}
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
          {p.original}
        </p>
        <p className="mt-1 text-[14px] leading-relaxed" style={{ color: PREVIEW_DARK }}>
          {original}
        </p>
      </div>
      <div className="h-px" style={{ background: PREVIEW_LIGHT_BORDER }} />
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
          {p.optimized}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed italic" style={{ color: PREVIEW_BODY }}>
          {optimized}
        </p>
      </div>
      <p className="text-[11px]" style={{ color: PREVIEW_META }}>
        {hint}
      </p>
    </div>
  );
}

function ImageGenerationFields({
  format,
  setFormat,
  style,
  setStyle,
  quality,
  setQuality,
  platform,
  labels,
}: {
  format: string;
  setFormat: (v: string) => void;
  style: string;
  setStyle: (v: string) => void;
  quality: string;
  setQuality: (v: string) => void;
  platform: PreviewPlatformHint | null;
  labels: {
    format: string;
    style: string;
    quality: string;
    platformDetected: string;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {platform && (
        <div className="sm:col-span-2">
          <Chip label={labels.platformDetected} value={`${platform.platform} · ${platform.formatLabel}`} />
        </div>
      )}
      <ChipGroup label={labels.format} options={[...IMAGE_FORMATS]} value={format} onChange={setFormat} />
      <ChipGroup label={labels.style} options={[...IMAGE_STYLES]} value={style} onChange={setStyle} />
      <ChipGroup label={labels.quality} options={[...QUALITIES]} value={quality} onChange={setQuality} />
    </div>
  );
}

function ImageToVideoFields({
  format,
  setFormat,
  quality,
  setQuality,
  platform,
  labels,
}: {
  format: string;
  setFormat: (v: string) => void;
  quality: string;
  setQuality: (v: string) => void;
  platform: PreviewPlatformHint | null;
  labels: {
    startImage: string;
    upload: string;
    gallery: string;
    url: string;
    motionPrompt: string;
    format: string;
    quality: string;
    platformDetected: string;
  };
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
          {labels.startImage}
        </p>
        <div className="flex flex-wrap gap-2">
          <GhostBtn>{labels.upload}</GhostBtn>
          <GhostBtn>{labels.gallery}</GhostBtn>
        </div>
        <input
          type="text"
          placeholder={labels.url}
          className="mt-2 w-full rounded border bg-white/50 px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: PREVIEW_LIGHT_BORDER }}
        />
      </div>
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
          {labels.motionPrompt}
        </p>
        <textarea
          rows={2}
          className="w-full resize-none rounded border bg-white/50 px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: PREVIEW_LIGHT_BORDER }}
          defaultValue="Smooth push-in, subtle product highlight, social-ready pacing"
        />
      </div>
      {platform && <Chip label={labels.platformDetected} value={`${platform.platform} · ${platform.formatLabel}`} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <ChipGroup label={labels.format} options={[...IMAGE_FORMATS]} value={format} onChange={setFormat} />
        <ChipGroup label={labels.quality} options={[...QUALITIES]} value={quality} onChange={setQuality} />
      </div>
    </div>
  );
}

function CampaignFields({
  labels,
}: {
  labels: {
    platform: string;
    audience: string;
    count: string;
    hookDirection: string;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField label={labels.platform} options={["Instagram", "TikTok", "LinkedIn", "YouTube", "Multi"]} />
      <SelectField label={labels.audience} options={["Beauty · 18–34", "Food · Local", "B2B SaaS", "Custom"]} />
      <SelectField label={labels.count} options={["3 Ideen", "5 Ideen", "7 Ideen", "10 Ideen"]} />
      <SelectField
        label={labels.hookDirection}
        options={["Problem → Lösung", "Social Proof", "UGC Authentic", "Educational"]}
      />
    </div>
  );
}

function AssetReuseFields({
  labels,
}: {
  labels: {
    pickAsset: string;
    action: string;
    actions: string[];
  };
}) {
  const [action, setAction] = useState(labels.actions[0]);

  return (
    <div className="space-y-4">
      <GhostBtn wide>{labels.pickAsset}</GhostBtn>
      <ChipGroup label={labels.action} options={labels.actions} value={action} onChange={setAction} />
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded border px-3 py-2 text-[12px]"
      style={{ borderColor: PREVIEW_LIGHT_BORDER, background: "rgba(180,255,0,0.08)" }}
    >
      <span style={{ color: PREVIEW_META }}>{label}</span>
      <span className="font-medium" style={{ color: PREVIEW_DARK }}>
        {value}
      </span>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="rounded border px-2.5 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                borderColor: active ? PREVIEW_ACCENT : PREVIEW_LIGHT_BORDER,
                background: active ? "rgba(180,255,0,0.14)" : "transparent",
                color: PREVIEW_DARK,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GhostBtn({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded border px-3 py-2 text-[13px] font-medium ${wide ? "w-full" : ""}`}
      style={{ borderColor: PREVIEW_LIGHT_BORDER, color: PREVIEW_BODY }}
    >
      {children}
    </button>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
        {label}
      </span>
      <select
        className="rounded border bg-white/50 px-3 py-2 text-[13px] outline-none"
        style={{ borderColor: PREVIEW_LIGHT_BORDER }}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export { type Props as PreviewWorkflowPanelProps };
