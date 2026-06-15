"use client";

/**
 * SettingsPanel — rechte Einstellungs-Sidebar.
 *
 * Konditionell:
 *  image-gen  → Modell-Preset · Seitenverhältnis · CFG · Steps
 *  ugc-video  → Video-Format · KI-Sprecher · Optionen
 *  Text-Tools → leerer Zustand
 *
 * Jede Änderung feuert onSettingsChange() sofort mit dem aktuellen
 * Gesamt-Objekt, damit DashboardLayout die API-Params live parat hat.
 */

import { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  SlidersHorizontal,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Mic2,
  Captions,
  Music2,
  Clapperboard,
  Sparkles,
  Plus,
  X,
  Check,
  BookmarkCheck,
} from "lucide-react";
import type { ToolId } from "./DashboardLayout";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ImageGenSettings {
  model: string;
  aspectRatio: "1:1" | "16:9" | "9:16";
  cfgScale: number;
  steps: number;
}

export interface UgcVideoSettings {
  videoFormat: "tiktok-reels" | "youtube-longform";
  voice: string;
  subtitles: boolean;
  audiobed: boolean;
}

/** fal.ai Kling / Nano Banana Video Settings */
export interface FalVideoSettings {
  model: "kling-v3-pro" | "kling-v2.5-turbo" | "kling-v2-master";
  durationSeconds: 5 | 10;
  aspectRatio: "9:16" | "16:9" | "1:1";
}

export type ToolSettings = ImageGenSettings | UgcVideoSettings | FalVideoSettings;

// Tools die das Bild-Panel zeigen
const IMAGE_TOOL_IDS = new Set<ToolId>(["image-gen", "img-to-img"]);
// Tools die das fal.ai Video-Panel zeigen
const FAL_VIDEO_TOOL_IDS = new Set<ToolId>(["img-to-video", "text-to-video"]);
// Tools die das UGC-Video-Panel zeigen
const UGC_VIDEO_TOOL_IDS = new Set<ToolId>(["ecommerce-ads"]);

interface SettingsPanelProps {
  activeTool: ToolId;
  onSettingsChange: (settings: ToolSettings) => void;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const IMG_DEFAULTS: ImageGenSettings = {
  model: "nano-banana-2",
  aspectRatio: "9:16",
  cfgScale: 7,
  steps: 30,
};

const VID_DEFAULTS: UgcVideoSettings = {
  videoFormat: "tiktok-reels",
  voice: "max-dynamisch",
  subtitles: true,
  audiobed: false,
};

const FAL_VIDEO_DEFAULTS: FalVideoSettings = {
  model: "kling-v3-pro",
  durationSeconds: 5,
  aspectRatio: "9:16",
};

// ─── Shared primitives ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div
      className="my-5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    />
  );
}

