"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

export function ScriptGeneratorDemo() {
  const t = useTranslations("landingPage.toolDemos.script");

  return (
    <ToolDemoBeat
      problem={t("problem")}
      benefit={
        <>
          {t("benefit_prefix")}{" "}
          <strong className="text-[var(--accent,#B4FF00)]">{t("benefit_number")}</strong>
          {t("benefit_suffix")}
        </>
      }
    >
      <div className="tool-demo-panel tool-demo-script p-5 md:p-6">
        <div className="tool-demo-script__meta flex items-center gap-2 mb-4">
          <span className="tool-demo-tag tool-demo-tag--accent">HOOK</span>
          <span className="text-white/55 text-xs font-medium">{t("topic")}</span>
        </div>
        <p className="tool-demo-line tool-demo-line--1 text-sm text-white/90 leading-relaxed mb-4">
          {t("hook")}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="tool-demo-tag">MAIN</span>
        </div>
        <p className="tool-demo-line tool-demo-line--2 text-sm text-white/75 leading-relaxed mb-4">
          {t("main")}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="tool-demo-tag tool-demo-tag--cta">CTA</span>
        </div>
        <p className="tool-demo-line tool-demo-line--3 text-sm text-white/75 leading-relaxed">
          {t("cta")}
        </p>
        <div className="tool-demo-script__cursor mt-4 h-0.5 w-8 rounded-full bg-[var(--accent,#B4FF00)]" />
      </div>
    </ToolDemoBeat>
  );
}
