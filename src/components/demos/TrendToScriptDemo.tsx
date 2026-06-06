"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

export function TrendToScriptDemo() {
  const t = useTranslations("landingPage.toolDemos.trendToScript");

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
        <div className="tool-demo-line tool-demo-line--1 flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <span className="text-sm font-semibold text-white/90">{t("trend")}</span>
          <span className="text-white/40 text-xs">×</span>
          <span className="text-sm text-[#B4FF00]">{t("niche")}</span>
        </div>
        <div className="tool-demo-line tool-demo-line--2 rounded-lg bg-white/5 px-3 py-2 border border-white/10">
          <p className="text-[0.65rem] font-bold text-[#B4FF00] mb-1">[HOOK]</p>
          <p className="text-xs text-white/85">{t("hook")}</p>
        </div>
        <div className="tool-demo-line tool-demo-line--3 rounded-lg bg-white/5 px-3 py-2 border border-white/10">
          <p className="text-[0.65rem] font-bold text-white/50 mb-1">[MAIN]</p>
          <p className="text-xs text-white/70 line-clamp-2">{t("main")}</p>
        </div>
      </div>
    </ToolDemoBeat>
  );
}
