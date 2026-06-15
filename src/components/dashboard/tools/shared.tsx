"use client";

/**
 * Wiederverwendbare UI-Primitive für Tool-Formulare.
 * Keine Business-Logik — nur UI.
 */

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadCanvasFile } from "@/lib/canvas/canvas-upload";

// ---------------------------------------------------------------------------
// FieldLabel
// ---------------------------------------------------------------------------

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// TextareaField
// ---------------------------------------------------------------------------

export function TextareaField({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-xs leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30"
    />
  );
}

// ---------------------------------------------------------------------------
// SelectField
// ---------------------------------------------------------------------------

export function SelectField({
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
      className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// GroupedModelSelect
// ---------------------------------------------------------------------------

export interface ModelOptionGroup {
  groupLabel: string;
  options: { value: string; label: string }[];
}

export function GroupedModelSelect({
  value,
  onChange,
  groups,
}: {
  value: string;
  onChange: (v: string) => void;
  groups: ModelOptionGroup[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
    >
      {groups.map((g) => (
        <optgroup key={g.groupLabel} label={g.groupLabel}>
          {g.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// SegmentedControl
// ---------------------------------------------------------------------------

export function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/60">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 py-2 text-[11px] font-medium transition-all ${
            value === o.value
              ? "bg-[#b4ff00] text-black"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SliderField
// ---------------------------------------------------------------------------

export function SliderField({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[#b4ff00]"
      />
      <span className="min-w-[3rem] text-right font-mono text-xs text-zinc-400">
        {value}{unit ?? ""}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DropzoneField — Upload zu Fal CDN
// ---------------------------------------------------------------------------

interface DropzoneFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}

export function DropzoneField({
  value,
  onChange,
  label = "Referenzbild",
  accept = "image/*",
}: DropzoneFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadCanvasFile(file, "fal");
      onChange(result.url);
    } catch (err) {
      console.error("[DropzoneField] Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-zinc-700/60">
          <img
            src={value}
            alt="Upload-Vorschau"
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors ${
            dragOver
              ? "border-[#b4ff00]/60 bg-[#b4ff00]/5"
              : "border-zinc-700/60 bg-zinc-900/30 hover:border-zinc-600"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <p className="text-xs text-zinc-400">Uploading…</p>
          ) : (
            <>
              <Upload size={16} className="text-zinc-500" />
              <p className="text-[11px] text-zinc-500">{label}</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
