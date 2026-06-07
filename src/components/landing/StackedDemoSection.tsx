"use client";

import { useEffect, useRef, useState } from "react";
import { STACKED_DEMO_STEPS } from "./landing-stacked-steps";

const STEPS = STACKED_DEMO_STEPS;
const STEP_COUNT = STEPS.length;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ToolBadge({ children }: { children: string }) {
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

function OutputCard({
  step,
  index,
  activeIndex,
}: {
  step: (typeof STEPS)[number];
  index: number;
  activeIndex: number;
}) {
  const isActive = index === activeIndex;

  return (
    <div
      className="absolute inset-0 rounded-[12px] px-5 py-5 md:px-6"
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
      <p
        className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.1em]"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        Output
      </p>
      <div
        className="text-[0.82rem] leading-[1.6]"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {step.output}
      </div>
    </div>
  );
}

function StepCopy({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  return (
    <div className="flex h-full flex-col justify-center">
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
      <div className="mb-4 rounded-[12px] p-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p
          className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Input
        </p>
        <p
          className="text-[0.82rem] leading-[1.6]"
          style={{ color: "rgba(255,255,255,0.72)" }}
        >
          {step.input}
        </p>
      </div>
      <ToolBadge>{step.badge}</ToolBadge>
    </div>
  );
}

function MobileStepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  return (
    <article
      className="rounded-[12px] p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(180,255,0,0.2)",
      }}
    >
      <p className="mb-2 text-[0.68rem] font-bold tracking-[0.12em] text-[#B4FF00]">
        {String(index + 1).padStart(2, "0")} / {String(STEP_COUNT).padStart(2, "0")}
      </p>
      <h3 className="landing-heading mb-2 text-2xl leading-none">{step.headline}</h3>
      <p className="mb-4 text-[0.85rem] leading-relaxed text-white/65">{step.description}</p>
      <div
        className="mb-4 rounded-[10px] p-3 text-[0.8rem] text-white/70"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span className="text-[0.65rem] font-bold uppercase text-white/40">Input · </span>
        {step.input}
      </div>
      <div className="mb-4 text-[0.82rem] leading-relaxed text-white/85">{step.output}</div>
      <ToolBadge>{step.badge}</ToolBadge>
    </article>
  );
}

export function StackedDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

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
      const index = Math.min(
        STEP_COUNT - 1,
        Math.floor(progress * STEP_COUNT)
      );

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

  const activeStep = STEPS[activeIndex] ?? STEPS[0];

  return (
    <>
      {/* Desktop: pinned stacked scroll */}
      <section
        ref={sectionRef}
        id="stacked-demo"
        className="relative hidden md:block"
        style={{ height: "500vh", background: "#060608" }}
        aria-label="So funktioniert InfluexAI"
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden px-[clamp(20px,6vw,64px)]">
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-[minmax(0,40%)_minmax(0,60%)] items-center gap-8 lg:gap-12">
            <div key={activeIndex} className="stacked-step-copy-in min-w-0">
              <StepCopy step={activeStep} index={activeIndex} />
            </div>
            <div
              className="relative min-h-[360px] overflow-hidden lg:min-h-[400px]"
              style={{ background: "#060608" }}
            >
              {STEPS.map((step, index) => (
                <OutputCard
                  key={step.id}
                  step={step}
                  index={index}
                  activeIndex={activeIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: compact cards */}
      <section
        id="stacked-demo-mobile"
        className="md:hidden px-[clamp(20px,6vw,64px)] py-12"
        style={{ background: "#060608" }}
      >
        <div className="mx-auto flex max-w-[640px] flex-col gap-6">
          <div className="mb-2 text-center">
            <span className="kicker mb-2 block">Live Preview</span>
            <h2 className="landing-heading text-[clamp(1.75rem,6vw,2.25rem)]">
              SIEH WIE ES <span className="acid-highlight">FUNKTIONIERT</span>
            </h2>
          </div>
          {STEPS.map((step, index) => (
            <MobileStepCard key={step.id} step={step} index={index} />
          ))}
        </div>
      </section>
    </>
  );
}

export default StackedDemoSection;
