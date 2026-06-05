"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

export function ThumbnailConceptDemo() {
  const t = useTranslations("landingPage.toolDemos.thumbnail");

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
      <div className="tool-demo-panel tool-demo-thumbnail p-5 md:p-6">
        <div
          className="tool-demo-line tool-demo-line--1 relative aspect-video rounded-xl overflow-hidden border border-white/10 mb-4"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-between px-5 md:px-8">
            <div className="space-y-2">
              <div className="h-5 md:h-6 w-28 md:w-36 rounded bg-[var(--accent,#B4FF00)] opacity-90" />
              <div className="h-3 md:h-4 w-20 md:w-28 rounded bg-white/80" />
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[color-mix(in_srgb,var(--accent,#B4FF00)_50%,transparent)] flex items-center justify-center text-2xl md:text-3xl">
              😱
            </div>
          </div>
        </div>
        <div className="tool-demo-line tool-demo-line--2 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-white/50 mr-1">{t("palette")}</span>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className="h-4 w-8 rounded"
              style={{ background: t(`swatch_${n}`) }}
            />
          ))}
          <span className="tool-demo-line tool-demo-line--3 ml-auto text-xs font-semibold text-[var(--accent,#B4FF00)]">
            CTR {t("ctr")}
          </span>
        </div>
      </div>
    </ToolDemoBeat>
  );
}
