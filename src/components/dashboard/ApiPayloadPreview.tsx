"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type ApiPayloadPreviewProps = {
  payload: Record<string, unknown>;
  defaultOpen?: boolean;
};

function stableKey(payload: Record<string, unknown>): string {
  return JSON.stringify(payload);
}

export function ApiPayloadPreview({
  payload,
  defaultOpen = false,
}: ApiPayloadPreviewProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [flash, setFlash] = useState(false);
  const prevKey = useRef(stableKey(payload));

  useEffect(() => {
    const nextKey = stableKey(payload);
    if (nextKey !== prevKey.current) {
      prevKey.current = nextKey;
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 450);
      return () => window.clearTimeout(t);
    }
  }, [payload]);

  const formatted = useMemo(
    () => JSON.stringify(payload, null, 2),
    [payload]
  );

  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]"
      style={{
        boxShadow: flash ? "0 0 24px rgba(var(--dash-theme-r), var(--dash-theme-g), var(--dash-theme-b), 0.12)" : undefined,
        transition: "box-shadow 0.35s ease",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-3 font-mono text-xs tracking-wider text-white/30 transition-colors hover:text-white/50"
      >
        <span>{"{ } API PAYLOAD PREVIEW"}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <pre
          className={`max-h-48 overflow-auto border-t border-white/[0.04] bg-black/40 p-4 font-mono text-xs text-green-400/70 transition-opacity duration-300 ${
            flash ? "opacity-100" : "opacity-90"
          }`}
        >
          {formatted}
        </pre>
      )}
    </div>
  );
}