/** Thin-line range slider — Krea style */
function SettingsSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-white/40">{label}</span>
        <span className="min-w-[2ch] text-right font-mono text-xs font-semibold text-white/60">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-[2px] w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:outline-none"
        style={{
          background: `linear-gradient(to right, rgba(255,255,255,0.55) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
        }}
      />
    </div>
  );
}

/** Flat select — Krea style */
function SettingsSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-neutral-950 p-2 text-xs text-neutral-300 outline-none transition-colors hover:border-white/20 focus:border-indigo-500/50"
      style={{ background: "#0a0a0a" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#111" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Minimal toggle switch */
function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.025]"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex min-w-0 items-start gap-2">
        {icon && (
          <span className="mt-0.5 shrink-0 text-white/25">{icon}</span>
        )}
        <div className="min-w-0">
          <p className="text-xs text-white/55">{label}</p>
          {description && (
            <p className="mt-0.5 text-[10px] text-white/20">{description}</p>
          )}
        </div>
      </div>

      {/* Track */}
      <div
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
        style={{
          background: checked
            ? "rgba(99,102,241,0.30)"
            : "rgba(255,255,255,0.08)",
          border: checked
            ? "1px solid rgba(99,102,241,0.45)"
            : "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full shadow transition-all duration-200"
          style={{
            left: checked ? "calc(100% - 18px)" : "2px",
            background: checked ? "#818cf8" : "rgba(255,255,255,0.28)",
          }}
        />
      </div>
    </button>
  );
}

// ─── Image-Gen Settings ──────────────────────────────────────────────────────

const IMAGE_MODELS: { value: string; label: string; sub: string; badge?: string }[] = [
  {
    value: "nano-banana-2",
    label: "Nano Banana 2",
    sub: "Google SOTA · Ultra-schnell",
    badge: "Empfohlen",
  },
  {
    value: "nano-banana-pro",
    label: "Nano Banana Pro",
    sub: "Exzellentes Text-Rendering im Bild",
  },
  {
    value: "flux-2-pro",
    label: "Flux 2 Pro",
    sub: "Premium Foto-Qualität",
  },
];

const ASPECT_RATIOS: {
  value: ImageGenSettings["aspectRatio"];
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "1:1",  label: "1 : 1",  icon: <Square size={13} /> },
  { value: "16:9", label: "16 : 9", icon: <RectangleHorizontal size={13} /> },
  { value: "9:16", label: "9 : 16", icon: <RectangleVertical size={13} /> },
];

function ImageGenPanel({
  s,
  patch,
}: {
  s: ImageGenSettings;
  patch: (p: Partial<ImageGenSettings>) => void;
}) {
  return (
    <>
      {/* Modell-Preset */}
      <section>
        <SectionLabel>fal.ai Modell</SectionLabel>
        <div className="grid grid-cols-1 gap-1.5">
          {IMAGE_MODELS.map((m) => {
            const active = s.model === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => patch({ model: m.value })}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all"
                style={{
                  background: active ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                  border: active ? "1px solid rgba(99,102,241,0.32)" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Sparkles size={11} style={{ color: active ? "#818cf8" : "rgba(255,255,255,0.20)", flexShrink: 0 }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium" style={{ color: active ? "#c7d2fe" : "rgba(255,255,255,0.45)" }}>
                      {m.label}
                    </span>
                    {m.badge && (
                      <span className="rounded px-1 text-[9px] font-semibold"
                        style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc" }}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/20">{m.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* Seitenverhältnis */}
      <section>
        <SectionLabel>Seitenverhältnis</SectionLabel>
        <div className="grid grid-cols-3 gap-1.5">
          {ASPECT_RATIOS.map((ar) => {
            const active = s.aspectRatio === ar.value;
            return (
              <button
                key={ar.value}
                type="button"
                onClick={() => patch({ aspectRatio: ar.value })}
                className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all"
                style={{
                  background: active
                    ? "rgba(99,102,241,0.10)"
                    : "rgba(255,255,255,0.025)",
                  border: active
                    ? "1px solid rgba(99,102,241,0.28)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: active ? "#818cf8" : "rgba(255,255,255,0.28)",
                }}
              >
                {ar.icon}
                <span className="text-[10px] font-semibold tracking-wide">
                  {ar.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* Parameter Sliders */}
      <section>
        <SectionLabel>Parameter</SectionLabel>
        <div className="space-y-5">
          <SettingsSlider
            label="Kreative Freiheit (CFG Scale)"
            value={s.cfgScale}
            min={1}
            max={20}
            onChange={(v) => patch({ cfgScale: v })}
          />
          <SettingsSlider
            label="Qualität / Schritte (Steps)"
            value={s.steps}
            min={10}
            max={50}
            onChange={(v) => patch({ steps: v })}
          />
        </div>
      </section>
    </>
  );
}

// ─── UGC-Video Settings ──────────────────────────────────────────────────────

const VIDEO_FORMATS: {
  value: UgcVideoSettings["videoFormat"];
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "tiktok-reels",
    label: "TikTok / Reels",
    sub: "9 : 16 · Hochformat",
    icon: <RectangleVertical size={13} />,
  },
  {
    value: "youtube-longform",
    label: "YouTube Longform",
    sub: "16 : 9 · Querformat",
    icon: <RectangleHorizontal size={13} />,
  },
];

const VOICE_OPTIONS = [
  { value: "max-dynamisch",       label: "Max — Dynamisch" },
  { value: "anna-professionell",  label: "Anna — Professionell" },
  { value: "leon-jugendlich",     label: "Leon — Jugendlich" },
  { value: "sophie-warm",         label: "Sophie — Warm" },
  { value: "markus-autoritaer",   label: "Markus — Autoritär" },
];

function UgcVideoPanel({
  s,
  patch,
}: {
  s: UgcVideoSettings;
  patch: (p: Partial<UgcVideoSettings>) => void;
}) {
  return (
    <>
      {/* Video-Format */}
      <section>
        <SectionLabel>Video-Format</SectionLabel>
        <div className="space-y-1.5">
          {VIDEO_FORMATS.map((f) => {
            const active = s.videoFormat === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => patch({ videoFormat: f.value })}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                style={{
                  background: active
                    ? "rgba(99,102,241,0.10)"
                    : "rgba(255,255,255,0.02)",
                  border: active
                    ? "1px solid rgba(99,102,241,0.28)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className="shrink-0 transition-colors"
                  style={{
                    color: active ? "#818cf8" : "rgba(255,255,255,0.25)",
                  }}
                >
                  {f.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-xs font-medium transition-colors"
                    style={{
                      color: active ? "#c7d2fe" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {f.label}
                  </p>
                  <p className="text-[10px] text-white/20">{f.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* KI-Sprecher */}
      <section>
        <SectionLabel>
          <span className="flex items-center gap-1.5">
            <Mic2 size={10} />
            KI-Sprecher (Voiceover)
          </span>
        </SectionLabel>
        <SettingsSelect
          value={s.voice}
          onChange={(v) => patch({ voice: v })}
          options={VOICE_OPTIONS}
        />
      </section>

      <Divider />

      {/* Optionen */}
      <section>
        <SectionLabel>Optionen</SectionLabel>
        <div className="space-y-2">
          <Toggle
            checked={s.subtitles}
            onChange={(v) => patch({ subtitles: v })}
            label="Automatische Untertitel"
            description="Transkription via Whisper"
            icon={<Captions size={12} />}
          />
          <Toggle
            checked={s.audiobed}
            onChange={(v) => patch({ audiobed: v })}
            label="Hintergrundmusik"
            description="KI-generiertes Audio-Bed"
            icon={<Music2 size={12} />}
          />
        </div>
      </section>
    </>
  );
}

// ─── fal.ai Kling Video Settings ─────────────────────────────────────────────

const KLING_MODELS: {
  value: FalVideoSettings["model"];
  label: string;
  sub: string;
  badge?: string;
}[] = [
  { value: "kling-v3-pro",      label: "Kling 3.0 Pro",     sub: "Native 4K · Kinofilm-Physik",        badge: "4K" },
  { value: "kling-v2.5-turbo",  label: "Kling 2.5 Turbo",   sub: "Ultra-schnelles Rendern"                    },
  { value: "kling-v2-master",   label: "Kling 2.0 Master",  sub: "Erhöhte Bewegungskonsistenz"               },
];

const VIDEO_ASPECT_RATIOS: {
  value: FalVideoSettings["aspectRatio"];
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "9:16", label: "9 : 16", icon: <RectangleVertical size={13} /> },
  { value: "16:9", label: "16 : 9", icon: <RectangleHorizontal size={13} /> },
  { value: "1:1",  label: "1 : 1",  icon: <Square size={13} /> },
];

function FalVideoPanel({
  s,
  patch,
}: {
  s: FalVideoSettings;
  patch: (p: Partial<FalVideoSettings>) => void;
}) {
  return (
    <>
      {/* Kling Engine */}
      <section>
        <SectionLabel>fal.ai Video-Engine</SectionLabel>
        <div className="grid grid-cols-1 gap-1.5">
          {KLING_MODELS.map((m) => {
            const active = s.model === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => patch({ model: m.value })}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all"
                style={{
                  background: active ? "rgba(139,93,255,0.12)" : "rgba(255,255,255,0.02)",
                  border:     active ? "1px solid rgba(139,93,255,0.32)" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Sparkles size={11} style={{ color: active ? "#a78bfa" : "rgba(255,255,255,0.20)", flexShrink: 0 }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium" style={{ color: active ? "#ddd6fe" : "rgba(255,255,255,0.45)" }}>
                      {m.label}
                    </span>
                    {m.badge && (
                      <span className="rounded px-1 text-[9px] font-semibold"
                        style={{ background: "rgba(139,93,255,0.20)", color: "#c4b5fd" }}>
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/20">{m.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* Seitenverhältnis */}
      <section>
        <SectionLabel>Seitenverhältnis</SectionLabel>
        <div className="grid grid-cols-3 gap-1.5">
          {VIDEO_ASPECT_RATIOS.map((ar) => {
            const active = s.aspectRatio === ar.value;
            return (
              <button
                key={ar.value}
                type="button"
                onClick={() => patch({ aspectRatio: ar.value })}
                className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition-all"
                style={{
                  background: active ? "rgba(139,93,255,0.10)" : "rgba(255,255,255,0.025)",
                  border:     active ? "1px solid rgba(139,93,255,0.28)" : "1px solid rgba(255,255,255,0.07)",
                  color:      active ? "#a78bfa" : "rgba(255,255,255,0.28)",
                }}
              >
                {ar.icon}
                <span className="text-[10px] font-semibold tracking-wide">{ar.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* Videodauer — Kling unterstützt 5 s und 10 s */}
      <section>
        <SectionLabel>
          <span className="flex items-center justify-between">
            <span>Videodauer</span>
            <span className="font-mono text-[11px] font-semibold text-white/50">
              {s.durationSeconds}s
            </span>
          </span>
        </SectionLabel>

        {/* Segmented 5 / 10 toggle */}
        <div
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {([5, 10] as const).map((sec) => {
            const active = s.durationSeconds === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => patch({ durationSeconds: sec })}
                className="flex-1 rounded-md py-1.5 text-xs font-medium transition-all"
                style={{
                  background: active ? "rgba(139,93,255,0.18)" : "transparent",
                  border:     active ? "1px solid rgba(139,93,255,0.30)" : "1px solid transparent",
                  color:      active ? "#ddd6fe" : "rgba(255,255,255,0.32)",
                }}
              >
                {sec} Sek.
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-white/16">
          Kling API — offizielle Standardwerte (5 s / 10 s)
        </p>
      </section>
    </>
  );
}

// ─── Saved Presets ───────────────────────────────────────────────────────────

interface SavedPreset {
  id: string;
  name: string;
  values: ToolSettings;
}

const IMG_DUMMY_PRESETS: SavedPreset[] = [
  {
    id: "p1",
    name: "Epic Cinematic 16:9",
    values: { model: "ultra-realism", aspectRatio: "16:9", cfgScale: 12, steps: 45 } as ImageGenSettings,
  },
  {
    id: "p2",
    name: "Hyperreal Portrait 1:1",
    values: { model: "krea-2-large",  aspectRatio: "1:1",  cfgScale: 8,  steps: 35 } as ImageGenSettings,
  },
];

const VID_DUMMY_PRESETS: SavedPreset[] = [
  {
    id: "p3",
    name: "Viral TikTok — Auto-Sub",
    values: { videoFormat: "tiktok-reels", voice: "max-dynamisch", subtitles: true,  audiobed: false } as UgcVideoSettings,
  },
  {
    id: "p4",
    name: "YouTube Long — Musik",
    values: { videoFormat: "youtube-longform", voice: "anna-professionell", subtitles: false, audiobed: true } as UgcVideoSettings,
  },
];

interface PresetsSectionProps {
  isImage: boolean;
  isVideo: boolean;
  currentValues: ToolSettings | null;
  onApply: (values: ToolSettings) => void;
}

function PresetsSection({ isImage, isVideo, currentValues, onApply }: PresetsSectionProps) {
  const initialPresets = isImage ? IMG_DUMMY_PRESETS : isVideo ? VID_DUMMY_PRESETS : [];
  const [presets, setPresets]         = useState<SavedPreset[]>(initialPresets);
  const [isAdding, setIsAdding]       = useState(false);
  const [newName,  setNewName]        = useState("");
  const [savedId,  setSavedId]        = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset when tool type changes
  useEffect(() => {
    setPresets(isImage ? IMG_DUMMY_PRESETS : isVideo ? VID_DUMMY_PRESETS : []);
    setIsAdding(false);
    setNewName("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImage, isVideo]);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const handleSave = useCallback(() => {
    const name = newName.trim();
    if (!name || !currentValues) return;
    const id = Date.now().toString();
    setPresets((prev) => [{ id, name, values: currentValues }, ...prev]);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1800);
    setIsAdding(false);
    setNewName("");
  }, [newName, currentValues]);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  if (!isImage && !isVideo) return null;

  return (
    <div
      className="mt-4 pt-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Header row */}
      <div className="mb-2.5 flex items-center justify-between">
        <SectionLabel>Meine Presets</SectionLabel>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          title="Preset speichern"
          className="flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-white/8"
          style={{
            color: isAdding ? "#818cf8" : "rgba(255,255,255,0.28)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {isAdding ? <X size={10} /> : <Plus size={10} />}
        </button>
      </div>

      {/* Inline name input */}
      {isAdding && (
        <div className="mb-2.5 flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setIsAdding(false); setNewName(""); }
            }}
            placeholder="Preset-Name…"
            maxLength={32}
            className="flex-1 rounded-lg border px-2.5 py-1.5 text-[11px] text-neutral-200 placeholder-neutral-600 outline-none transition-colors focus:border-indigo-500/40"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!newName.trim()}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all disabled:opacity-30"
            style={{
              background: "rgba(99,102,241,0.18)",
              border: "1px solid rgba(99,102,241,0.28)",
              color: "#a5b4fc",
            }}
          >
            Sichern
          </button>
        </div>
      )}

      {/* Preset list */}
      {presets.length === 0 && !isAdding ? (
        <p className="text-[10px] text-white/18">Noch keine Presets gespeichert.</p>
      ) : (
        <div className="space-y-1.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApply(preset.values)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left transition-all hover:border-white/10 hover:text-white"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                {savedId === preset.id ? (
                  <Check size={9} className="shrink-0 text-green-400" />
                ) : (
                  <BookmarkCheck size={9} className="shrink-0 opacity-40" />
                )}
                <span className="truncate text-[10px]">{preset.name}</span>
              </div>
              <span
                className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                onClick={(e) => handleDelete(e, preset.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleDelete(e as unknown as React.MouseEvent, preset.id); }}
                style={{ color: "rgba(255,255,255,0.20)" }}
              >
                <X size={9} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Clapperboard size={15} className="text-white/18" />
      </div>
      <div>
        <p className="text-xs font-medium text-white/22">Keine Einstellungen</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/14">
          Keine erweiterten Einstellungen
          <br />
          für Text-Tools.
        </p>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export const SettingsPanel = memo(function SettingsPanel({
  activeTool,
  onSettingsChange,
}: SettingsPanelProps) {
  const isImage    = IMAGE_TOOL_IDS.has(activeTool);
  const isFalVideo = FAL_VIDEO_TOOL_IDS.has(activeTool);
  const isUgcVideo = UGC_VIDEO_TOOL_IDS.has(activeTool);
  const isVisual   = isImage || isFalVideo || isUgcVideo;

  const [imgSettings, setImgSettings]    = useState<ImageGenSettings>(IMG_DEFAULTS);
  const [vidSettings, setVidSettings]    = useState<UgcVideoSettings>(VID_DEFAULTS);
  const [falSettings, setFalSettings]    = useState<FalVideoSettings>(FAL_VIDEO_DEFAULTS);

  const patchImg = useCallback((p: Partial<ImageGenSettings>) => {
    setImgSettings((prev) => { const next = { ...prev, ...p }; onSettingsChange(next); return next; });
  }, [onSettingsChange]);

  const patchVid = useCallback((p: Partial<UgcVideoSettings>) => {
    setVidSettings((prev) => { const next = { ...prev, ...p }; onSettingsChange(next); return next; });
  }, [onSettingsChange]);

  const patchFal = useCallback((p: Partial<FalVideoSettings>) => {
    setFalSettings((prev) => { const next = { ...prev, ...p }; onSettingsChange(next); return next; });
  }, [onSettingsChange]);

  // Feed parent with defaults whenever the active tool changes
  useEffect(() => {
    if (isImage)    onSettingsChange(imgSettings);
    if (isFalVideo) onSettingsChange(falSettings);
    if (isUgcVideo) onSettingsChange(vidSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // Apply a saved preset
  const handleApplyPreset = useCallback((values: ToolSettings) => {
    if (isImage)    { setImgSettings(values as ImageGenSettings); onSettingsChange(values); }
    if (isFalVideo) { setFalSettings(values as FalVideoSettings); onSettingsChange(values); }
    if (isUgcVideo) { setVidSettings(values as UgcVideoSettings); onSettingsChange(values); }
  }, [isImage, isFalVideo, isUgcVideo, onSettingsChange]);

  // Footer summary
  const summary = isImage
    ? `${IMAGE_MODELS.find((m) => m.value === imgSettings.model)?.label ?? ""} · ${imgSettings.aspectRatio} · CFG ${imgSettings.cfgScale}`
    : isFalVideo
    ? `${KLING_MODELS.find((m) => m.value === falSettings.model)?.label ?? ""} · ${falSettings.aspectRatio} · ${falSettings.durationSeconds}s`
    : isUgcVideo
    ? `${VIDEO_FORMATS.find((f) => f.value === vidSettings.videoFormat)?.label ?? ""} · ${VOICE_OPTIONS.find((v) => v.value === vidSettings.voice)?.label ?? ""}`
    : null;

  const currentValues: ToolSettings | null = isImage ? imgSettings : isFalVideo ? falSettings : isUgcVideo ? vidSettings : null;

  const headerLabel = isImage ? "Bild-Einstellungen" : isFalVideo ? "Kling Video-Engine" : isUgcVideo ? "Video-Einstellungen" : "Einstellungen";

  return (
    <aside className="flex h-full flex-col" style={{ background: "#111111" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <SlidersHorizontal size={13} className="text-white/22" />
        <p className="text-xs font-semibold text-white/35">{headerLabel}</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5" style={{ scrollbarWidth: "none" }}>
        {isImage ? (
          <>
            <ImageGenPanel s={imgSettings} patch={patchImg} />
            <PresetsSection isImage={isImage} isVideo={isUgcVideo} currentValues={currentValues} onApply={handleApplyPreset} />
          </>
        ) : isFalVideo ? (
          <>
            <FalVideoPanel s={falSettings} patch={patchFal} />
            <PresetsSection isImage={false} isVideo={true} currentValues={currentValues} onApply={handleApplyPreset} />
          </>
        ) : isUgcVideo ? (
          <>
            <UgcVideoPanel s={vidSettings} patch={patchVid} />
            <PresetsSection isImage={false} isVideo={true} currentValues={currentValues} onApply={handleApplyPreset} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Footer */}
      {summary && (
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="truncate text-center text-[10px] text-white/15">{summary}</p>
        </div>
      )}
    </aside>
  );
});
