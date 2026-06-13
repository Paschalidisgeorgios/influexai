"use client";

import Image from "next/image";
import { useDashboardV2 } from "@/contexts/DashboardV2Context";
import { THEME_COLORS } from "@/lib/dashboard-v2/model-registry";

function ParamSelect({
  label,
  paramKey,
  options,
  value,
  onChange,
}: {
  label: string;
  paramKey: string;
  options: string[];
  value: string | number | boolean | null | undefined;
  onChange: (key: string, val: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-wide text-white/35 uppercase">{label}</span>
      <select
        value={String(value ?? options[0] ?? "")}
        onChange={(e) => onChange(paramKey, e.target.value)}
        className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/75 outline-none focus:border-[color:var(--dash-v2-accent-25)]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ModelSelector() {
  const { tool, model, models, params, setParam, setActiveModelId } = useDashboardV2();

  if (!tool?.hasModels || models.length === 0) {
    return (
      <aside
        className="hidden w-[320px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0c] lg:flex"
        style={{ borderRightWidth: "0.5px" }}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-[10px] tracking-widest text-white/25 uppercase">
            {tool?.label ?? "Studio"}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/35">
            {tool?.description ?? "Wähle ein Tool in der Sidebar."}
          </p>
          {tool && (
            <div
              className="mt-4 rounded-full border px-3 py-1 text-[10px]"
              style={{
                borderColor: `rgba(${THEME_COLORS[tool.themeKey].rgb},0.25)`,
                color: THEME_COLORS[tool.themeKey].hex,
              }}
            >
              {tool.capabilityType}
            </div>
          )}
        </div>
      </aside>
    );
  }

  const theme = model ? THEME_COLORS[model.themeKey] : THEME_COLORS.blue;

  return (
    <aside
      className="hidden w-[320px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0a0c] lg:flex"
      style={{ borderRightWidth: "0.5px" }}
    >
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-[9px] tracking-[1.5px] text-white/25 uppercase">Modelle</p>
        <p className="mt-0.5 text-xs text-white/45">{tool.label}</p>
      </div>

      <div className="dashboard-v2-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {models.map((m) => {
          const active = m.id === model?.id;
          const t = THEME_COLORS[m.themeKey];
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModelId(m.id)}
              className="mb-2 w-full rounded-2xl border p-3 text-left transition-all duration-300"
              style={{
                borderWidth: "0.5px",
                borderColor: active ? `rgba(${t.rgb},0.35)` : "rgba(255,255,255,0.08)",
                background: active ? `rgba(${t.rgb},0.08)` : "rgba(255,255,255,0.02)",
                boxShadow: active ? `0 0 24px rgba(${t.rgb},0.12)` : undefined,
              }}
            >
              <div className="flex gap-3">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={m.sampleImageUrl}
                    alt={m.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                    style={{ filter: "brightness(0.55)" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13px] font-semibold"
                    style={{ color: active ? t.hex : "rgba(255,255,255,0.8)" }}
                  >
                    {m.name}
                  </p>
                  <p className="text-[10px] text-white/35">{m.provider}</p>
                  <p className="mt-1 text-[10px]" style={{ color: `rgba(${t.rgb},0.7)` }}>
                    ~{m.creditCost.toLocaleString("de-DE")} Credits
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border px-2 py-0.5 text-[8px] text-white/40"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}

        {model && (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] tracking-widest text-white/30 uppercase">
              Capabilities
            </p>
            {model.durations.length > 0 && (
              <ParamSelect
                label="Dauer"
                paramKey="duration"
                options={model.durations}
                value={params.duration}
                onChange={setParam}
              />
            )}
            {model.resolutions.length > 0 && (
              <ParamSelect
                label="Auflösung"
                paramKey="resolution"
                options={model.resolutions}
                value={params.resolution}
                onChange={setParam}
              />
            )}
            {model.params.cameraMovement && (
              <ParamSelect
                label="Kamera"
                paramKey="cameraMovement"
                options={model.params.cameraMovement}
                value={params.cameraMovement}
                onChange={setParam}
              />
            )}
            {model.params.shotType && (
              <ParamSelect
                label="Shot"
                paramKey="shotType"
                options={model.params.shotType}
                value={params.shotType}
                onChange={setParam}
              />
            )}
            {model.params.aspectRatio && (
              <ParamSelect
                label="Format"
                paramKey="aspectRatio"
                options={model.params.aspectRatio}
                value={params.aspectRatio}
                onChange={setParam}
              />
            )}
            {model.params.style && (
              <ParamSelect
                label="Stil"
                paramKey="style"
                options={model.params.style}
                value={params.style}
                onChange={setParam}
              />
            )}
            {model.supportsAudio && (
              <label className="flex items-center gap-2 text-xs text-white/50">
                <input
                  type="checkbox"
                  checked={Boolean(params.generateAudio)}
                  onChange={(e) => setParam("generateAudio", e.target.checked)}
                  className="rounded border-white/20"
                />
                Audio generieren
              </label>
            )}
          </div>
        )}
      </div>

      {model && (
        <div
          className="mx-3 mb-3 rounded-full border px-3 py-1.5 text-center text-[10px]"
          style={{
            borderColor: `rgba(${theme.rgb},0.25)`,
            color: theme.hex,
          }}
        >
          Theme: {model.themeKey}
        </div>
      )}
    </aside>
  );
}
