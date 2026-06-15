"use client";

/**
 * AgentBox — Tool-Formular + Claude Echtzeit-Streaming via /api/agent.
 *
 * DATENFLUSS (Text-Tools):
 *   Formular → buildPrompt() → POST /api/agent { message }
 *   → SSE Events { type: "text_delta", text } → output State (chunk by chunk)
 *   → onActionExecute(tool, finalOutput) am Ende
 *
 * AUSNAHME (Medien-Tools):
 *   image-gen / ugc-video → direkt onActionExecute() → kein Claude-Stream
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  memo,
  type FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Sparkles,
  Zap,
  Calendar,
  TrendingUp,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertCircle,
  Film,
  Upload,
  ImageIcon,
  SendHorizonal,
  Bot,
  ArrowRight,
} from "lucide-react";
import type { ToolId } from "./DashboardLayout";
import {
  optimizeUserPrompt,
  calculateExactCredits,
  formatCreditCost,
  type OptimizedPromptResult,
} from "@/lib/dashboard/promptOptimizer";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AgentBoxProps {
  activeTool: ToolId;
  /** Aktuelle Tool-Einstellungen aus SettingsPanel (für Credit-Berechnung & Prompt-Optimierung) */
  toolSettings?: Record<string, unknown> | null;
  /** Aktuelle Credits des Nutzers (für Disabled-State des Buttons) */
  currentCredits?: number;
  /**
   * Wird aufgerufen wenn:
   * - Medien-Tool: sofort bei Submit mit formValues
   * - Text-Tool: am Ende des Streams mit der fertigen Ausgabe
   */
  onActionExecute: (tool: ToolId, payload: string) => Promise<void>;
  /**
   * Copilot-Navigation: AgentBox erkennt Intent und ruft diese Funktion auf,
   * um das Dashboard zu einem anderen Tool zu wechseln.
   */
  onNavigate?: (toolId: ToolId) => void;
}

// ---------------------------------------------------------------------------
// Form-State-Typen
// ---------------------------------------------------------------------------

interface ViralHookValues {
  thema: string;
  tonalitaet: "neugierig" | "fordernd" | "provokant" | "emotional" | "story";
}

interface ContentCalendarValues {
  thema: string;
  plattformen: string[];
}

interface TrendScriptValues {
  trendLink: string;
  laenge: "30 Sekunden" | "60 Sekunden" | "90 Sekunden" | "3 Minuten";
}

interface ImgToVideoValues {
  startFrameUrl: string;   // object-URL or CDN URL
  endFrameUrl: string;     // optional
  motionPrompt: string;
}

type FormValues = ViralHookValues | ContentCalendarValues | TrendScriptValues | ImgToVideoValues;

const DEFAULTS: Record<string, FormValues> = {
  "viral-hook":       { thema: "", tonalitaet: "neugierig" } satisfies ViralHookValues,
  "content-calendar": { thema: "", plattformen: ["TikTok"] } satisfies ContentCalendarValues,
  "trend-script":     { trendLink: "", laenge: "60 Sekunden" } satisfies TrendScriptValues,
  "img-to-video":     { startFrameUrl: "", endFrameUrl: "", motionPrompt: "" } satisfies ImgToVideoValues,
};

const MEDIA_TOOLS = new Set<ToolId>(["image-gen", "ecommerce-ads", "img-to-video", "text-to-video", "video-to-video"]);

// ---------------------------------------------------------------------------
// Prompt-Builder — Single source of truth für alle Claude-Prompts
// ---------------------------------------------------------------------------

