"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { SeamlessLoopVideo } from "@/components/ui/SeamlessLoopVideo";
import { landingMedia } from "@/lib/landing-media";

function accentRgb(hex: string): string {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const textTransition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function LandingMediaSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const activeItem = landingMedia[activeIndex];
  const activeRgb = accentRgb(activeItem.accent);
  const videoBright = isHovered || isPaused || (inView && coarsePointer);

  useEffect(() => {
    setCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % landingMedia.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      ref={sectionRef}
      id="landing-media"
      className="landing-media-theatre relative min-h-[72vh] overflow-hidden bg-black py-24 md:min-h-[85vh] md:py-32"
      aria-labelledby="landing-media-heading"
      onMouseEnter={() => {
        setIsPaused(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsPaused(false);
        setIsHovered(false);
      }}
    >
      {/* Background video + overlays */}
      <div className="absolute inset-0" aria-hidden>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.85, ease: "easeInOut" }}
          >
            <div
              className={`absolute inset-0 transition-opacity duration-500 ease-out ${
                videoBright ? "opacity-100" : "opacity-55"
              }`}
            >
              <SeamlessLoopVideo
                key={activeItem.id}
                src={activeItem.src}
                ariaLabel={activeItem.title}
                className="absolute inset-0 h-full w-full"
                videoClassName="landing-media-bg-video h-full w-full rounded-none object-cover"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/35" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </div>

      {/* Contextual accent morphing */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] opacity-30 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${activeItem.accent}66 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -right-24 top-1/4 h-[480px] w-[480px] rounded-full blur-[140px] opacity-20 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${activeItem.accent}44 0%, transparent 72%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-6 md:min-h-[85vh]">
        <SpringReveal className="mb-10 md:mb-14">
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-700"
            style={{ color: activeItem.accent }}
          >
            Feature Theatre
          </p>
          <h2
            id="landing-media-heading"
            className="landing-glass-heading max-w-2xl text-[clamp(1.75rem,5vw,3.25rem)] leading-[0.95] text-white"
          >
            Ein Studio. Mehrere KI-Workflows.
          </h2>
          <p
            className="mt-4 max-w-[620px] text-sm leading-relaxed text-white/70 md:text-base"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            Wähle einen Workflow und sieh die Vorschau — Video, Typografie und
            Akzentfarbe wechseln synchron.
          </p>
        </SpringReveal>

        <div
          id="landing-media-panel"
          role="tabpanel"
          aria-labelledby={`landing-media-tab-${activeItem.id}`}
          className="pb-6 md:pb-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              className="max-w-2xl"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={reduceMotion ? { duration: 0 } : textTransition}
              style={
                {
                  "--media-accent": activeItem.accent,
                  "--media-accent-rgb": activeRgb,
                } as CSSProperties
              }
            >
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/70">
                {activeItem.category}
              </p>

              <h3 className="text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
                {activeItem.title}
              </h3>

              <p
                className="mt-4 text-base leading-relaxed text-white/75 md:text-lg"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                {activeItem.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                {activeItem.href ? (
                  <Link
                    href={activeItem.href}
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      borderColor: `rgba(${activeRgb}, 0.45)`,
                      background: `rgba(${activeRgb}, 0.12)`,
                      boxShadow: `0 0 28px rgba(${activeRgb}, 0.18)`,
                    }}
                  >
                    Workflow öffnen
                    <span aria-hidden>→</span>
                  </Link>
                ) : null}
                <span className="font-mono text-xs text-white/50">
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(landingMedia.length).padStart(2, "0")}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Workflow tabs */}
        <div
          className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 pt-2 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="KI-Workflows"
        >
          {landingMedia.map((item, index) => {
            const isActive = index === activeIndex;
            const rgb = accentRgb(item.accent);
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="landing-media-panel"
                id={`landing-media-tab-${item.id}`}
                onClick={() => setActiveIndex(index)}
                className="min-w-[180px] shrink-0 rounded-xl border px-4 py-3.5 text-left transition-all duration-500 sm:min-w-[200px] md:min-w-0 md:flex-1"
                style={
                  isActive
                    ? {
                        borderColor: item.accent,
                        background: `rgba(${rgb}, 0.1)`,
                        boxShadow: `0 0 28px rgba(${rgb}, 0.22), inset 0 0 0 1px rgba(${rgb}, 0.15)`,
                      }
                    : {
                        borderColor: "rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(8px)",
                      }
                }
              >
                <span
                  className="block text-sm font-semibold transition-colors duration-300"
                  style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}
                >
                  {item.title}
                </span>
                <span
                  className="mt-1 block text-[10px] uppercase tracking-wider transition-colors duration-300"
                  style={{
                    color: isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>

        <p
          className="mt-5 text-xs text-white/45"
          style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          aria-live="polite"
        >
          {isPaused ? "Auto-Wechsel pausiert" : "Wechselt automatisch alle 6 Sekunden"}
        </p>
      </div>
    </section>
  );
}
