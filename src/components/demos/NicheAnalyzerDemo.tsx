"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

const ROWS = ["row1", "row2", "row3"] as const;

export function NicheAnalyzerDemo() {
  const t = useTranslations("landingPage.toolDemos.niche");

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
      <div className="tool-demo-panel p-5 md:p-6 space-y-3">
        {ROWS.map((row, i) => (
          <div
            key={row}
            className={`tool-demo-line tool-demo-line--${i + 1} flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3`}
          >
            <span className="text-sm font-medium text-white/90">{t(`${row}_name`)}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: i === 1 ? "#fbbf24" : "#4ade80",
                  background:
                    i === 1 ? "rgba(251,191,36,0.15)" : "rgba(74,222,128,0.15)",
                }}
              >
                {t(`${row}_comp`)}
              </span>
              <span className="text-[var(--accent,#B4FF00)] text-xs font-bold">
                {t(`${row}_stars`)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ToolDemoBeat>
  );
}
