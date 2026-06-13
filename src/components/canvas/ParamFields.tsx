"use client";

import { useMemo, useState } from "react";
import type { ToolParamSchema } from "@/lib/canvas/toolApiSchema";
import type { AssetNodeData } from "@/lib/canvas/canvas-store";
import { glassInputClass } from "@/lib/glass-classes";
import { usePipelineContextOptional } from "@/lib/dashboard-v3/PipelineContext";
import { InheritedInputBadge } from "@/components/dashboard-v3/InheritedInputBadge";
import { PIPELINE_COMPATIBILITY } from "@/lib/dashboard-v3/usePipeline";

interface ParamFieldsProps {
  params: ToolParamSchema[];
  values: Record<string, unknown>;
  accent: string;
  onChange: (key: string, value: unknown) => void;
  onAssetDrop?: (paramKey: string, asset: AssetNodeData) => void;
  disconnectedFields?: Set<string>;
  onDisconnectField?: (key: string) => void;
  onReconnectField?: (key: string) => void;
  /** When true, renders all params without progressive-disclosure wrapper */
  flat?: boolean;
}

function isPrimaryField(field: ToolParamSchema): boolean {
  if (field.type === "textarea") return true;
  if (field.key === "prompt") return true;
  if (field.type === "node-ref" && field.required) return true;
  if (field.type === "string" && field.required) return true;
  return false;
}

