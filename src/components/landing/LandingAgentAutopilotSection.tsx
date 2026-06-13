"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { AcidMotionButton } from "@/components/ui/AcidMotionButton";
import { useIntentTracking } from "@/hooks/useIntentTracking";

const RESPONSE_LINES = [
  "line_1",
  "line_2",
  "line_3",
  "line_4",
  "line_5",
  "line_6",
  "line_7",
  "line_8",
] as const;

const FEATURE_KEYS = ["f1", "f2", "f3"] as const;

export function LandingAgentAutopilotSection() {
  const t = useTranslations("landingPage.agentAutopilot");
  const { getIntentHref } = useIntentTracking();
  const [visibleLines, setVisibleLines] = useState(0);
  const [active, setActive] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setVisibleLines(0);
          setActive(true);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!startedRef.current) return;
    if (visibleLines >= RESPONSE_LINES.length) {
      setActive(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleLines((n) => n + 1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [visibleLines]);

  return (
    <section
      ref={sectionRef}
      id="agent-autopilot"
      className="border-y border-[#B4FF00]/10 bg-[#0a0a0c] px-4 py-8 md:px-6 md:py-10 lg:px-10 lg:py-16"
      aria-labelledby="agent-autopilot-heading"
    >
      <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <SpringReveal>
          <p
            className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#B4FF00]"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            {t("kicker")}
          </p>
          <h2
            id="agent-autopilot-heading"
            className="whitespace-pre-line font-[family-name:var(--font-bebas)] text-[clamp(28px,6vw,52px)] leading-[0.95] tracking-[0.02em] text-white"
          >
            {t("headline")}
          </h2>
          <p
            className="mt-5 max-w-[52ch] text-sm leading-relaxed text-white/60 md:text-[0.95rem]"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            {t("description")}
          </p>
          <ul className="mt-6 space-y-3">
            {FEATURE_KEYS.map((key) => (
              <li
                key={key}
                className="flex items-start gap-3 text-sm text-white/75"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#B4FF00]"
                  aria-hidden
                />
                {t(`feature_${key}`)}
              </li>
            ))}
          </ul>
          <AcidMotionButton
            href={getIntentHref("/dashboard")}
            className="btn-acid mt-8 min-h-[48px] w-full justify-center md:w-auto"
          >
            {t("cta")}
          </AcidMotionButton>
        </SpringReveal>

        <SpringReveal delay={0.12}>
          <div
            className="rounded-2xl border border-[#B4FF00]/15 bg-[#0d0d0f] p-5 md:p-6"
            role="presentation"
          >
            <div
              className="mb-4 rounded-xl border border-white/[0.08] bg-[#B4FF00]/[0.06] px-4 py-3 text-sm text-white/85"
              style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#B4FF00]/80">
                Du
              </span>
              <p className="mt-1 leading-relaxed">{t("demo_user")}</p>
            </div>

            <div
              className="max-h-[240px] overflow-y-auto rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 md:max-h-none"
              style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/45">
                Agent Autopilot
              </span>
              <div className="mt-2 space-y-1.5 text-[0.82rem] leading-relaxed text-white/80">
                {RESPONSE_LINES.map((key, index) => {
                  const text = t(`demo_${key}`);
                  const shown = index < visibleLines;
                  if (!text.trim()) {
                    return shown ? <div key={key} className="h-1" aria-hidden /> : null;
                  }
                  return (
                    <p
                      key={key}
                      className={`transition-all duration-300 ${
                        shown
                          ? "animate-[fade-in-up_0.3s_ease_both] opacity-100"
                          : "opacity-0"
                      }`}
                    >
                      {shown ? text : "\u00A0"}
                    </p>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[0.72rem] text-white/45">
              <span
                className={`h-2 w-2 rounded-full bg-[#B4FF00] ${
                  active ? "animate-pulse" : ""
                }`}
                aria-hidden
              />
              <span style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}>
                {t("demo_status")}
              </span>
            </div>
          </div>
        </SpringReveal>
      </div>
    </section>
  );
}