function buildPrompt(tool: ToolId, values: FormValues): string {
  switch (tool) {
    case "viral-hook": {
      const v = values as ViralHookValues;
      return `Schreibe 5 virale Hooks für die Nische "${v.thema || "[Nische]"}". Der Tonfall soll absolut ${v.tonalitaet} sein. Nutze das AIDA-Prinzip und mache jeden Hook maximal scroll-stoppend. Gib jeden Hook nummeriert aus, maximal 2 Sätze pro Hook. Nur die Hooks, kein Intro oder Outro.`;
    }
    case "content-calendar": {
      const v = values as ContentCalendarValues;
      const platforms = v.plattformen.length > 0 ? v.plattformen.join(", ") : "[Plattform]";
      return `Erstelle einen 7-Tage-Content-Kalender für das Thema "${v.thema || "[Thema]"}" optimiert für die Plattformen: ${platforms}. Für jeden Tag: Wochentag, Content-Format (Reel/Post/Story), konkreten Hook, optimale Uhrzeit. Ausgabe als strukturierte Liste, kein Intro, kein Outro.`;
    }
    case "trend-script": {
      const v = values as TrendScriptValues;
      return `Schreibe ein exakt ${v.laenge} langes Video-Skript basierend auf diesem Trend/Thema: ${v.trendLink || "[Trend-Link oder Thema]"}. Struktur: Hook (3s) → Kern-Aussage → 3 Hauptpunkte → CTA. Markiere Pausen mit [PAUSE] und Schnitte mit [SCHNITT]. Kein Intro, direkt das Skript.`;
    }
    case "img-to-video": {
      const v = values as ImgToVideoValues;
      // JSON-Payload — DashboardLayout parst dies und extrahiert URLs + Prompt
      return JSON.stringify({
        startFrameUrl: v.startFrameUrl || null,
        endFrameUrl:   v.endFrameUrl   || null,
        motionPrompt:  v.motionPrompt  || "",
      });
    }
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// /api/agent SSE-Consumer
// Parst AgentStreamEvents: { type: "text_delta", text: string }
// ---------------------------------------------------------------------------

type AgentStreamEvent =
  | { type: "estimate"; min: number; max: number; typical: number; label: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; tool: string; label: string }
  | { type: "tool_done"; tool: string }
  | { type: "insight"; insight: unknown }
  | { type: "outputs"; outputs: unknown[] }
  | { type: "error"; message: string }
  | { type: "done" };

async function consumeAgentStream(
  res: Response,
  onText: (chunk: string) => void,
  onError: (msg: string) => void,
  signal: AbortSignal
): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("Kein Stream-Body erhalten.");

  // Sofort reader canceln wenn Signal feuert (kein Memory-Leak)
  const onAbort = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", onAbort, { once: true });

  const decoder = new TextDecoder();
  let buffer   = "";
  let fullText = "";

  try {
    while (true) {
      if (signal.aborted) break;

      let done: boolean;
      let value: Uint8Array | undefined;
      try {
        ({ done, value } = await reader.read());
      } catch {
        // reader.cancel() wirft — normaler Abbruch
        break;
      }
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;

        let evt: AgentStreamEvent;
        try {
          evt = JSON.parse(raw) as AgentStreamEvent;
        } catch {
          continue; // unvollständiger JSON-Chunk → überspringen
        }

        switch (evt.type) {
          case "text_delta":
            onText(evt.text);
            fullText += evt.text;
            break;
          case "error":
            onError(evt.message ?? "Agent-Fehler aufgetreten.");
            break;
          default:
            break;
        }
      }
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }

  return fullText;
}

// ---------------------------------------------------------------------------
// Shared UI-Primitives — absolut flach, rahmenlos, Krea-Stil
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Krea-Design Primitives — naked, borderless, editorial
// ---------------------------------------------------------------------------

/** Nacktes Textarea — kein Hintergrund, kein Rahmen. Reines Schreibprogramm-Feeling. */
function NakedTextarea({
  value, onChange, placeholder, disabled,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-20 w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-neutral-200 placeholder:text-neutral-600 focus:outline-none disabled:opacity-40"
    />
  );
}

/** Platform-Links als winzige Text-Links nebeneinander. */
function PlatformLinks({
  options, selected, onChange, disabled,
}: {
  options: string[]; selected: string[];
  onChange: (v: string[]) => void; disabled?: boolean;
}) {
  const toggle = (opt: string) => {
    if (disabled) return;
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt} type="button" disabled={disabled}
            onClick={() => toggle(opt)}
            className={`cursor-pointer px-1 font-mono text-[10px] tracking-wider transition-colors disabled:opacity-30 ${
              active
                ? "font-semibold text-neutral-200"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** Minimaler Inline-Select — für Tonalität / Länge als Meta-Zeile. */
function TinySelect({
  value, onChange, options, disabled,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="cursor-pointer appearance-none bg-transparent pr-5 font-mono text-[11px] tracking-wider text-neutral-500 outline-none transition-colors hover:text-neutral-300 disabled:opacity-30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#111" }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-neutral-600" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool-Formulare — monolithisch, labellos, editorial
// ---------------------------------------------------------------------------

/** Gemeinsame Bottom-Aktionszeile: optionales linkes Element + ActionButton */
function FormActionRow({
  left, loading, disabled, creditCost, canAfford,
}: {
  left?: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  creditCost: number;
  canAfford: boolean;
}) {
  const notAffordable = !canAfford && !loading;
  const isDisabled    = disabled || loading || notAffordable;
  const isActive      = !isDisabled;

  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">{left}</div>
      <button
        type="submit"
        disabled={isDisabled}
        className={`shrink-0 rounded px-3.5 py-1.5 text-[11px] font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
          isActive
            ? "bg-[#ccff00] text-black hover:opacity-90"
            : "border border-white/5 bg-transparent text-neutral-500"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }} className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> Generiert…
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }} className="flex items-center gap-1.5">
              {notAffordable
                ? <><AlertCircle size={11} /> Credits</>
                : <><Sparkles size={11} /> {formatCreditCost(creditCost)}</>
              }
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

