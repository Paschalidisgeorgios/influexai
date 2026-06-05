"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ToolDemoBeat, useDemoVisible } from "./ToolDemoBeat";

const METRICS = ["script", "thumbnail", "niche"] as const;
const TARGET_SCORE = 87;
const ARC_LENGTH = 264;

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    const totalFrames = 36;
    const id = window.setInterval(() => {
      frame += 1;
      const next = Math.min(target, Math.round((target * frame) / totalFrames));
      setValue(next);
      if (frame >= totalFrames) window.clearInterval(id);
    }, 35);

    return () => window.clearInterval(id);
  }, [active, target]);

  return value;
}

function ViralScoreVisual() {
  const t = useTranslations("landingPage.toolDemos.viralscore");
  const visible = useDemoVisible();
  const score = useCountUp(TARGET_SCORE, visible);
  const arcOffset = ARC_LENGTH * (1 - score / 100);

  return (
    <div className="tool-demo-panel p-5 md:p-6 flex flex-col sm:flex-row gap-6 items-center">
      <div className="tool-demo-line tool-demo-line--1 relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--accent, #B4FF00)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={arcOffset}
            className="tool-demo-viral__arc transition-[stroke-dashoffset] duration-100 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-[var(--accent,#B4FF00)]">
            {score}
          </span>
          <span className="text-[0.65rem] text-white/45 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-3">
        {METRICS.map((m, i) => (
          <div key={m} className={`tool-demo-line tool-demo-line--${i + 2}`}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/65">{t(`${m}_label`)}</span>
              <span className="font-semibold text-[var(--accent,#B4FF00)]">{t(`${m}_value`)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="tool-demo-viral__bar h-full rounded-full bg-[var(--accent,#B4FF00)]"
                style={{ width: visible ? t(`${m}_pct`) : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ViralScoreDemo() {
  const t = useTranslations("landingPage.toolDemos.viralscore");

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
      <ViralScoreVisual />
    </ToolDemoBeat>
  );
}
