"use client";

/**
 * PreviewProductionHub — MVP workflows as production paths, not tool flood.
 * MOCK — /dashboard/design-preview only.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLang } from "./PreviewLang";
import {
  PREVIEW_ACCENT,
  PREVIEW_HL,
  PREVIEW_IVORY_BORDER,
  PREVIEW_IVORY_CARD,
  PREVIEW_IVORY_META,
  PREVIEW_SHELL_TEXT,
  PREVIEW_SHELL_TEXT_MUTED,
} from "./preview-tokens";
import { PREVIEW_MVP_WORKFLOWS, PREVIEW_PREP_WORKFLOWS } from "./preview-mvp-routes";

export function PreviewProductionHub() {
  const { t } = useLang();
  const p = t.productionHub;

  return (
    <div className="flex min-w-0 flex-col gap-10">
      <header className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: PREVIEW_IVORY_META }}>
          {p.overline}
        </p>
        <h1
          className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.02em]"
          style={{ color: PREVIEW_SHELL_TEXT, ...PREVIEW_HL }}
        >
          {p.headline}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: PREVIEW_SHELL_TEXT_MUTED }}>
          {p.subline}
        </p>
      </header>

      <section className="min-w-0">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: PREVIEW_IVORY_META }}>
          {p.mvpLabel}
        </p>
        <ul className="flex flex-col gap-2">
          {PREVIEW_MVP_WORKFLOWS.map((flow) => (
            <li key={flow.id}>
              <Link
                href={flow.href}
                className="group flex min-w-0 flex-col gap-2 rounded border px-4 py-4 transition-colors hover:border-white/20 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                style={{
                  borderColor: PREVIEW_IVORY_BORDER,
                  background: PREVIEW_IVORY_CARD,
                }}
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold" style={{ color: PREVIEW_SHELL_TEXT, ...PREVIEW_HL }}>
                    {flow.label}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: PREVIEW_SHELL_TEXT_MUTED }}>
                    {flow.desc}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: PREVIEW_IVORY_META }}>
                    {flow.engine}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 self-start text-[13px] font-medium sm:self-center"
                  style={{ color: PREVIEW_ACCENT }}
                >
                  {p.openCta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="rounded border px-4 py-5 sm:px-5"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: PREVIEW_IVORY_META }}>
          {p.prepLabel}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: PREVIEW_SHELL_TEXT_MUTED }}>
          {p.prepCopy}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {PREVIEW_PREP_WORKFLOWS.map((name) => (
            <li
              key={name}
              className="rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                color: "rgba(245,242,234,0.42)",
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
