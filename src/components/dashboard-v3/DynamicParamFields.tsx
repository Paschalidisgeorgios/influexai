"use client";

import { useCallback } from "react";
import type { ModelApiSchema, SchemaField } from "@/lib/api-schemas/toolApiSchema";

interface DynamicParamFieldsProps {
  schema: ModelApiSchema;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  themeRgb?: string;
}

function EnumField({
  field,
  value,
  onChange,
  rgb,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (v: string) => void;
  rgb: string;
}) {
  const options = field.options ?? [];
  const current = String(value ?? field.defaultValue);

  if (options.length <= 4) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === current;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all duration-150 ${
                active ? "text-white border-opacity-100" : "text-white/45 hover:text-white/70"
              }`}
              style={{
                background: active ? `rgba(${rgb},0.12)` : "rgba(255,255,255,0.02)",
                borderColor: active ? `rgba(${rgb},0.5)` : "rgba(255,255,255,0.08)",
                color: active ? `rgb(${rgb})` : undefined,
                cursor: "default",
              }}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/[0.08] bg-[#0d0d10] px-3 py-2.5 text-[13px] text-white/80 outline-none transition-colors focus:border-[#0066FF]/50"
      style={{ cursor: "default" }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function BooleanField({
  field,
  value,
  onChange,
  rgb,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (v: boolean) => void;
  rgb: string;
}) {
  const checked = Boolean(value ?? field.defaultValue);

  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-white/55">{field.label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
        style={{
          background: checked ? `rgb(${rgb})` : "rgba(255,255,255,0.1)",
          cursor: "default",
        }}
        aria-label={field.label}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-[#070708] shadow-sm transition-all duration-200"
          style={{ left: checked ? "18px" : "2px" }}
        />
      </button>
    </div>
  );
}

function SliderField({
  field,
  value,
  onChange,
  rgb,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (v: number) => void;
  rgb: string;
}) {
  const num = Number(value ?? field.defaultValue);
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const pct = ((num - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] tracking-wider text-white/40 uppercase">{field.label}</span>
        <span className="font-mono text-[11px] font-medium" style={{ color: `rgb(${rgb})` }}>
          {num}
          {field.unit ?? ""}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/[0.08]">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: `rgb(${rgb})` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={num}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full opacity-0"
          style={{ cursor: "default" }}
          aria-label={field.label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={num}
        />
      </div>
      <div className="mt-1 flex justify-between">
        <span className="text-[9px] text-white/20">
          {min}
          {field.unit ?? ""}
        </span>
        <span className="text-[9px] text-white/20">
          {max}
          {field.unit ?? ""}
        </span>
      </div>
    </div>
  );
}

function IntegerField({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (v: number) => void;
}) {
  const num = Number(value ?? field.defaultValue);

  return (
    <div>
      <label className="mb-1.5 block text-[11px] tracking-wider text-white/40 uppercase">
        {field.label}
      </label>
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={1}
        value={num === -1 ? "" : num}
        placeholder={num === -1 ? "Zufällig (-1)" : undefined}
        onChange={(e) => onChange(e.target.value === "" ? -1 : Number(e.target.value))}
        className="w-full rounded-xl border border-white/[0.08] bg-[#0d0d10] px-3 py-2.5 font-mono text-[13px] text-white/80 outline-none transition-colors focus:border-[#0066FF]/50"
        style={{ cursor: "text" }}
        aria-label={field.label}
      />
    </div>
  );
}

function TextAreaField({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={String(value ?? field.defaultValue ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.hint}
      rows={field.type === "prompt" ? 4 : 2}
      className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0d0d10] px-4 py-3 text-[13px] text-white/80 placeholder-white/20 outline-none transition-colors focus:border-[#0066FF]/50"
      style={{ cursor: "text" }}
      aria-label={field.label}
    />
  );
}

function UploadField({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (v: string | null) => void;
}) {
  const hasFile = value !== null && value !== undefined && value !== "";
  const isMulti = field.type === "multi_image_upload";

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${
          hasFile
            ? "border-[#0066FF]/40 bg-[#0066FF]/5"
            : "border-white/10 bg-white/[0.02] hover:border-white/20"
        }`}
        style={{ minHeight: "80px" }}
      >
        <input
          type="file"
          accept={field.acceptedFormats?.map((f) => `.${f}`).join(",")}
          multiple={isMulti}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(URL.createObjectURL(file));
          }}
          className="absolute inset-0 h-full w-full opacity-0"
          style={{ cursor: "default" }}
          aria-label={field.label}
        />
        <div className="flex flex-col items-center justify-center px-4 py-5 text-center">
          <span className="mb-1.5 text-2xl" aria-hidden="true">
            {field.type === "video_upload"
              ? "🎬"
              : field.type === "audio_upload"
                ? "🎵"
                : "🖼"}
          </span>
          <span className="text-[11px] text-white/40">
            {hasFile ? "✓ Datei geladen — klicken zum Ersetzen" : `${field.label} hochladen`}
          </span>
          {field.acceptedFormats && (
            <span className="mt-0.5 text-[9px] text-white/20">
              {field.acceptedFormats.join(", ").toUpperCase()}
              {field.maxFileSizeMB ? ` — max. ${field.maxFileSizeMB}MB` : ""}
              {isMulti && field.maxFiles ? ` — max. ${field.maxFiles} Dateien` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DynamicParamFields({
  schema,
  values,
  onChange,
  themeRgb = "0,102,255",
}: DynamicParamFieldsProps) {
  const handleChange = useCallback(
    (key: string, val: unknown) => onChange(key, val),
    [onChange]
  );

  const promptFields = schema.fields.filter((f) => f.type === "prompt");
  const uploadFields = schema.fields.filter(
    (f) =>
      f.type === "image_upload" ||
      f.type === "multi_image_upload" ||
      f.type === "video_upload" ||
      f.type === "audio_upload"
  );
  const boolFields = schema.fields.filter((f) => f.type === "boolean");
  const otherFields = schema.fields.filter(
    (f) =>
      ![
        "prompt",
        "image_upload",
        "multi_image_upload",
        "video_upload",
        "audio_upload",
        "boolean",
      ].includes(f.type)
  );

  const renderField = (field: SchemaField) => {
    const val = values[field.key] ?? field.defaultValue;

    return (
      <div key={field.key}>
        {!["boolean", "prompt", "image_upload", "multi_image_upload", "video_upload", "audio_upload", "slider"].includes(
          field.type
        ) && (
          <label className="mb-1.5 block text-[11px] tracking-wider text-white/40 uppercase">
            {field.label}
            {field.required && <span className="ml-1 text-red-400/70">*</span>}
          </label>
        )}

        {field.type === "prompt" && (
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wider text-white/40 uppercase">
              {field.label}
              {field.required && <span className="ml-1 text-red-400/70">*</span>}
            </label>
            <TextAreaField field={field} value={val} onChange={(v) => handleChange(field.key, v)} />
          </div>
        )}
        {field.type === "text" && (
          <input
            type="text"
            value={String(val)}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.hint}
            className="w-full rounded-xl border border-white/[0.08] bg-[#0d0d10] px-3 py-2.5 text-[13px] text-white/80 placeholder-white/20 outline-none transition-colors focus:border-[#0066FF]/50"
            style={{ cursor: "text" }}
          />
        )}
        {field.type === "enum" && (
          <EnumField
            field={field}
            value={val}
            onChange={(v) => handleChange(field.key, v)}
            rgb={themeRgb}
          />
        )}
        {field.type === "slider" && (
          <SliderField
            field={field}
            value={val}
            onChange={(v) => handleChange(field.key, v)}
            rgb={themeRgb}
          />
        )}
        {field.type === "integer" && (
          <IntegerField field={field} value={val} onChange={(v) => handleChange(field.key, v)} />
        )}
        {field.type === "boolean" && (
          <BooleanField
            field={field}
            value={val}
            onChange={(v) => handleChange(field.key, v)}
            rgb={themeRgb}
          />
        )}
        {(field.type === "image_upload" ||
          field.type === "multi_image_upload" ||
          field.type === "video_upload" ||
          field.type === "audio_upload") && (
          <UploadField field={field} value={val} onChange={(v) => handleChange(field.key, v)} />
        )}

        {field.hint && field.type !== "prompt" && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-white/25">{field.hint}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {promptFields.map(renderField)}

      {uploadFields.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{uploadFields.map(renderField)}</div>
      )}

      {otherFields.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{otherFields.map(renderField)}</div>
      )}

      {boolFields.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
          {boolFields.map(renderField)}
        </div>
      )}
    </div>
  );
}
