"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  STACKED_DEMO_STEP_IDS,
  STACKED_SCORE_KEYS,
  type StackedDemoStepId,
} from "@/data/landingAgentDemos";

const STEP_COUNT = STACKED_DEMO_STEP_IDS.length;

const SCORE_LABEL_KEYS: Record<string, string> = {
  hook: "scoreHook",
  clarity: "scoreClarity",
  risk: "scoreRisk",
  scroll_stop: "scoreScrollStop",
  plan: "scorePlan",
  platform: "scorePlatform",
  consistency: "scoreConsistency",
  consent: "scoreConsent",
};

type DemoStep = {
  id: StackedDemoStepId;
  headline: string;
  description: string;
  badge: string;
  input: ReactNode;
  agentDecisions: string[];
  output: ReactNode;
  scores: { label: string; value: string }[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DemoBadge({ children }: { children: string }) {
  return (
    <span
      className="mb-3 inline-block rounded-[6px] px-2 py-0.5 text-[0.66rem] font-bold uppercase tracking-[0.08em]"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.14)",
        color: "rgba(255,255,255,0.55)",
      }}
    >
      {children}
    </span>
  );
}

function AgentPill({ children }: { children: string }) {
  return (
    <span
      className="inline-block rounded-[6px] px-2.5 py-1 text-xs"
      style={{
        background: "rgba(180,255,0,0.1)",
        border: "1px solid rgba(180,255,0,0.3)",
        color: "#B4FF00",
      }}
    >
      {children}
    </span>
  );
}

