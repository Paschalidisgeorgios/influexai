"use client";

/**
 * ParamFields — generischer Fallback-Renderer für nicht-migrierte Tool-Module.
 * Rendert Felder dynamisch aus dem ToolParamSchema.
 */

import type { ToolApiDefinition, ToolParamSchema } from "@/lib/canvas/toolApiSchema";

interface Props {
  tool: ToolApiDefinition;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function ParamFields({ tool, values, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {tool.params.map((param) => (
        <ParamField key={param.key} param={param} values={values} onChange={onChange} />
      ))}
    </div>
  );
}

function ParamField({
  param,
  values,
  onChange,
}: {
  param: ToolParamSchema;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const value = values[param.key];

  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {param.label}
        {param.required ? <span className="ml-1 text-red-400">*</span> : null}
      </label>

      {param.type === "textarea" ? (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(param.key, e.target.value)}
          placeholder={param.placeholder}
          rows={3}
          className="w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-xs leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />
      ) : param.type === "select" && param.options ? (
        <select
          value={String(value ?? param.defaultValue ?? "")}
          onChange={(e) => onChange(param.key, e.target.value)}
          className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-xs text-zinc-100 outline-none focus:border-zinc-500"
        >
          {param.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : param.type === "boolean" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value ?? param.defaultValue)}
            onChange={(e) => onChange(param.key, e.target.checked)}
            className="rounded accent-[#ccff00]"
          />
          <span className="text-xs text-zinc-400">Aktiviert</span>
        </label>
      ) : param.type === "number" || param.type === "slider" ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={param.min ?? 0}
            max={param.max ?? 100}
            step={param.step ?? 1}
            value={Number(value ?? param.defaultValue ?? param.min ?? 0)}
            onChange={(e) => onChange(param.key, Number(e.target.value))}
            className="flex-1 accent-[#ccff00]"
          />
          <span className="min-w-[3rem] text-right font-mono text-xs text-zinc-400">
            {String(value ?? param.defaultValue ?? 0)}
          </span>
        </div>
      ) : (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(param.key, e.target.value)}
          placeholder={param.placeholder}
          className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3 py-2.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />
      )}
    </div>
  );
}
