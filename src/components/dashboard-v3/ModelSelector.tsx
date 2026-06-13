"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  AI_MODELS,
  THEME_COLORS,
} from "@/lib/dashboard-v3/registry";
import { useScrollVelocity } from "@/lib/dashboard-v3/useScrollVelocity";
import { useDashboardV3 } from "@/lib/dashboard-v3/context";
import { ModelCard } from "./ModelCard";

export function ModelSelector() {
  const {
    activeModelId,
    selectModel,
    capsule,
    modelSheetOpen,
    setModelSheetOpen,
  } = useDashboardV3();

  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AI_MODELS;
    return AI_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [query]);

  const providers = useMemo(() => {
    const set = new Set(filtered.map((m) => m.provider));
    return Array.from(set);
  }, [filtered]);

  const onFastScroll = useCallback(() => {
    capsule.showMessage(
      "Bitte etwas langsamer scrollen.",
      4000,
      5
    );
  }, [capsule]);

  useScrollVelocity(listRef, { onFast: onFastScroll });

  const content = (
    <>
      <div className="border-b px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Modelle suchen..."
          className="w-full rounded-xl border bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/45"
          style={{ borderColor: "rgba(255,255,255,0.08)", fontSize: "14px" }}
        />
      </div>
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-2">
        {providers.map((provider) => (
          <div key={provider}>
            <p className="px-4 py-2 text-[9px] tracking-[2px] text-white/45 uppercase">
              {provider}
            </p>
            {filtered
              .filter((m) => m.provider === provider)
              .map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  theme={THEME_COLORS[model.themeKey]}
                  active={model.id === activeModelId}
                  onSelect={(id) => {
                    selectModel(id);
                    setModelSheetOpen(false);
                  }}
                  onLongHover={() =>
                    capsule.showMessage(
                      "Tipp: Modell antippen zum Auswählen.",
                      3000,
                      2
                    )
                  }
                />
              ))}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      <aside
        className="hidden h-full w-[320px] shrink-0 flex flex-col border-r backdrop-blur-[20px] lg:flex"
        style={{
          background: "rgba(255,255,255,0.015)",
          borderRightWidth: "0.5px",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {content}
      </aside>

      {modelSheetOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setModelSheetOpen(false)}
            aria-label="Schließen"
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[60vh] flex-col rounded-t-2xl border-t backdrop-blur-[20px] lg:hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            {content}
          </div>
        </>
      )}
    </>
  );
}