function ScoreRow({ scores }: { scores: DemoStep["scores"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {scores.map((s) => (
        <span
          key={s.label}
          className="rounded-full px-2.5 py-1 text-[0.7rem] font-semibold"
          style={{
            background: "rgba(180,255,0,0.08)",
            border: "1px solid rgba(180,255,0,0.22)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {s.label} {s.value}
        </span>
      ))}
    </div>
  );
}

function useDemoSteps(): DemoStep[] {
  const t = useTranslations("landingPage.demos");
  const tl = useTranslations("landingPage.demos.labels");

  return STACKED_DEMO_STEP_IDS.map((id) => {
    const prefix = `stacked.${id}`;
    const agentDecisions = t.raw(`${prefix}.agentDecisions`) as string[];
    const scoreKeys = STACKED_SCORE_KEYS[id];
    const scores = scoreKeys.map((key) => ({
      label: tl(SCORE_LABEL_KEYS[key] ?? key),
      value: t(`${prefix}.scores.${key}`),
    }));

    let output: ReactNode;

    if (id === "script" || id === "product") {
      output = (
        <>
          <p className="mb-2">
            <span style={{ color: "#B4FF00" }}>{tl("hook")}:</span>
            <br />
            &quot;{t(`${prefix}.outputHook`)}&quot;
          </p>
          {id === "product" ? (
            <p className="mb-2">
              <span style={{ color: "#B4FF00" }}>{tl("spot")}:</span>
              <br />
              {t(`${prefix}.outputSpot`)}
            </p>
          ) : (
            <p className="mb-2">
              <span style={{ color: "#B4FF00" }}>{tl("story")}:</span>
              <br />
              {t(`${prefix}.outputStory`)}
            </p>
          )}
          <p>
            <span style={{ color: "#B4FF00" }}>{tl("cta")}:</span>
            <br />
            &quot;{t(`${prefix}.outputCta`)}&quot;
          </p>
        </>
      );
    } else if (id === "viral_hook") {
      const items = t.raw(`${prefix}.outputItems`) as string[];
      output = (
        <ol className="m-0 list-decimal space-y-1.5 pl-4 text-[0.82rem]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    } else if (id === "content_kalender") {
      const rows = t.raw(`${prefix}.calendarRows`) as {
        day: string;
        topic: string;
        format: string;
      }[];
      output = (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[260px] border-collapse text-[0.78rem]">
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.day}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <td
                      className="py-1 pr-2 font-bold align-top"
                      style={{ color: "#B4FF00", width: "2rem" }}
                    >
                      {row.day}
                    </td>
                    <td className="py-1 pr-2 align-top">{row.topic}</td>
                    <td className="py-1 align-top whitespace-nowrap text-white/55">
                      {row.format}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[0.78rem]">{t(`${prefix}.calendarFooter`)}</p>
        </>
      );
    } else {
      const tags = t.raw(`${prefix}.outputTags`) as string[];
      output = (
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-[100px] w-full max-w-[180px] items-center justify-center rounded-[12px] border border-dashed"
            style={{ borderColor: "#B4FF00" }}
          >
            <div
              className="rounded-full"
              style={{
                width: 80,
                height: 80,
                background: "rgba(180,255,0,0.2)",
              }}
              aria-hidden
            />
          </div>
          <p className="mb-2 font-semibold" style={{ color: "#B4FF00" }}>
            {t(`${prefix}.outputTitle`)}
          </p>
          <div className="mb-2 flex flex-wrap justify-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[0.7rem]"
                style={{
                  border: "1px solid rgba(180,255,0,0.25)",
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      );
    }

    const inputLines = t(`${prefix}.input`).split("\n");

    return {
      id,
      headline: t(`${prefix}.headline`),
      description: t(`${prefix}.description`),
      badge: t(`${prefix}.badge`),
      input: (
        <>
          {inputLines.map((line, i) => (
            <span key={i}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </>
      ),
      agentDecisions,
      output,
      scores,
    };
  });
}

function WorkflowPanel({
  step,
  index,
  activeIndex,
  labels,
}: {
  step: DemoStep;
  index: number;
  activeIndex: number;
  labels: {
    demo: string;
    agentDecision: string;
    output: string;
    exampleOutput: string;
    score: string;
    exampleScore: string;
  };
}) {
  const isActive = index === activeIndex;

  return (
    <div
      className="absolute inset-0 flex flex-col rounded-[12px] px-5 py-5 md:px-6"
      style={{
        opacity: isActive ? 1 : 0,
        visibility: isActive ? "visible" : "hidden",
        zIndex: isActive ? 10 : 0,
        pointerEvents: isActive ? "auto" : "none",
        transition: "opacity 320ms ease-out, visibility 320ms ease-out",
        background: "rgba(13,13,16,0.98)",
        border: "1px solid rgba(180,255,0,0.2)",
      }}
      aria-hidden={!isActive}
    >
      <DemoBadge>{labels.demo}</DemoBadge>
      <div
        className="mb-3 rounded-[10px] p-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="mb-1.5 text-[0.66rem] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.48)" }}
        >
          {labels.agentDecision}
        </p>
        <ul className="m-0 flex flex-col gap-1 p-0 text-[0.78rem] text-white/72">
          {step.agentDecisions.map((line) => (
            <li key={line} className="list-none">
              · {line}
            </li>
          ))}
        </ul>
      </div>

      <p
        className="mb-2 text-[0.66rem] font-bold uppercase tracking-[0.1em]"
        style={{ color: "rgba(255,255,255,0.48)" }}
      >
        {labels.output}
      </p>
      <p
        className="mb-2 text-[0.66rem] font-medium"
        style={{ color: "rgba(255,255,255,0.42)" }}
      >
        {labels.exampleOutput}
      </p>
      <div
        className="min-h-0 flex-1 overflow-y-auto text-[0.82rem] leading-[1.6]"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {step.output}
      </div>

      <div className="mt-4 shrink-0 border-t border-white/6 pt-4">
        <p
          className="mb-2 text-[0.66rem] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.48)" }}
        >
          {labels.score}
        </p>
        <p
          className="mb-2 text-[0.66rem] font-medium"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          {labels.exampleScore}
        </p>
        <ScoreRow scores={step.scores} />
      </div>
    </div>
  );
}

function StepCopy({
  step,
  index,
  activeIndex,
  labels,
}: {
  step: DemoStep;
  index: number;
  activeIndex: number;
  labels: { demo: string; input: string; exampleResult: string };
}) {
  const isActive = index === activeIndex;

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center"
      style={{
        opacity: isActive ? 1 : 0,
        visibility: isActive ? "visible" : "hidden",
        transition: "opacity 320ms ease-out, visibility 320ms ease-out",
      }}
      aria-hidden={!isActive}
    >
      <DemoBadge>{labels.demo}</DemoBadge>
      <p
        className="mb-3 text-[0.72rem] font-bold tracking-[0.14em]"
        style={{ color: "#B4FF00", fontFamily: "var(--font-dm), sans-serif" }}
      >
        {String(index + 1).padStart(2, "0")} / {String(STEP_COUNT).padStart(2, "0")}
      </p>
      <h2
        className="landing-heading mb-3 text-[clamp(2rem,4vw,3.25rem)] leading-[0.95]"
        style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
      >
        {step.headline}
      </h2>
      <p
        className="mb-5 max-w-[340px] text-[0.9rem] leading-[1.65]"
        style={{
          color: "rgba(255,255,255,0.65)",
          fontFamily: "var(--font-dm), sans-serif",
        }}
      >
        {step.description}
      </p>
      <div
        className="mb-4 rounded-[12px] p-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="mb-2 text-[0.66rem] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.48)" }}
        >
          {labels.input}
        </p>
        <div
          className="text-[0.82rem] leading-[1.6]"
          style={{ color: "rgba(255,255,255,0.72)" }}
        >
          {step.input}
        </div>
      </div>
      <p
        className="mb-3 text-[0.66rem]"
        style={{ color: "rgba(255,255,255,0.42)" }}
      >
        {labels.exampleResult}
      </p>
      <AgentPill>{step.badge}</AgentPill>
    </div>
  );
}

function MobileStepCard({
  step,
  index,
  labels,
}: {
  step: DemoStep;
  index: number;
  labels: {
    demo: string;
    input: string;
    agentDecision: string;
    output: string;
    exampleOutput: string;
    score: string;
    exampleScore: string;
    exampleResult: string;
  };
}) {
  return (
    <article
      className="rounded-[12px] p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(180,255,0,0.2)",
      }}
    >
      <DemoBadge>{labels.demo}</DemoBadge>
      <p className="mb-2 text-[0.68rem] font-bold tracking-[0.12em] text-[#B4FF00]">
        {String(index + 1).padStart(2, "0")} / {String(STEP_COUNT).padStart(2, "0")}
      </p>
      <h3 className="landing-heading mb-2 text-2xl leading-none">{step.headline}</h3>
      <p className="mb-4 text-[0.85rem] leading-relaxed text-white/65">{step.description}</p>
      <div
        className="mb-4 rounded-[10px] p-3 text-[0.8rem] text-white/70"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span className="text-[0.66rem] font-bold uppercase text-white/48">
          {labels.input} ·{" "}
        </span>
        {step.input}
      </div>
      <div
        className="mb-4 rounded-[10px] p-3 text-[0.78rem] text-white/72"
        style={{ border: "1px solid rgba(180,255,0,0.12)" }}
      >
        <p className="mb-2 text-[0.66rem] font-bold uppercase text-white/48">
          {labels.agentDecision}
        </p>
        <ul className="m-0 flex flex-col gap-1 p-0">
          {step.agentDecisions.map((line) => (
            <li key={line} className="list-none">
              · {line}
            </li>
          ))}
        </ul>
      </div>
      <p className="mb-2 text-[0.66rem] font-medium text-white/42">{labels.exampleOutput}</p>
      <div className="mb-4 text-[0.82rem] leading-relaxed text-white/85">{step.output}</div>
      <div className="mb-4">
        <p className="mb-2 text-[0.66rem] font-bold uppercase text-white/48">{labels.score}</p>
        <p className="mb-2 text-[0.66rem] font-medium text-white/42">{labels.exampleScore}</p>
        <ScoreRow scores={step.scores} />
      </div>
      <p className="mb-3 text-[0.66rem] text-white/42">{labels.exampleResult}</p>
      <AgentPill>{step.badge}</AgentPill>
    </article>
  );
}

export function StackedDemoSection() {
  const t = useTranslations("landingPage.demos");
  const tl = useTranslations("landingPage.demos.labels");
  const steps = useDemoSteps();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  const labels = {
    demo: tl("demo"),
    input: tl("input"),
    output: tl("output"),
    agentDecision: tl("agentDecision"),
    score: tl("score"),
    exampleOutput: tl("exampleOutput"),
    exampleScore: tl("exampleScore"),
    exampleResult: tl("exampleResult"),
  };

  useEffect(() => {
    const desktopMq = window.matchMedia("(min-width: 768px)");

    const syncMq = () => setIsDesktop(desktopMq.matches);

    syncMq();
    desktopMq.addEventListener("change", syncMq);
    return () => desktopMq.removeEventListener("change", syncMq);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    let raf = 0;

    const update = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const sectionHeight = el.offsetHeight;
      const viewport = window.innerHeight;
      const scrollable = Math.max(sectionHeight - viewport, 1);

      const progress = clamp((window.scrollY - sectionTop) / scrollable, 0, 1);
      const index = Math.min(STEP_COUNT - 1, Math.floor(progress * STEP_COUNT));

      setActiveIndex(index);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isDesktop]);

  return (
    <>
      <section
        ref={sectionRef}
        id="stacked-demo"
        className="relative hidden md:block"
        style={{ height: "500vh", background: "#060608" }}
        aria-label={tl("demoAgentWorks")}
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden px-[clamp(20px,6vw,64px)]">
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-[minmax(0,40%)_minmax(0,60%)] items-center gap-8 lg:gap-12">
            <div
              className="relative min-h-[420px] min-w-0 lg:min-h-[460px]"
              style={{ background: "#060608" }}
            >
              {steps.map((step, index) => (
                <StepCopy
                  key={step.id}
                  step={step}
                  index={index}
                  activeIndex={activeIndex}
                  labels={labels}
                />
              ))}
            </div>
            <div
              className="relative min-h-[420px] overflow-hidden lg:min-h-[460px]"
              style={{ background: "#060608" }}
            >
              {steps.map((step, index) => (
                <WorkflowPanel
                  key={step.id}
                  step={step}
                  index={index}
                  activeIndex={activeIndex}
                  labels={labels}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="stacked-demo-mobile"
        className="md:hidden px-[clamp(16px,5vw,64px)] py-10"
        style={{ background: "#060608" }}
      >
        <div className="mx-auto flex max-w-[640px] flex-col gap-6">
          <div className="mb-2 text-center">
            <span className="kicker mb-2 block">{t("stackedSection.kicker")}</span>
            <h2 className="landing-heading text-[clamp(1.75rem,6vw,2.25rem)]">
              {t("stackedSection.headline1")}{" "}
              <span className="acid-highlight">{t("stackedSection.headline2")}</span>
            </h2>
          </div>
          {steps.map((step, index) => (
            <MobileStepCard key={step.id} step={step} index={index} labels={labels} />
          ))}
        </div>
      </section>
    </>
  );
}

export default StackedDemoSection;
