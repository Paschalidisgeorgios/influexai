"use client";

import { useState } from "react";
import { useDashboardV2 } from "@/contexts/DashboardV2Context";

export function PayloadPanel() {
  const { payload, tool } = useDashboardV2();
  const [open, setOpen] = useState(false);

  if (!tool?.hasPayload) return null;

  return (
    <div className="shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2 font-mono text-[9px] tracking-wider text-white/25 transition-colors hover:text-white/45"
      >
        <span className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full opacity-70"
            style={{ background: "var(--dash-v2-accent)" }}
          />
          {"{ API PAYLOAD PREVIEW }"}
        </span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="max-h-44 overflow-auto border-t border-white/[0.04] bg-black/50 px-4 py-3">
          <pre
            className="font-mono text-[10px] leading-relaxed"
            style={{ color: "rgba(var(--dash-v2-rgb),0.7)" }}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
