"use client";

/**
 * PreviewAdvancedSettings — collapsible power-user controls.
 * MOCK — design-preview only; models not promoted in main UI.
 */

import { useState, type ReactNode } from "react";
import { useLang } from "./PreviewLang";
import {
  PREVIEW_BODY,
  PREVIEW_LIGHT_BORDER,
  PREVIEW_LIGHT_CARD,
  PREVIEW_META,
} from "./preview-tokens";

const MODELS = ["Flux Dev", "Kling 2.1", "Seedance Pro", "Akool Avatar"];
const PROVIDERS = ["fal.ai", "Replicate", "InfluexAI Gateway"];

export function PreviewAdvancedSettings() {
  const { t } = useLang();
  const c = t.commandOs.advanced;
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded border"
      style={{ borderColor: PREVIEW_LIGHT_BORDER, background: PREVIEW_LIGHT_CARD }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-medium"
        style={{ color: PREVIEW_BODY }}
      >
        {c.label}
        <span className="font-mono text-[11px]" style={{ color: PREVIEW_META }}>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div
          className="grid gap-4 border-t px-4 py-4 sm:grid-cols-2"
          style={{ borderColor: PREVIEW_LIGHT_BORDER }}
        >
          <Field label={c.model}>
            <select className={selectCls}>
              {MODELS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label={c.provider}>
            <select className={selectCls}>
              {PROVIDERS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label={c.seed}>
            <input type="text" className={inputCls} defaultValue="42891" />
          </Field>
          <Field label={c.resolution}>
            <select className={selectCls}>
              <option>1024 × 1024</option>
              <option>1080 × 1920</option>
              <option>1920 × 1080</option>
            </select>
          </Field>
          <Field label={c.duration}>
            <select className={selectCls}>
              <option>5 s</option>
              <option>10 s</option>
            </select>
          </Field>
          <Field label={c.credits}>
            <input type="text" className={inputCls} defaultValue="12" readOnly />
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: PREVIEW_META }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded border bg-white/60 px-3 py-2 text-[13px] outline-none focus:border-neutral-400";
const selectCls = inputCls;
