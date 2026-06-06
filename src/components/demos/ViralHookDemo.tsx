"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

export function ViralHookDemo() {
  const t = useTranslations("landingPage.toolDemos.viralHook");

  return (
    <ToolDemoBeat
      problem={t("problem")}
      benefit={
        <>
          {t("benefit_prefix")}{" "}
          <strong className="text-[var(--accent,#B4FF00)]">{t("benefit_highlight")}</strong>
          {t("benefit_suffix")}
        </>
      }
    >
      <div className="tool-demo-panel p-5 md:p-6 space-y-3">
        <p className="text-xs text-white/45 truncate">{t("url")}</p>
        <div className="tool-demo-line tool-demo-line--1 rounded-lg border border-[#B4FF00]/25 bg-[#B4FF00]/10 px-3 py-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[#B4FF00] mb-1">
            Hook · 3 Sek
          </p>
          <p className="text-sm text-white/90">{t("hook")}</p>
        </div>
        <div className="tool-demo-line tool-demo-line--2 text-xs text-white/70 space-y-1">
          <p>
            <span className="text-white/45">Problem →</span> {t("problem_line")}
          </p>
          <p>
            <span className="text-white/45">CTA →</span> {t("cta_line")}
          </p>
        </div>
      </div>
    </ToolDemoBeat>
  );
}