function ViralHookForm({ values, onChange, disabled, loading, creditCost, canAfford }: {
  values: ViralHookValues;
  onChange: (v: Partial<ViralHookValues>) => void;
  disabled: boolean;
  loading: boolean;
  creditCost: number;
  canAfford: boolean;
}) {
  return (
    <div>
      <NakedTextarea
        value={values.thema}
        onChange={(v) => onChange({ thema: v })}
        placeholder="Nische oder Thema eingeben…"
        disabled={disabled}
      />
      <FormActionRow
        loading={loading}
        disabled={!values.thema.trim()}
        creditCost={creditCost}
        canAfford={canAfford}
        left={
          <TinySelect
            value={values.tonalitaet}
            onChange={(v) => onChange({ tonalitaet: v as ViralHookValues["tonalitaet"] })}
            options={[
              { value: "neugierig", label: "Neugierig" },
              { value: "fordernd",  label: "Fordernd" },
              { value: "provokant", label: "Provokant" },
              { value: "emotional", label: "Emotional" },
              { value: "story",     label: "Story" },
            ]}
            disabled={disabled}
          />
        }
      />
    </div>
  );
}

function ContentCalendarForm({ values, onChange, disabled, loading, creditCost, canAfford }: {
  values: ContentCalendarValues;
  onChange: (v: Partial<ContentCalendarValues>) => void;
  disabled: boolean;
  loading: boolean;
  creditCost: number;
  canAfford: boolean;
}) {
  return (
    <div>
      <NakedTextarea
        value={values.thema}
        onChange={(v) => onChange({ thema: v })}
        placeholder="Thema oder Nische eingeben…"
        disabled={disabled}
      />
      <FormActionRow
        loading={loading}
        disabled={!values.thema.trim()}
        creditCost={creditCost}
        canAfford={canAfford}
        left={
          <PlatformLinks
            options={["TikTok", "Instagram", "YouTube Shorts", "LinkedIn", "Twitter / X"]}
            selected={values.plattformen}
            onChange={(v) => onChange({ plattformen: v })}
            disabled={disabled}
          />
        }
      />
    </div>
  );
}

