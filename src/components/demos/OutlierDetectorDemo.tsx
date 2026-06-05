"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

const TAGS = ["tag1", "tag2", "tag3"] as const;

export function OutlierDetectorDemo() {
  const t = useTranslations("landingPage.toolDemos.outlier");

  return (
    <ToolDemoBeat
      problem={t("problem")}
      reverse
      benefit={
        <>
          {t("benefit_prefix")}{" "}
          <strong className="text-[var(--accent,#B4FF00)]">{t("benefit_number")}</strong>
          {t("benefit_suffix")}
        </>
      }
    >
      <div className="tool-demo-panel p-5 md:p-6">
        <div className="tool-demo-line tool-demo-line--1 flex justify-between items-start gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-white/95">{t("title")}</p>
            <p className="text-xs text-white/50 mt-1">{t("channel")}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-[var(--accent,#B4FF00)] leading-none">
              {t("score")}
            </p>
            <p className="text-xs text-white/45">/ 10</p>
          </div>
        </div>
        <div className="space-y-2">
          {TAGS.map((tag, i) => (
            <div
              key={tag}
              className={`tool-demo-line tool-demo-line--${i + 2} flex items-center gap-2`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent,#B4FF00)] shrink-0" />
              <span className="text-xs text-white/75">{t(tag)}</span>
            </div>
          ))}
        </div>
      </div>
    </ToolDemoBeat>
  );
}
