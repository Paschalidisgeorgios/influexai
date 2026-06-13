"use client";

import { useEffect, useMemo, useState } from "react";

function highlightJson(json: string): string {
  return json
    .replace(/"([^"]+)":/g, '<span style="color:rgba(0,102,255,0.8)">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:rgba(0,255,102,0.7)">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span style="color:rgba(255,165,0,0.8)">$1</span>')
    .replace(/: (null|true|false)/g, ': <span style="color:rgba(153,0,255,0.7)">$1</span>');
}

interface PayloadPanelProps {
  payload: Record<string, unknown>;
  rgb: string;
  embedded?: boolean;
}

export function PayloadPanel({ payload, rgb, embedded = false }: PayloadPanelProps) {
  const [open, setOpen] = useState(false);
  const [debouncedJson, setDebouncedJson] = useState("");

  const rawJson = useMemo(() => JSON.stringify(payload, null, 2), [payload]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedJson(rawJson), 50);
    return () => clearTimeout(t);
  }, [rawJson]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(rawJson);
  };

  return (
    <div
      className={`overflow-hidden ${embedded ? "relative w-full rounded-xl border border-white/[0.06]" : "absolute bottom-0 left-0 right-0 z-20"}`}
      style={{
        height: open ? "220px" : "32px",
        transition: "height 0.3s ease",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between px-4 font-mono text-[9px] tracking-wider text-white/60"
        style={{
          background: open ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
          backdropFilter: open ? "blur(4px)" : undefined,
          borderTop: open ? `0.5px solid rgba(${rgb},0.15)` : "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: `rgb(${rgb})` }}
          />
          Technische Vorschau
        </span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="relative h-[188px]">
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-3 z-10 rounded border border-white/10 px-2 py-0.5 font-mono text-[8px] text-white/70 hover:text-white/90"
          >
            Kopieren
          </button>
          <div
            className="h-full max-h-[180px] overflow-y-auto px-4 py-3"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <pre
              className="font-mono text-[10px] leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightJson(debouncedJson) }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
