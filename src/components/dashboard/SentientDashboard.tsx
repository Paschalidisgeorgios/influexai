"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronRight, Zap, Menu, X } from "lucide-react";
import {
  TOOL_CONFIGS,
  TOOL_CATEGORIES,
  getDefaultFieldValues,
  getToolsByCategory,
  type ToolType,
  type CustomField,
} from "@/lib/dashboard/tool-configs";

const THEMES = [
  { name: "Matrix Green", primary: "#00FF66", rgb: "0,255,102" },
  { name: "AI Blue", primary: "#0066FF", rgb: "0,102,255" },
  { name: "AI Yellow", primary: "#FFD700", rgb: "255,215,0" },
] as const;

const SCROLL_MESSAGES = [
  "Langsamer! Meine Quantenprozessoren brauchen Zeit. 🧠",
  "Nicht so hastig durch die Modelle! ⏱️",
  "Scroll-Geschwindigkeit kritisch. KI kalibriert... 🔄",
] as const;

const IDLE_MESSAGES = [
  "AI CORE: ACTIVE",
  "RENDERING ENGINE: ONLINE",
  "AWAITING INPUT...",
  "MODELS CALIBRATED ✓",
] as const;

function CustomFieldControl({
  field,
  value,
  themePrimary,
  onChange,
}: {
  field: CustomField;
  value: string | number | boolean;
  themePrimary: string;
  onChange: (next: string | number | boolean) => void;
}) {
  if (field.type === "select") {
    return (
      <div>
        <label className="mb-1.5 block text-[11px] text-white/40">{field.label}</label>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-[#0d0d10] px-3 py-2 text-sm text-white/80 outline-none"
          style={{ cursor: "default" }}
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "slider") {
    const num = typeof value === "number" ? value : Number(value);
    return (
      <div>
        <div className="mb-1.5 flex justify-between">
          <label className="text-[11px] text-white/40">{field.label}</label>
          <span className="font-mono text-[11px]" style={{ color: themePrimary }}>
            {num}
          </span>
        </div>
        <input
          type="range"
          min={field.min}
          max={field.max}
          value={num}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 w-full appearance-none rounded-full bg-white/10"
          style={{ accentColor: themePrimary, cursor: "default" }}
        />
        <div className="mt-0.5 flex justify-between">
          <span className="text-[9px] text-white/20">{field.min}</span>
          <span className="text-[9px] text-white/20">{field.max}</span>
        </div>
      </div>
    );
  }

  const checked = Boolean(value);
  return (
    <div className="flex items-center justify-between">
      <label className="text-[11px] text-white/40">{field.label}</label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "" : "bg-white/10"
        }`}
        style={{
          background: checked ? themePrimary : undefined,
          cursor: "default",
        }}
        aria-label={field.label}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#070708] transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SentientDashboard() {
  const [activeTab, setActiveTab] = useState<ToolType>("agent-autopilot");
  const [activeModel, setActiveModel] = useState<string>("seedance-2.0-fast");
  const [prompt, setPrompt] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string | number | boolean>>(
    () => getDefaultFieldValues("agent-autopilot")
  );
  const [badgeText, setBadgeText] = useState<string>("AI CORE: ACTIVE");
  const [isPulsing, setIsPulsing] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [themeIndex, setThemeIndex] = useState<number>(0);
  const [payloadOpen, setPayloadOpen] = useState(false);

  const lastScrollY = useRef<number>(0);
  const badgeCooldown = useRef<boolean>(false);
  const lastMouseX = useRef<number>(0);
  const lastMouseY = useRef<number>(0);
  const mouseMoveCount = useRef<number>(0);
  const mouseWindowStart = useRef<number>(Date.now());
  const idleIndex = useRef<number>(0);
  const lastBehaviorAt = useRef<number>(Date.now());
  const cooldownTimer = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);

  const theme = THEMES[themeIndex];
  const config = TOOL_CONFIGS[activeTab];

  const activeModelMeta = useMemo(
    () => config.allowedModels.find((m) => m.id === activeModel) ?? config.allowedModels[0],
    [config.allowedModels, activeModel]
  );

  const livePayload = useMemo(
    () => ({
      tool: activeTab,
      model: activeModel,
      prompt: prompt || null,
      params: fieldValues,
    }),
    [activeTab, activeModel, prompt, fieldValues]
  );

  const showBadgeMessage = useCallback((text: string, options?: { skipCooldown?: boolean }) => {
    setBadgeText(text);
    lastBehaviorAt.current = Date.now();
    setIsPulsing(true);
    if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setIsPulsing(false), 400);

    if (!options?.skipCooldown) {
      badgeCooldown.current = true;
      if (cooldownTimer.current) window.clearTimeout(cooldownTimer.current);
      cooldownTimer.current = window.setTimeout(() => {
        badgeCooldown.current = false;
      }, 6000);
    }
  }, []);

  const switchTab = useCallback(
    (toolId: ToolType) => {
      const next = TOOL_CONFIGS[toolId];
      setActiveTab(toolId);
      setActiveModel(next.defaultModel);
      setPrompt("");
      setFieldValues(getDefaultFieldValues(toolId));
      setSidebarOpen(false);
      showBadgeMessage(`${next.title} geladen. Bereit. ✓`, { skipCooldown: true });
    },
    [showBadgeMessage]
  );

  useEffect(() => {
    switchTab("agent-autopilot");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount init only
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setThemeIndex((prev) => (prev + 1) % THEMES.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = Math.abs(y - lastScrollY.current);
      lastScrollY.current = y;

      if (delta > 300 && !badgeCooldown.current) {
        const msg = SCROLL_MESSAGES[Math.floor(Math.random() * SCROLL_MESSAGES.length)];
        showBadgeMessage(msg);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showBadgeMessage]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - lastMouseX.current);
      const dy = Math.abs(e.clientY - lastMouseY.current);
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;

      const now = Date.now();
      if (now - mouseWindowStart.current > 1000) {
        mouseMoveCount.current = 0;
        mouseWindowStart.current = now;
      }

      if (dx + dy > 50) {
        mouseMoveCount.current += 1;
      }

      if (mouseMoveCount.current > 10 && !badgeCooldown.current) {
        showBadgeMessage("Hektische Mausbewegungen erkannt. Alles okay? ⏱️");
        mouseMoveCount.current = 0;
        mouseWindowStart.current = now;
      }
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [showBadgeMessage]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (badgeCooldown.current) return;
      if (Date.now() - lastBehaviorAt.current < 8000) return;
      idleIndex.current = (idleIndex.current + 1) % IDLE_MESSAGES.length;
      setBadgeText(IDLE_MESSAGES[idleIndex.current]);
    }, 8000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(
    () => () => {
      if (cooldownTimer.current) window.clearTimeout(cooldownTimer.current);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    },
    []
  );

  return (
    <div
      className={`flex h-screen overflow-hidden bg-[#070708] text-white transition-transform duration-200 ${
        isPulsing ? "scale-[1.004]" : "scale-100"
      }`}
      style={{ cursor: "default" }}
    >
      <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2 select-none">
        <div
          className="flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-xl"
          style={{
            borderColor: `rgba(${theme.rgb},0.35)`,
            background: "rgba(7,7,8,0.85)",
            boxShadow: `0 0 20px rgba(${theme.rgb},0.15)`,
          }}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className="absolute inset-0 animate-ping rounded-full opacity-70"
              style={{ background: theme.primary }}
            />
            <span className="relative h-2 w-2 rounded-full" style={{ background: theme.primary }} />
          </span>
          <span
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: theme.primary }}
          >
            {badgeText}
          </span>
        </div>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Sidebar schließen"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-40 flex h-full w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#050507] transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          <div className="flex items-center gap-2">
            <Zap size={18} style={{ color: theme.primary }} aria-hidden />
            <span className="font-display text-lg tracking-wide text-white">
              INFLUEX<span style={{ color: theme.primary }}>AI</span>
            </span>
          </div>
          <button
            type="button"
            className="text-white/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Menü schließen"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {TOOL_CATEGORIES.map((category) => {
            const tools = getToolsByCategory(category);
            if (tools.length === 0) return null;
            return (
              <div key={category} className="mb-4">
                <p className="px-2 py-1.5 text-[9px] tracking-[2px] text-white/25 uppercase">
                  {category}
                </p>
                <div className="space-y-0.5">
                  {tools.map((tool) => {
                    const active = tool.id === activeTab;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => switchTab(tool.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] transition-colors ${
                          active
                            ? "bg-white/[0.06] font-medium text-white"
                            : "text-white/40 hover:text-white/70"
                        }`}
                        style={{
                          borderLeft: active
                            ? `2px solid ${theme.primary}`
                            : "2px solid transparent",
                          cursor: "default",
                        }}
                      >
                        <span>{tool.icon}</span>
                        <span className="truncate">{tool.title}</span>
                        {active && (
                          <ChevronRight size={12} className="ml-auto opacity-50" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-bold">
              G
            </div>
            <div>
              <p className="text-[11px] font-medium text-white">Georgios</p>
              <p className="text-[10px] text-white/35">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-20 rounded-lg border border-white/10 bg-[#0d0d10] p-2 text-white/60 lg:hidden"
          aria-label="Menü öffnen"
          style={{ cursor: "default" }}
        >
          <Menu size={20} />
        </button>

        <main className="mt-16 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl tracking-tight text-white">{config.title}</h1>
              {activeModelMeta && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    background:
                      activeModelMeta.type === "video"
                        ? "rgba(0,102,255,0.12)"
                        : "rgba(0,255,102,0.12)",
                    color: activeModelMeta.type === "video" ? "#0066FF" : "#00FF66",
                  }}
                >
                  {activeModelMeta.type === "video" ? "Video" : "Image"}
                </span>
              )}
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {config.allowedModels.map((model) => {
                const selected = model.id === activeModel;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setActiveModel(model.id)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] transition-all ${
                      selected ? "font-semibold" : "border-white/10 text-white/40"
                    }`}
                    style={{
                      cursor: "default",
                      ...(selected
                        ? {
                            background: `rgba(${theme.rgb},0.12)`,
                            borderColor: `rgba(${theme.rgb},0.35)`,
                            color: theme.primary,
                            boxShadow: `0 0 16px rgba(${theme.rgb},0.15)`,
                          }
                        : {}),
                    }}
                  >
                    {model.name}
                    <span className="ml-1.5 text-[8px] uppercase opacity-60">
                      {model.type === "video" ? "VIDEO" : "IMAGE"}
                    </span>
                  </button>
                );
              })}
            </div>

            {config.options.hasPromptInput && (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={config.options.promptPlaceholder}
                className="mb-6 min-h-[100px] w-full resize-none rounded-xl border border-white/[0.08] bg-[#0d0d10] p-4 text-sm text-white/85 outline-none placeholder:text-white/25"
                style={{ cursor: "text" }}
              />
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {config.options.customFields.map((field) => (
                <CustomFieldControl
                  key={field.id}
                  field={field}
                  value={fieldValues[field.id] ?? field.defaultValue}
                  themePrimary={theme.primary}
                  onChange={(next) =>
                    setFieldValues((prev) => ({ ...prev, [field.id]: next }))
                  }
                />
              ))}
            </div>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-[#070708] transition-all hover:opacity-90"
              style={{
                background: theme.primary,
                boxShadow: `0 0 24px rgba(${theme.rgb},0.3)`,
                cursor: "default",
              }}
              onClick={() => showBadgeMessage(`Generiere mit ${activeModel}... ✓`)}
              aria-label={`${config.title} generieren`}
            >
              <Zap size={16} aria-hidden="true" />
              GENERIEREN
            </button>

            <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0a0d]">
              <button
                type="button"
                onClick={() => setPayloadOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-2.5 font-mono text-[10px] tracking-wider text-white/35"
                style={{ cursor: "default" }}
              >
                <span>{"{ API PAYLOAD }"}</span>
                <span className={`transition-transform ${payloadOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {payloadOpen && (
                <pre className="max-h-48 overflow-auto border-t border-white/[0.06] p-4 font-mono text-[10px] leading-relaxed text-[#00FF66]/75">
                  {JSON.stringify(livePayload, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
