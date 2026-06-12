"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { ApiPayloadPreview } from "@/components/dashboard/ApiPayloadPreview";
import { useDashboardTool } from "@/contexts/DashboardToolContext";
import {
  getDefaultParamsForModel,
  getToolConfig,
} from "@/lib/tools/tool-registry";
import type { ToolId, ToolModel } from "@/lib/tools/types";

type DynamicDashboardEngineProps = {
  toolId: ToolId;
  children: ReactNode;
  /** Hide registry model panel when the child renders its own studio UI */
  hideModelPanel?: boolean;
  className?: string;
};

function RegistryModelPanel({ models }: { models: ToolModel[] }) {
  const { activeModelId, setActiveModelId, themeColors } = useDashboardTool();

  return (
    <aside
      className="hidden w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0e0e11] lg:flex"
      style={{ borderRightWidth: "0.5px" }}
    >
      <div className="border-b border-white/[0.06] px-3 py-3">
        <p className="text-[9px] uppercase tracking-[1.5px] text-white/25">Modelle</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {models.map((model) => {
          const active = model.id === activeModelId;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                setActiveModelId(model.id);
              }}
              className="mb-2 w-full rounded-[14px] border px-3 py-3 text-left transition-all duration-[1200ms]"
              style={{
                borderWidth: "0.5px",
                borderColor: active
                  ? "var(--dash-theme-accent-30)"
                  : "rgba(255,255,255,0.08)",
                background: active
                  ? "var(--dash-theme-accent-08)"
                  : "rgba(255,255,255,0.02)",
                boxShadow: active ? "var(--dash-theme-glow)" : undefined,
              }}
            >
              <p
                className="text-[13px] font-medium"
                style={{ color: active ? "var(--dash-theme-accent)" : "rgba(255,255,255,0.75)" }}
              >
                {model.name}
              </p>
              <p className="mt-1 text-[11px] text-white/35">{model.provider}</p>
              <p className="mt-1 text-[10px] text-white/25">~{model.credits} Credits</p>
            </button>
          );
        })}
      </div>
      <div
        className="mx-3 mb-3 rounded-full border px-3 py-1 text-center text-[10px]"
        style={{
          borderColor: "var(--dash-theme-accent-25)",
          color: themeColors.accent,
        }}
      >
        Theme: {themeColors.key}
      </div>
    </aside>
  );
}

function RegistryParamPanel({ model }: { model: ToolModel }) {
  const { activeParams, setParam } = useDashboardTool();

  if (!model.params) return null;

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-[1.2px] text-white/30">Parameter</p>
      {Object.entries(model.params).map(([key, schema]) => {
        if (Array.isArray(schema)) {
          const value = String(activeParams[key] ?? schema[0] ?? "");
          return (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-[11px] text-white/35">{key}</span>
              <select
                value={value}
                onChange={(e) => setParam(key, e.target.value)}
                className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white/70 outline-none focus:border-[color:var(--dash-theme-accent-30)]"
              >
                {schema.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        const num = Number(activeParams[key] ?? schema.default);
        return (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-[11px] text-white/35">
              {key} ({schema.min}–{schema.max})
            </span>
            <input
              type="range"
              min={schema.min}
              max={schema.max}
              value={num}
              onChange={(e) => setParam(key, Number(e.target.value))}
              className="w-full"
            />
          </label>
        );
      })}
    </div>
  );
}

export function DynamicDashboardEngine({
  toolId,
  children,
  hideModelPanel = false,
  className = "",
}: DynamicDashboardEngineProps) {
  const {
    activeTool,
    activeModel,
    activeParams,
    prompt,
    setPrompt,
    setParams,
    realtimePayload,
  } = useDashboardTool();

  const config = useMemo(() => getToolConfig(toolId), [toolId]);

  useEffect(() => {
    if (activeTool !== toolId) return;
    if (!activeModel) return;
    if (Object.keys(activeParams).length === 0) {
      setParams(getDefaultParamsForModel(activeModel));
    }
  }, [activeTool, toolId, activeModel, activeParams, setParams]);

  const layout = config.ui.layout;
  const showPayload = config.ui.showPayload;
  const showRegistryPanel =
    !hideModelPanel && config.capabilities.hasModels && config.models.length > 0;

  const spotlight = (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[420px]"
      style={{
        background: "var(--dash-theme-spotlight)",
        transition: "background 1.2s ease",
      }}
      aria-hidden
    />
  );

  const payloadPanel =
    showPayload && activeTool === toolId ? (
      <ApiPayloadPreview payload={realtimePayload} />
    ) : null;

  if (layout === "agent") {
    return (
      <div className={`relative min-h-0 flex-1 ${className}`} style={undefined}>
        {spotlight}
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">{children}</div>
        <div className="relative z-[1] px-4 pb-4 md:px-0">{payloadPanel}</div>
      </div>
    );
  }

  if (layout === "video-studio") {
    return (
      <div className={`relative flex min-h-0 flex-1 ${className}`}>
        {spotlight}
        {showRegistryPanel && <RegistryModelPanel models={config.models} />}
        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
          {!hideModelPanel && activeModel && (
            <div className="border-t border-white/[0.06] p-4 lg:hidden">
              <RegistryParamPanel model={activeModel} />
            </div>
          )}
          <div className="px-4 pb-4">{payloadPanel}</div>
        </div>
        {showRegistryPanel && activeModel && (
          <aside className="hidden w-[300px] shrink-0 border-l border-white/[0.06] p-4 lg:block">
            <label className="mb-4 flex flex-col gap-2">
              <span className="text-[11px] text-white/35">Prompt</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none rounded-[14px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-[color:var(--dash-theme-accent-30)]"
                placeholder="Beschreibe deine Szene…"
              />
            </label>
            <RegistryParamPanel model={activeModel} />
          </aside>
        )}
      </div>
    );
  }

  if (layout === "image-studio" || layout === "avatar") {
    return (
      <div className={`relative flex min-h-0 flex-1 flex-col lg:flex-row ${className}`}>
        {spotlight}
        <aside className="relative z-[1] w-full shrink-0 border-b border-white/[0.06] p-4 lg:w-[300px] lg:border-b-0 lg:border-r">
          {showRegistryPanel && (
            <RegistryModelPanel models={config.models} />
          )}
          {activeModel && <RegistryParamPanel model={activeModel} />}
        </aside>
        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
          <div className="px-4 pb-4">{payloadPanel}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {spotlight}
      <div className="relative z-[1]">{children}</div>
      {payloadPanel}
    </div>
  );
}
