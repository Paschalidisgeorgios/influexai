"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

const ROWS = ["row1", "row2", "row3"] as const;

export function ContentKalenderDemo() {
  const t = useTranslations("landingPage.toolDemos.contentKalender");

  return (
    <ToolDemoBeat
      problem={t("problem")}
      reverse
      benefit={
        <>
          {t("benefit_prefix")}{" "}
          <strong className="text-[var(--accent,#B4FF00)]">{t("benefit_highlight")}</strong>
          {t("benefit_suffix")}
        </>
      }
    >
      <div className="tool-demo-panel p-5 md:p-6">
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
          <span className="text-white/40 font-bold">Tag</span>
          <span className="text-white/40 font-bold">Thema + Hook</span>
          {ROWS.map((row, i) => (
            <div key={row} className="contents">
              <span
                className={`tool-demo-line tool-demo-line--${i + 1} text-[#B4FF00] font-bold`}
              >
                {t(`${row}_day`)}
              </span>
              <div className={`tool-demo-line tool-demo-line--${i + 1} text-white/80`}>
                <p className="font-medium">{t(`${row}_topic`)}</p>
                <p className="text-white/50 mt-0.5">{t(`${row}_hook`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToolDemoBeat>
  );
}