export function ParamFields({
  params,
  values,
  accent,
  onChange,
  onAssetDrop,
  disconnectedFields: disconnectedProp,
  onDisconnectField,
  onReconnectField,
  flat = false,
}: ParamFieldsProps) {
  const pipeline = usePipelineContextOptional();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localDisconnected, setLocalDisconnected] = useState<Set<string>>(
    () => new Set()
  );
  const disconnectedFields = disconnectedProp ?? localDisconnected;

  const { primaryFields, advancedFields } = useMemo(() => {
    const primary: ToolParamSchema[] = [];
    const advanced: ToolParamSchema[] = [];
    for (const field of params) {
      if (isPrimaryField(field)) primary.push(field);
      else advanced.push(field);
    }
    return { primaryFields: primary, advancedFields: advanced };
  }, [params]);

  const renderField = (field: ToolParamSchema) => {
    const inherited =
      pipeline && PIPELINE_COMPATIBILITY[field.key] && !disconnectedFields.has(field.key)
        ? pipeline.getInheritedValue(
            field.key,
            pipeline.panelIndex,
            pipeline.allPanelIds
          )
        : null;

    const manualValue = values[field.key];
    const hasManualValue =
      typeof manualValue === "string"
        ? manualValue.trim().length > 0
        : manualValue != null && manualValue !== "" && manualValue !== false;

    const useInherited = Boolean(inherited && !hasManualValue);

    return (
      <div key={field.key}>
        {useInherited && inherited ? (
          <>
            <InheritedInputBadge
              label={inherited.label}
              value={inherited.value}
              themeRgb={pipeline?.themeRgb ?? "204,255,0"}
              onClear={() => {
                if (onDisconnectField) {
                  onDisconnectField(field.key);
                } else {
                  setLocalDisconnected((prev) => new Set(prev).add(field.key));
                }
              }}
            />
            {disconnectedFields.has(field.key) ? null : (
              <input type="hidden" name={field.key} value={inherited.value} readOnly />
            )}
          </>
        ) : (
          <>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {field.label}
              {field.required && <span className="text-red-400/80"> *</span>}
            </label>
            <FieldInput
              field={field}
              value={values[field.key]}
              accent={accent}
              onChange={(v) => onChange(field.key, v)}
              onAssetDrop={
                field.acceptsOutputTypes?.length && onAssetDrop
                  ? (asset) => onAssetDrop(field.key, asset)
                  : undefined
              }
            />
            {inherited && disconnectedFields.has(field.key) ? (
              <button
                type="button"
                onClick={() => {
                  if (onReconnectField) {
                    onReconnectField(field.key);
                  } else {
                    setLocalDisconnected((prev) => {
                      const next = new Set(prev);
                      next.delete(field.key);
                      return next;
                    });
                  }
                }}
                className="mt-1.5 text-[10px] text-white/30 underline underline-offset-2 transition-colors hover:text-white/60"
              >
                Pipeline neu verbinden ↩
              </button>
            ) : null}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {flat ? (
        params.map(renderField)
      ) : (
        <>
          {primaryFields.map(renderField)}

          {advancedFields.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 self-start text-[11px] text-white/30 transition-colors hover:text-white/60"
              >
                <span aria-hidden="true">⚙️</span>
                {showAdvanced ? "Weniger Optionen" : "Erweiterte Einstellungen"}
              </button>

              {showAdvanced ? (
                <div className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  {advancedFields.map(renderField)}
                </div>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  accent,
  onChange,
  onAssetDrop,
}: {
  field: ToolParamSchema;
  value: unknown;
  accent: string;
  onChange: (v: unknown) => void;
  onAssetDrop?: (asset: AssetNodeData) => void;
}) {
  const base =
    `${glassInputClass} rounded-lg px-3 py-2 text-xs text-zinc-100`;

  if (field.type === "node-ref") {
    return (
      <div
        className={`${base} min-h-[44px] border-dashed text-zinc-500`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData("application/influex-asset");
          if (raw && onAssetDrop) onAssetDrop(JSON.parse(raw) as AssetNodeData);
        }}
      >
        {value ? (
          <span className="text-zinc-300">✓ Asset verbunden</span>
        ) : (
          <span>Asset hierher ziehen oder Pipeline-Verbindung nutzen</span>
        )}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[72px] resize-none`}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onDragOver={(e) => {
          if (onAssetDrop) e.preventDefault();
        }}
        onDrop={(e) => {
          if (!onAssetDrop) return;
          e.preventDefault();
          const raw = e.dataTransfer.getData("application/influex-asset");
          if (raw) onAssetDrop(JSON.parse(raw) as AssetNodeData);
        }}
      />
    );
  }

  if (field.type === "string") {
    return (
      <input
        className={base}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.acceptsOutputTypes?.length) {
    return (
      <div
        className={`${base} min-h-[44px] border-dashed text-zinc-500`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const raw = e.dataTransfer.getData("application/influex-asset");
          if (raw && onAssetDrop) onAssetDrop(JSON.parse(raw) as AssetNodeData);
        }}
      >
        {value ? (
          <span className="text-zinc-300">✓ Asset verbunden</span>
        ) : (
          <span>Asset hierher ziehen</span>
        )}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={base}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {field.options?.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className="rounded-full border px-2 py-0.5 text-[10px] transition-colors"
              style={{
                borderColor: active ? accent : "rgba(255,255,255,0.1)",
                background: active ? `${accent}22` : "transparent",
                color: active ? accent : "rgba(255,255,255,0.5)",
              }}
              onClick={() => {
                onChange(
                  active ? selected.filter((v) => v !== o.value) : [...selected, o.value]
                );
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        className="flex h-6 w-11 items-center rounded-full border border-zinc-700/60 p-0.5 transition-colors"
        style={{ background: value ? `${accent}33` : "rgba(0,0,0,0.4)" }}
        onClick={() => onChange(!value)}
      >
        <span
          className="h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: value ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    );
  }

  if (field.type === "slider") {
    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={Number(value ?? field.min ?? 0)}
          className="flex-1 accent-[var(--canvas-accent)]"
          style={{ ["--canvas-accent" as string]: accent }}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="w-8 text-right font-mono text-[10px] text-zinc-400">{String(value)}</span>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        className={base}
        min={field.min}
        max={field.max}
        value={Number(value ?? field.defaultValue ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  if (field.type === "file" || field.type === "file-list") {
    return (
      <input
        type="file"
        className={`${base} file:mr-2 file:rounded file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-[10px] file:text-zinc-200`}
        multiple={field.type === "file-list"}
        onChange={(e) => {
          const files = e.target.files;
          if (!files?.length) return;
          onChange(field.type === "file-list" ? Array.from(files) : files[0]);
        }}
      />
    );
  }

  return (
    <input
      className={base}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
