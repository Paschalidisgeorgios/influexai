"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LightFrame } from "@/components/LightFrame";
import { useDemoReveal } from "./use-demo-reveal";

const STEPS = ["step1", "step2", "step3"] as const;
const RESULTS = ["script", "thumbnail", "hashtags"] as const;

const TYPE_MS = 42;
const STEP_MS = 650;
const RESULT_DELAY_MS = 400;

function useAgentPlayback(active: boolean, taskLength: number) {
  const [typedChars, setTypedChars] = useState(0);
  const [doneSteps, setDoneSteps] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!active) {
      setTypedChars(0);
      setDoneSteps(0);
      setShowResult(false);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setTypedChars(taskLength);
      setDoneSteps(STEPS.length);
      setShowResult(true);
      return;
    }

    setTypedChars(0);
    setDoneSteps(0);
    setShowResult(false);

    let char = 0;
    const typeId = window.setInterval(() => {
      char += 1;
      setTypedChars(char);
      if (char >= taskLength) {
        window.clearInterval(typeId);
      }
    }, TYPE_MS);

    const typingDoneAt = taskLength * TYPE_MS + 280;
    const stepTimers: number[] = [];
    const resultTimer = window.setTimeout(() => {
      setShowResult(true);
    }, typingDoneAt + STEPS.length * STEP_MS + RESULT_DELAY_MS);

    STEPS.forEach((_, i) => {
      stepTimers.push(
        window.setTimeout(() => {
          setDoneSteps(i + 1);
        }, typingDoneAt + (i + 1) * STEP_MS)
      );
    });

    return () => {
      window.clearInterval(typeId);
      window.clearTimeout(resultTimer);
      stepTimers.forEach((id) => window.clearTimeout(id));
    };
  }, [active, taskLength]);

  return { typedChars, doneSteps, showResult };
}

export function AgentDemo() {
  const t = useTranslations("landingPage.toolDemos.agent");
  const { ref, visible } = useDemoReveal();
  const task = t("task");
  const { typedChars, doneSteps, showResult } = useAgentPlayback(visible, task.length);
  const typedTask = task.slice(0, typedChars);
  const typing = visible && typedChars < task.length;

  return (
    <div ref={ref} className={["tool-demo-beat", visible ? "is-visible" : ""].filter(Boolean).join(" ")}>
      <p className="tool-demo-beat__problem demo-heading">{t("problem")}</p>
      <LightFrame className="tool-demo-beat__frame rounded-2xl border border-white/[0.08] bg-[#111114]">
        <div className="tool-demo-panel agent-demo p-5 md:p-6 space-y-4">
          <div className="agent-demo__input rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 min-h-[44px]">
            <p className="text-xs text-white/80 leading-relaxed">
              {typedTask}
              {typing ? (
                <span
                  className="inline-block w-0.5 h-3.5 ml-0.5 align-middle bg-[var(--accent,#B4FF00)] animate-pulse"
                  aria-hidden
                />
              ) : null}
            </p>
          </div>

          <div className="space-y-2" aria-live="polite">
            {STEPS.map((step, i) => {
              const typingDone = typedChars >= task.length;
              const visible = typingDone && i <= doneSteps;
              const done = doneSteps > i || doneSteps === STEPS.length;

              if (!visible) return null;

              return (
                <div
                  key={step}
                  className={[
                    "agent-demo__step flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-opacity duration-300",
                    done
                      ? "border-[color-mix(in_srgb,var(--accent,#B4FF00)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent,#B4FF00)_6%,transparent)] opacity-100"
                      : "border-white/[0.07] bg-white/[0.02] opacity-70",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold",
                      done
                        ? "bg-[var(--accent,#B4FF00)] text-[#060608]"
                        : "border border-white/20 text-white/40",
                    ].join(" ")}
                    aria-hidden
                  >
                    {done ? "✓" : "·"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--accent,#B4FF00)]">
                      {t(`${step}_tool`)}
                    </p>
                    <p className="text-xs text-white/75 mt-0.5">{t(`${step}_status`)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {showResult ? (
            <div className="agent-demo__result grid gap-3 sm:grid-cols-3 pt-1">
              {RESULTS.map((block) => (
                <div
                  key={block}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"
                >
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--accent,#B4FF00)] mb-2">
                    {t(`result_${block}_label`)}
                  </p>
                  <p className="text-xs text-white/75 leading-relaxed whitespace-pre-line">
                    {t(`result_${block}_body`)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </LightFrame>
    </div>
  );
}