function TrendScriptForm({ values, onChange, disabled, loading, creditCost, canAfford }: {
  values: TrendScriptValues;
  onChange: (v: Partial<TrendScriptValues>) => void;
  disabled: boolean;
  loading: boolean;
  creditCost: number;
  canAfford: boolean;
}) {
  return (
    <div>
      <NakedTextarea
        value={values.trendLink}
        onChange={(v) => onChange({ trendLink: v })}
        placeholder="TikTok-URL, YouTube-Link oder Trend-Thema…"
        disabled={disabled}
      />
      <FormActionRow
        loading={loading}
        disabled={!values.trendLink.trim()}
        creditCost={creditCost}
        canAfford={canAfford}
        left={
          <TinySelect
            value={values.laenge}
            onChange={(v) => onChange({ laenge: v as TrendScriptValues["laenge"] })}
            options={[
              { value: "30 Sekunden", label: "30 Sek" },
              { value: "60 Sekunden", label: "60 Sek" },
              { value: "90 Sekunden", label: "90 Sek" },
              { value: "3 Minuten",   label: "3 Min" },
            ]}
            disabled={disabled}
          />
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FrameDropzone — single image drop + click-upload zone
// ---------------------------------------------------------------------------

function FrameDropzone({
  label,
  sublabel,
  value,
  required,
  disabled,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: string;       // object-URL or empty
  required?: boolean;
  disabled: boolean;
  onChange: (url: string) => void;
}) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const acceptFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange(url);
  }, [onChange]);

  return (
    <div className="flex-1 min-w-0">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.28)" }}>
        {label}
        {required && <span className="ml-1 text-red-400/70">*</span>}
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} hochladen`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          acceptFile(e.dataTransfer.files[0]);
        }}
        className="relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl transition-all"
        style={{
          background:  drag ? "rgba(204,255,0,0.04)" : "#080808",
          border:      drag
            ? "1px solid rgba(204,255,0,0.30)"
            : value
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px dashed rgba(255,255,255,0.08)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {value ? (
          <>
            {/* Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
            {/* Replace overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity hover:opacity-100">
              <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                style={{ background: "rgba(0,0,0,0.70)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <Upload size={11} className="text-white/60" />
                <span className="text-[11px] text-white/60">Ersetzen</span>
              </div>
            </div>
            {/* Clear button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/50 transition-colors hover:text-white"
            >
              <X size={11} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-3 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <ImageIcon size={14} className="text-white/25" />
            </div>
            <p className="text-[10px] leading-relaxed text-white/22">{sublabel}</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => acceptFile(e.target.files?.[0])}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImgToVideoForm — Kling v3 Keyframe UI
// ---------------------------------------------------------------------------

function ImgToVideoForm({
  values,
  onChange,
  disabled,
}: {
  values: ImgToVideoValues;
  onChange: (patch: Partial<ImgToVideoValues>) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Keyframe Dropzones */}
      <div className="flex gap-3">
        <FrameDropzone
          label="Start-Bild"
          sublabel="Erster Frame — Klicken oder Bild hineinziehen"
          value={values.startFrameUrl}
          required
          disabled={disabled}
          onChange={(url) => onChange({ startFrameUrl: url })}
        />
        <FrameDropzone
          label="End-Bild (Optional)"
          sublabel="Letzter Frame — steuert das Ziel der Animation"
          value={values.endFrameUrl}
          disabled={disabled}
          onChange={(url) => onChange({ endFrameUrl: url })}
        />
      </div>

      {/* Motion Prompt */}
      <NakedTextarea
        value={values.motionPrompt}
        onChange={(v) => onChange({ motionPrompt: v })}
        placeholder="Bewegungs-Prompt: Kamerafahrt, Zoom, Lichteffekte…"
        disabled={disabled}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MediaActionButton — für Medien-Tools (img-to-video, image-gen, etc.)
// ---------------------------------------------------------------------------

function MediaActionButton({
  loading, disabled, creditCost, canAfford,
}: {
  loading: boolean;
  disabled: boolean;
  creditCost: number;
  canAfford: boolean;
}) {
  const notAffordable = !canAfford && !loading;
  const isDisabled    = disabled || loading || notAffordable;
  const isActive      = !isDisabled;

  return (
    <div className="mt-5 flex justify-end">
      <button
        type="submit"
        disabled={isDisabled}
        className={`rounded px-3.5 py-1.5 text-[11px] font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
          isActive
            ? "bg-[#ccff00] text-black hover:opacity-90"
            : "border border-white/5 bg-transparent text-neutral-500"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }} className="flex items-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> Generiert…
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }} className="flex items-center gap-1.5">
              {notAffordable
                ? <><AlertCircle size={11} /> Credits</>
                : <><Sparkles size={11} /> {formatCreditCost(creditCost)}</>
              }
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Output Panel
// ---------------------------------------------------------------------------

