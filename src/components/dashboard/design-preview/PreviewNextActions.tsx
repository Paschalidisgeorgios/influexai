"use client";

/**
 * PreviewNextActions — bottom strip: recent assets + next actions.
 * MOCK — design-preview only.
 */

import { useLang, type PreviewView } from "./PreviewLang";
import {
  PREVIEW_ACCENT,
  PREVIEW_BODY,
  PREVIEW_DARK,
  PREVIEW_HL,
  PREVIEW_LIGHT_BORDER,
  PREVIEW_LIGHT_CARD,
  PREVIEW_META,
} from "./preview-tokens";

const RECENT = [
  { id: "1", label: "Beauty Campaign Visual", type: "Bild", ratio: "4:5" },
  { id: "2", label: "Product Reel Draft", type: "Video", ratio: "9:16" },
  { id: "3", label: "Hook Set — Skincare", type: "Text", ratio: "—" },
];

type Props = {
  onNavigate: (view: PreviewView) => void;
};

export function PreviewNextActions({ onNavigate }: Props) {
  const { t } = useLang();
  const n = t.commandOs.next;

  return (
    <section className="flex flex-col gap-6 border-t pt-8" style={{ borderColor: PREVIEW_LIGHT_BORDER }}>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: PREVIEW_META }}>
          {n.recentLabel}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {RECENT.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate("gallery")}
              className="flex items-center gap-3 rounded border px-3 py-3 text-left transition-colors hover:bg-white/40"
              style={{ borderColor: PREVIEW_LIGHT_BORDER, background: PREVIEW_LIGHT_CARD }}
            >
              <div
                className="h-12 w-10 shrink-0 rounded border"
                style={{ borderColor: PREVIEW_LIGHT_BORDER, background: "rgba(8,8,8,0.06)" }}
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium" style={{ color: PREVIEW_DARK, ...PREVIEW_HL }}>
                  {item.label}
                </p>
                <p className="font-mono text-[10px]" style={{ color: PREVIEW_META }}>
                  {item.type} · {item.ratio}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: PREVIEW_META }}>
          {n.actionsLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {n.actions.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded border px-3 py-2 text-[13px] font-medium transition-colors hover:bg-white/50"
              style={{ borderColor: PREVIEW_LIGHT_BORDER, color: PREVIEW_BODY }}
              onClick={() => onNavigate("tools")}
            >
              {action}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onNavigate("gallery")}
            className="rounded px-3 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: PREVIEW_ACCENT, color: PREVIEW_DARK }}
          >
            {n.galleryCta}
          </button>
        </div>
      </div>
    </section>
  );
}
