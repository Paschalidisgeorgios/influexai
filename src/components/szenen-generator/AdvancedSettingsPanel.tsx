"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SpeedRampEditor } from "@/components/szenen-generator/SpeedRampEditor";

type AdvancedSettingsPanelProps = {
  duration: number;
  resolution: string;
  videoCount: number;
  durations: number[];
  resolutions: string[];
  onDuration: (d: number) => void;
  onResolution: (r: string) => void;
  onVideoCount: (n: number) => void;
};

const PARAM_OPTIONS = {
  camera: ["Statisch", "Pan links", "Pan rechts", "Zoom in", "Zoom out", "Orbit"],
  shot: ["Medium Shot", "Close-Up", "Wide Shot", "Over-the-Shoulder"],
  expression: ["Neutral", "Freudig", "Dramatisch", "Nachdenklich"],
  atmosphere: ["Cinematic", "Dreamy", "Gritty", "Clean"],
  light: ["Natürlich", "Neon", "Golden Hour", "Studio"],
  effect: ["Keine", "Film Grain", "Lens Flare", "Motion Blur"],
};

function ParamSelect({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-white/25">{label}</span>
      <select className="rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/70 outline-none focus:border-white/20">
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

export function AdvancedSettingsPanel({
  duration,
  resolution,
  videoCount,
  durations,
  resolutions,
  onDuration,
  onResolution,
  onVideoCount,
}: AdvancedSettingsPanelProps) {
  const [open, setOpen] = useState(false);

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
          <SpeedRampEditor />
          <div className="grid grid-cols-2 gap-3">
            <ParamSelect label="Kamerabewegung" options={PARAM_OPTIONS.camera} />
            <ParamSelect label="Shot Type" options={PARAM_OPTIONS.shot} />
            <ParamSelect label="Expression" options={PARAM_OPTIONS.expression} />
            <ParamSelect label="Atmosphere" options={PARAM_OPTIONS.atmosphere} />
            <ParamSelect label="Light" options={PARAM_OPTIONS.light} />
            <ParamSelect label="Effect Enhance" options={PARAM_OPTIONS.effect} />
          </div>
          <PillGroup label="Dauer" value={duration} options={durations} onChange={onDuration} />
          <PillGroup
            label="Auflösung"
            value={resolution}
            options={resolutions}
            onChange={onResolution}
          />
          <PillGroup
            label="Video-Anzahl"
            value={videoCount}
            options={[1, 2, 4]}
            onChange={onVideoCount}
          />
        </div>
      )}
    </div>
  );
}