function OutputPanel({
  output, loading, error, onClear, onRetry,
}: {
  output: string; loading: boolean; error: string | null;
  onClear: () => void; onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll während Chunks reinkommen
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [output]);

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showDots   = loading && output.length === 0 && !error;
  const showOutput = output.length > 0 || showDots || !!error;

  if (!showOutput) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mt-6"
    >
      {/* Panel-Header */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20">
          {error ? "Fehler" : loading ? "Claude schreibt…" : "Antwort"}
        </span>

        {!loading && !error && output && (
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={onRetry}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/25 transition-colors hover:bg-white/5 hover:text-white/50">
              <RefreshCw size={10} /> Neu
            </button>
            <button type="button" onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/25 transition-colors hover:bg-white/5 hover:text-white/50">
              {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
              {copied ? "Kopiert" : "Kopieren"}
            </button>
            <button type="button" onClick={onClear}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/25 transition-colors hover:bg-white/5 hover:text-white/50">
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Output Box */}
      <div
        className="max-h-[400px] overflow-y-auto rounded-xl border p-5 font-sans text-[13px] leading-relaxed text-white/72"
        style={{
          background:     "#080808",
          borderColor:    "rgba(255,255,255,0.05)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.05) transparent",
        }}
      >
        {error ? (
          <div className="flex items-start gap-2.5">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-[12px] text-red-400">{error}</p>
          </div>
        ) : showDots ? (
          /* Lade-Punkte wenn noch kein Text da ist */
          <div className="flex items-center gap-2 py-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full bg-white/25"
                animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -3, 0] }}
                transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Streaming Text */}
            <span className="whitespace-pre-wrap break-words">{output}</span>

            {/* Blinkender Cursor während Stream läuft */}
            {loading && (
              <motion.span
                className="ml-px inline-block h-3.5 w-[2px] align-middle"
                style={{ background: "#ccff00" }}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ghost-Skeleton-Linien während Text einläuft */}
      {loading && output.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          <div className="h-2 animate-pulse rounded-full bg-neutral-900" style={{ width: "72%" }} />
          <div className="h-2 animate-pulse rounded-full bg-neutral-900" style={{ width: "88%" }} />
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tool Header Meta
// ---------------------------------------------------------------------------

const TOOL_META: Record<string, {
  label: string; icon: React.ReactNode; accent: string; description: string;
}> = {
  "viral-hook":        { label: "Viral Hook",        icon: <Zap size={14} />,        accent: "#B7FF00", description: "5 scroll-stoppende Hooks via Claude" },
  "content-calendar":  { label: "Content Kalender",  icon: <Calendar size={14} />,   accent: "#00D5FF", description: "7-Tage-Kalender — plattformoptimiert" },
  "trend-script":      { label: "Trend Script",      icon: <TrendingUp size={14} />, accent: "#FFD84D", description: "Fertiges Skript aus Trend oder Thema" },
  "image-gen":         { label: "Bild Generator",    icon: <Sparkles size={14} />,   accent: "#8B5DFF", description: "KI-Bildgenerierung via Fal AI" },
  "ecommerce-ads":     { label: "E-Commerce Ads",    icon: <Sparkles size={14} />,   accent: "#B7FF00", description: "Video-Generierung via Akool" },
  "img-to-video":      { label: "Bild zu Video",     icon: <Film size={14} />,       accent: "#8B5DFF", description: "Animiere Standbilder mit Kinofilm-Physik via Kling 3.0 & Nano Banana." },
  "text-to-video":     { label: "Text → Video",      icon: <Sparkles size={14} />,   accent: "#8B5DFF", description: "Text direkt in Video umwandeln" },
  "video-to-video":    { label: "Video → Video",     icon: <Sparkles size={14} />,   accent: "#8B5DFF", description: "Video re-generieren & anpassen" },
};

const FALLBACK_META = {
  label: "Tool", icon: <Sparkles size={14} />, accent: "#ccff00", description: "KI-Assistent",
};

// ---------------------------------------------------------------------------
// Copilot-Logik — Navigation-Marker Parser
// ---------------------------------------------------------------------------

/**
 * Parst [[NAVIGATE:tool-id]] oder [NAVIGATE:tool-id] aus dem Stream-Text.
 * Gibt bereinigten Text + optionale Tool-ID zurück.
 */
function parseCopilotNavigation(raw: string): { clean: string; navigateTo: ToolId | null } {
  // Beide Formate unterstützen: [[NAVIGATE:...]] und [NAVIGATE:...]
  const marker = /\[{1,2}NAVIGATE:([a-z][a-z0-9-]*)\]{1,2}/i;
  const match  = raw.match(marker);
  if (!match) return { clean: raw, navigateTo: null };
  return {
    clean:      raw.replace(marker, "").replace(/\n{2,}$/, "\n").trimEnd(),
    navigateTo: match[1] as ToolId,
  };
}

// ---------------------------------------------------------------------------
// Copilot-Chat-Komponente — vollständig animierte Chat- und Navigationszentrale
// ---------------------------------------------------------------------------

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_SUGGESTIONS = [
  {
    emoji: "⚡",
    label: "Wie erstelle ich ein virales TikTok-Video?",
    message: "Wie erstelle ich am besten ein virales TikTok-Video auf InfluexAI?",
  },
  {
    emoji: "🎨",
    label: "Nano Banana vs. Flux — welches Modell soll ich nutzen?",
    message: "Was ist der Unterschied zwischen Nano Banana Pro und Flux 2 Pro? Welches empfiehlst du für mich?",
  },
  {
    emoji: "⚙️",
    label: "Zeig mir meine Plattform-Einstellungen.",
    message: "Zeig mir bitte meine Plattform-Einstellungen.",
  },
] as const;

function CopilotChat({ onNavigate }: { onNavigate?: (toolId: ToolId) => void }) {
  const [messages,  setMessages]  = useState<CopilotMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const abortRef    = useRef<AbortController | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;

  // ── Auto-scroll bei neuen Stream-Tokens ──────────────────────────────────
  useEffect(() => {
    if (streaming) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, streaming]);

  // ── Auto-resize Textarea ──────────────────────────────────────────────────
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = useCallback(async (userMessage: string) => {
    const msg = userMessage.trim();
    if (!msg || streaming) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setStreaming(true);

    // Textarea nach dem Submit auf Standardgröße zurücksetzen
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let accumulated = "";
    let navigateTo: ToolId | null = null;

    try {
      // Kontext für API: messages VOR dem neuen Turn
      const historyForApi = messages
        .concat({ role: "user", content: msg })
        .slice(-10);

      const res = await fetch("/api/agent/copilot", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: msg, history: historyForApi }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }

      const reader  = res.body?.getReader();
      if (!reader) throw new Error("Kein Stream.");
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          let evt: { type: string; text?: string; message?: string };
          try { evt = JSON.parse(raw) as typeof evt; } catch { continue; }

          if (evt.type === "text_delta" && evt.text) {
            accumulated += evt.text;
            const { clean } = parseCopilotNavigation(accumulated);
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: clean };
              return copy;
            });
          }
          if (evt.type === "error") throw new Error(evt.message ?? "Copilot-Fehler");
        }
      }

      // Stream fertig → Navigation auswerten
      const parsed = parseCopilotNavigation(accumulated);
      navigateTo   = parsed.navigateTo;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: parsed.clean };
        return copy;
      });

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Abgebrochene Nachrichten entfernen
        setMessages((prev) => prev.slice(0, -2));
        return;
      }
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setMessages((prev) =>
        prev[prev.length - 1]?.content === "" ? prev.slice(0, -1) : prev
      );
    } finally {
      setStreaming(false);
      if (navigateTo) {
        // 500ms warten → Antwort kurz lesen → dann Tool öffnen
        setTimeout(() => onNavigate?.(navigateTo!), 500);
      }
    }
  }, [messages, streaming, onNavigate]);

  // ── Enter-Handler ─────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit(input);
    }
  }, [submit, input]);

  const lastAssistant = messages.findLast?.((m) => m.role === "assistant");
  const isActiveStream = streaming && messages[messages.length - 1]?.role === "assistant";

  return (
    <div className="flex flex-col gap-2">

      {/* ── Chat-Verlauf ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hasMessages && (
          <motion.div
            key="chat-history"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="max-h-[300px] overflow-y-auto space-y-2 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {messages.map((msg, i) => {
              const isLast       = i === messages.length - 1;
              const isStreaming  = isActiveStream && isLast && msg.role === "assistant";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Copilot-Dot */}
                  {msg.role === "assistant" && (
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "#ccff00", opacity: 0.65 }}
                    />
                  )}

                  <div className="max-w-[90%]">
                    {msg.role === "user" ? (
                      /* User: dezent, ohne Rahmen */
                      <p className="text-[13px] leading-relaxed text-neutral-400"
                        style={{ whiteSpace: "pre-wrap" }}>
                        {msg.content}
                      </p>
                    ) : (
                      /* Assistant: heller, kein Bubble */
                      <div className="text-[13px] leading-relaxed text-white/75"
                        style={{ whiteSpace: "pre-wrap" }}>
                        {msg.content ? (
                          <>
                            {msg.content}
                            {isStreaming && (
                              <motion.span
                                className="ml-[2px] inline-block h-[13px] w-[2px] align-middle rounded-full"
                                style={{ background: "#ccff00" }}
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                              />
                            )}
                          </>
                        ) : isStreaming ? (
                          <span className="flex items-center gap-1 py-1">
                            {[0, 1, 2].map((d) => (
                              <motion.span key={d}
                                className="h-1 w-1 rounded-full"
                                style={{ background: "#ccff00", opacity: 0.7 }}
                                animate={{ opacity: [0.2, 0.8, 0.2] }}
                                transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.18 }}
                              />
                            ))}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* Ghost-Skeleton während Antwort einläuft */}
                    {isStreaming && msg.content.length > 0 && (
                      <div className="mt-1 space-y-1">
                        <div className="h-1 animate-pulse rounded-full bg-white/5" style={{ width: "68%" }} />
                        <div className="h-1 animate-pulse rounded-full bg-white/5" style={{ width: "44%" }} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {error && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-[12px] text-red-400/60"
              >
                <AlertCircle size={10} /> {error}
              </motion.p>
            )}
            <div ref={bottomRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Divider nach Chat-Verlauf ────────────────────────────────────────── */}
      {hasMessages && (
        <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />
      )}

      {/* ── Quick-Suggestions (nur im Idle) ────────────────────────────────── */}
      <AnimatePresence>
        {!hasMessages && (
          <motion.div
            key="quick-cards"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3, transition: { duration: 0.10 } }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex flex-col gap-1.5"
          >
            {QUICK_SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => void submit(s.message)}
                disabled={streaming}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.16, delay: i * 0.05 }}
                whileTap={{ scale: 0.99 }}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-white/5 p-3 text-left text-[11px] text-neutral-400 transition-all hover:border-white/10 hover:text-neutral-200 disabled:pointer-events-none disabled:opacity-30"
                style={{ background: "#060606" }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-[13px]">{s.emoji}</span>
                  <span className="leading-snug">{s.label}</span>
                </span>
                <ArrowRight size={11} className="shrink-0 text-neutral-600 transition-colors group-hover:text-[#ccff00]" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Eingabe ─────────────────────────────────────────────────────────── */}
      <div className="flex items-end gap-2 pt-1">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
            onKeyDown={handleKeyDown}
            placeholder={
              streaming
                ? "Copilot antwortet…"
                : hasMessages
                  ? "Weiterfragen…"
                  : "Frage stellen oder Tool aufrufen…"
            }
            disabled={streaming}
            rows={1}
            className="w-full resize-none rounded-xl border p-4 text-sm text-white shadow-inner outline-none transition-all placeholder:text-neutral-600 focus:border-white/15 disabled:opacity-40"
            style={{
              background:  "#080808",
              borderColor: "rgba(255,255,255,0.05)",
              maxHeight:    140,
              overflowY:    "auto",
              lineHeight:   "1.5",
            }}
          />
        </div>

        {/* Send-Button — flach, kein Ring */}
        <motion.button
          type="button"
          onClick={() => void submit(input)}
          disabled={!input.trim() || streaming}
          whileTap={{ scale: 0.90 }}
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-25"
          style={{
            background: input.trim() && !streaming ? "#ccff00" : "rgba(255,255,255,0.05)",
            color:      input.trim() && !streaming ? "#000"    : "rgba(255,255,255,0.30)",
          }}
        >
          {streaming
            ? <Loader2 size={14} className="animate-spin" />
            : <SendHorizonal size={14} />
          }
        </motion.button>
      </div>

      {/* ── Hint ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!hasMessages && !streaming && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-[10px] text-white/15"
          >
            ↵ senden &nbsp;·&nbsp; Shift+↵ neue Zeile
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

// ─── Copilot-Trigger-Tools ───────────────────────────────────────────────────
// Diese Tools zeigen den Copilot-Chat statt eines Tool-Formulars
const COPILOT_TRIGGER_TOOLS = new Set<ToolId>(["gallery", "settings"]);

export const AgentBox = memo(function AgentBox({
  activeTool,
  toolSettings = null,
  currentCredits = Infinity,
  onActionExecute,
  onNavigate,
}: AgentBoxProps) {

  // ── Copilot-Modus ──────────────────────────────────────────────────────────
  if (COPILOT_TRIGGER_TOOLS.has(activeTool)) {
    return (
      <motion.div
        key="copilot"
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0,   scale: 1   }}
        exit={{ opacity: 0, y: -10,    scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-1/2 top-16 z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-white/[0.05] p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        style={{ background: "rgba(11,11,13,0.90)" }}
      >
        {/* ── Copilot Header ─────────────────────────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          <Bot size={12} style={{ color: "rgba(255,255,255,0.22)" }} />
          <p className="flex-1 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
            InfluexAI Copilot
          </p>
          <motion.span
            className="h-[4px] w-[4px] shrink-0 rounded-full"
            style={{ background: "#ccff00" }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* ── Chat ───────────────────────────────────────────────────────── */}
        <CopilotChat onNavigate={onNavigate} />
      </motion.div>
    );
  }
  const meta       = TOOL_META[activeTool] ?? FALLBACK_META;
  const isMedia    = MEDIA_TOOLS.has(activeTool);
  const isTextTool = !isMedia && activeTool in TOOL_META;

  // Credit calculation — live based on tool + settings
  const creditCost = calculateExactCredits(activeTool, toolSettings);
  const canAfford  = currentCredits >= creditCost;

  // Form State
  const [formValues, setFormValues] = useState<FormValues>(
    () => structuredClone(DEFAULTS[activeTool] ?? {}) as FormValues
  );

  // Streaming State
  const [loading, setLoading]   = useState(false);
  const [output, setOutput]     = useState("");
  const [error, setError]       = useState<string | null>(null);

  // Optimizer result — shown in Prompt-Vorschau
  const [optimized, setOptimized] = useState<OptimizedPromptResult | null>(null);

  // Reset bei Tool-Wechsel (ref-Trick für stabile useState-Sequenz)
  const prevToolRef = useRef(activeTool);
  if (prevToolRef.current !== activeTool) {
    prevToolRef.current = activeTool;
    setFormValues(structuredClone(DEFAULTS[activeTool] ?? {}) as FormValues);
    setOutput("");
    setError(null);
  }

  const abortRef = useRef<AbortController | null>(null);

  const patchValues = useCallback((patch: Partial<FormValues>) => {
    setFormValues((prev) => ({ ...prev, ...patch } as FormValues));
  }, []);

  const formattedPrompt = useMemo(
    () => buildPrompt(activeTool, formValues),
    [activeTool, formValues]
  );

  // ---------------------------------------------------------------------------
  // handleSubmit — Streaming via /api/agent
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (loading) return;

    // ── Medien-Tools → Prompt optimieren dann an Parent weiterleiten ────────
    if (isMedia) {
      setLoading(true);
      try {
        const result = await optimizeUserPrompt(formattedPrompt, activeTool, toolSettings);
        setOptimized(result);
        await onActionExecute(activeTool, result.optimized);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!formattedPrompt) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setOutput("");
    setError(null);

    let finalOutput = "";

    try {
      // ── Prompt optimieren (Übersetzung + Claude-Prefix) ─────────────────
      const result = await optimizeUserPrompt(formattedPrompt, activeTool, toolSettings);
      setOptimized(result);
      const apiPrompt = result.optimized;

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: apiPrompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      finalOutput = await consumeAgentStream(
        res,
        (chunk) => setOutput((prev) => prev + chunk),
        (msg)   => setError(msg),
        abortRef.current.signal
      );

      if (finalOutput.trim()) {
        await onActionExecute(activeTool, finalOutput).catch(() => {});
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }, [loading, isMedia, formattedPrompt, activeTool, toolSettings, onActionExecute]);

  const onSubmit = useCallback(
    (e: FormEvent) => { e.preventDefault(); void handleSubmit(); },
    [handleSubmit]
  );

  const handleClearOutput = useCallback(() => {
    setOutput("");
    setError(null);
    setOptimized(null);
  }, []);

  // Cleanup
  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <motion.div
      key={`tool-${activeTool}`}
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0,   scale: 1   }}
      exit={{ opacity: 0, y: -10,    scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-1/2 top-16 z-50 w-full max-w-xl -translate-x-1/2 rounded-xl border border-white/[0.05] p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      style={{ background: "rgba(11,11,13,0.90)" }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <span style={{ color: "rgba(255,255,255,0.22)" }}>{meta.icon}</span>
        <p className="flex-1 text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          {meta.label}
        </p>

        {/* Abbrechen — nur sichtbar während Loading */}
        {loading && (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="flex shrink-0 items-center gap-1 rounded px-2 py-1 font-mono text-[10px] text-white/25 transition-colors hover:text-white/50"
          >
            <X size={11} />
            Abbrechen
          </button>
        )}
      </div>

      {/* ── Formular ─────────────────────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="w-full">
        {isTextTool ? (
          <>
            {activeTool === "viral-hook" && (
              <ViralHookForm
                values={formValues as ViralHookValues}
                onChange={patchValues}
                disabled={loading}
                loading={loading}
                creditCost={creditCost}
                canAfford={canAfford}
              />
            )}
            {activeTool === "content-calendar" && (
              <ContentCalendarForm
                values={formValues as ContentCalendarValues}
                onChange={patchValues}
                disabled={loading}
                loading={loading}
                creditCost={creditCost}
                canAfford={canAfford}
              />
            )}
            {activeTool === "trend-script" && (
              <TrendScriptForm
                values={formValues as TrendScriptValues}
                onChange={patchValues}
                disabled={loading}
                loading={loading}
                creditCost={creditCost}
                canAfford={canAfford}
              />
            )}

            {/* Prompt-Vorschau — ausklappbar, minimal */}
            {optimized && optimized.wasGerman && !loading && (
              <p className="mt-3 font-mono text-[10px] text-neutral-600">
                🇩🇪 → 🇬🇧 übersetzt
                {optimized.enhancements.length > 0 && ` · ${optimized.enhancements.length} Verbesserungen`}
              </p>
            )}
          </>
        ) : activeTool === "img-to-video" ? (
          /* Kling Keyframe-Tool — eigenes Formular */
          <>
            <ImgToVideoForm
              values={formValues as ImgToVideoValues}
              onChange={patchValues}
              disabled={loading}
            />
            <MediaActionButton
              loading={loading}
              disabled={!(formValues as ImgToVideoValues).startFrameUrl}
              creditCost={creditCost}
              canAfford={canAfford}
            />
          </>
        ) : (
          /* Alle anderen Medien-Tools — Settings in der rechten Sidebar */
          <>
            <p className="py-4 text-[13px] text-neutral-600">
              Einstellungen in der rechten Sidebar ↗
            </p>
            <MediaActionButton
              loading={loading}
              disabled={false}
              creditCost={creditCost}
              canAfford={canAfford}
            />
          </>
        )}

        {/* ── Output Panel (Streaming) ──────────────────────────────────── */}
        <AnimatePresence>
          {(output.length > 0 || loading || !!error) && isTextTool && (
            <OutputPanel
              output={output}
              loading={loading}
              error={error}
              onClear={handleClearOutput}
              onRetry={() => void handleSubmit()}
            />
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
});
