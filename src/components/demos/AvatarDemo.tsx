"use client";

import { useTranslations } from "next-intl";
import { ToolDemoBeat } from "./ToolDemoBeat";

export function AvatarDemo() {
  const t = useTranslations("landingPage.toolDemos.avatar");

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
        <div className="tool-demo-line tool-demo-line--1 flex items-center gap-2 mb-4">
          <span className="h-2 w-2 rounded-full bg-[var(--accent,#B4FF00)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--accent,#B4FF00)]">{t("status")}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-white/45 mb-2">{t("before_label")}</p>
            <div className="mx-auto w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center text-2xl opacity-60">
              📷
            </div>
            <p className="text-xs text-white/50 mt-2">{t("before_caption")}</p>
          </div>
          <span className="tool-demo-line tool-demo-line--2 text-[var(--accent,#B4FF00)] text-lg">→</span>
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent,#B4FF00)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent,#B4FF00)_6%,transparent)] p-4 text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-[var(--accent,#B4FF00)] mb-2">{t("after_label")}</p>
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-[var(--accent,#B4FF00)] bg-[#1a1a2e] flex items-center justify-center text-2xl">
              👤
            </div>
            <p className="text-xs text-white/75 mt-2">{t("after_caption")}</p>
          </div>
        </div>
        <div className="tool-demo-line tool-demo-line--3 mt-4 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="tool-demo-avatar__progress h-full rounded-full bg-[var(--accent,#B4FF00)]" />
        </div>
      </div>
    </ToolDemoBeat>
  );
}
