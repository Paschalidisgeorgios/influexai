"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SpeedRampEditor } from "@/components/szenen-generator/SpeedRampEditor";
import type {
  ModelCapabilities,
  SzenenAspectRatio,
  SzenenAudioMode,
} from "@/lib/szenen-generator-capabilities";
import type { SzenenCinematicParams } from "@/lib/szenen-generator-payload";

type AdvancedSettingsPanelProps = {
  capabilities: ModelCapabilities;
  duration: number;
  resolution: string;
  aspectRatio?: SzenenAspectRatio;
  videoCount: number;
  audioMode: SzenenAudioMode;
  extendPrompt: boolean;
  cinematic: SzenenCinematicParams;
  speedRampLabel: string;
  onDuration: (d: number) => void;
  onResolution: (r: string) => void;
  onAspectRatio: (r: SzenenAspectRatio) => void;
  onVideoCount: (n: number) => void;
  onAudioMode: (mode: SzenenAudioMode) => void;
  onExtendPrompt: (value: boolean) => void;
  onCinematic: (key: keyof SzenenCinematicParams, value: string) => void;
  onSpeedRampLabel: (label: string) => void;
};

const PARAM_OPTIONS = {
  camera: ["Statisch", "Pan links", "Pan rechts", "Zoom in", "Zoom out", "Orbit"],
  shot: ["Medium Shot", "Close-Up", "Wide Shot", "Over-the-Shoulder"],
  expression: ["Neutral", "Freudig", "Dramatisch", "Nachdenklich"],
  atmosphere: ["Cinematic", "Dreamy", "Gritty", "Clean"],
  light: ["Natürlich", "Neon", "Golden Hour", "Studio"],
  effect: ["Keine", "Film Grain", "Lens Flare", "Motion Blur"],
};

const CINEMATIC_LABELS: Record<keyof SzenenCinematicParams, string> = {
  camera: "Kamerabewegung",
  shot: "Shot Type",
  expression: "Expression",
  atmosphere: "Atmosphere",
  light: "Light",
  effect: "Effect Enhance",
};

function ParamSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-white/25">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/70 outline-none focus:border-white/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function PillGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-[11px] text-white/25">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className="rounded-full border px-3 py-1.5 text-[11px] transition-all duration-[1200ms]"
            style={{
              borderColor: value === opt ? "var(--szenen-accent-30)" : "rgba(255,255,255,0.1)",
              background: value === opt ? "var(--szenen-accent-10)" : "rgba(255,255,255,0.03)",
              color: value === opt ? "var(--szenen-accent-text)" : "rgba(255,255,255,0.5)",
            }}
          >
            {typeof opt === "number" ? `${opt}s` : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function hasAdvancedContent(caps: ModelCapabilities): boolean {
  return (
    caps.showDuration ||
    caps.showResolution ||
    caps.aspectRatios.length > 0 ||
    caps.supportsBatch ||
    caps.supportsAudio ||
    caps.supportsPromptEnhancement ||
    caps.supportsSpeedRamp ||
    caps.supportsCinematicParams
  );
}

export function AdvancedSettingsPanel({
  capabilities,
  duration,
  resolution,
  aspectRatio,
  videoCount,
  audioMode,
  extendPrompt,
  cinematic,
  speedRampLabel,
  onDuration,
  onResolution,
  onAspectRatio,
  onVideoCount,
  onAudioMode,
  onExtendPrompt,
  onCinematic,
  onSpeedRampLabel,
}: AdvancedSettingsPanelProps) {
  const [open, setOpen] = useState(false);

  if (!hasAdvancedContent(capabilities)) {
    return null;
  }

  const audioOptions: { value: SzenenAudioMode; label: string }[] = [
    { value: "none", label: "Kein Audio" },
  ];
  if (capabilities.supportsAiAudio) {
    audioOptions.push({ value: "ai", label: "KI-Audio" });
  }
  if (capabilities.supportsCustomAudio) {
    audioOptions.push({ value: "custom", label: "Eigenes Audio" });
  }

  return (
    <div className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[13px] font-medium text-white/70">Erweiterte Einstellungen</span>
        <ChevronDown
          size={16}
          className={`text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-5 border-t border-white/10 px-4 py-4">
          {capabilities.supportsSpeedRamp && (
            <SpeedRampEditor
              value={speedRampLabel}
              onChange={onSpeedRampLabel}
            />
          )}

          {capabilities.supportsCinematicParams && (
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(PARAM_OPTIONS) as (keyof SzenenCinematicParams)[]).map((key) => (
                <ParamSelect
                  key={key}
                  label={CINEMATIC_LABELS[key]}
                  value={cinematic[key] ?? PARAM_OPTIONS[key][0]}
                  options={PARAM_OPTIONS[key]}
                  onChange={(value) => onCinematic(key, value)}
                />
              ))}
            </div>
          )}

          {capabilities.showDuration && (
            <PillGroup
              label="Dauer"
              value={duration}
              options={capabilities.durations}
              onChange={onDuration}
            />
          )}

          {capabilities.showResolution && (
            <PillGroup
              label="Auflösung"
              value={resolution}
              options={capabilities.resolutions}
              onChange={onResolution}
            />
          )}

          {capabilities.aspectRatios.length > 0 && aspectRatio && (
            <PillGroup
              label="Seitenverhältnis"
              value={aspectRatio}
              options={capabilities.aspectRatios}
              onChange={onAspectRatio}
            />
          )}

          {capabilities.supportsAudio && audioOptions.length > 1 && (
            <div>
              <span className="mb-2 block text-[11px] text-white/25">Audio</span>
              <div className="flex flex-wrap gap-2">
                {audioOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onAudioMode(option.value)}
                    className="rounded-full border px-3 py-1.5 text-[11px] transition-all duration-[1200ms]"
                    style={{
                      borderColor:
                        audioMode === option.value
                          ? "var(--szenen-accent-30)"
                          : "rgba(255,255,255,0.1)",
                      background:
                        audioMode === option.value
                          ? "var(--szenen-accent-10)"
                          : "rgba(255,255,255,0.03)",
                      color:
                        audioMode === option.value
                          ? "var(--szenen-accent-text)"
                          : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {capabilities.supportsBatch && (
            <PillGroup
              label="Video-Anzahl"
              value={videoCount}
              options={capabilities.videoCountOptions}
              onChange={onVideoCount}
            />
          )}

          {capabilities.supportsPromptEnhancement && (
            <label className="flex items-center gap-2 text-[12px] text-white/60">
              <input
                type="checkbox"
                checked={extendPrompt}
                onChange={(e) => onExtendPrompt(e.target.checked)}
                className="rounded border-white/20 bg-white/[0.03]"
              />
              Prompt automatisch erweitern
            </label>
          )}
        </div>
      )}
    </div>
  );
}
