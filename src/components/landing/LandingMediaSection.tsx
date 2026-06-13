"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { landingMedia } from "@/lib/landing-media";

function accentRgb(hex: string): string {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function LandingMediaSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeItem = landingMedia[activeIndex];
  const activeRgb = accentRgb(activeItem.accent);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % landingMedia.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      id="landing-media"
      className="landing-media-theatre relative overflow-hidden bg-black py-16 md:py-24"
      aria-labelledby="landing-media-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Contextual background morphing */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px] opacity-40 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${activeItem.accent}66 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -right-24 top-1/4 h-[480px] w-[480px] rounded-full blur-[140px] opacity-25 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${activeItem.accent}44 0%, transparent 72%)`,
          }}
        />
        <div
          className="absolute -left-16 bottom-0 h-[360px] w-[360px] rounded-full blur-[120px] opacity-20 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${activeItem.accent}33 0%, transparent 70%)`,
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
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <SpringReveal>
          <p
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: activeItem.accent }}
          >
            Feature Theatre
          </p>
          <h2
            id="landing-media-heading"
            className="max-w-2xl font-[family-name:var(--font-bebas)] text-[clamp(28px,6vw,52px)] leading-[0.95] tracking-[0.02em] text-white"
          >
            Ein Studio. Mehrere KI-Workflows.
          </h2>
          <p
            className="mt-4 max-w-[620px] text-sm leading-relaxed text-white/80 md:text-base"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            Wähle einen Workflow und sieh, wie sich die Oberfläche dynamisch an deinen
            Content-Typ anpasst.
          </p>
        </SpringReveal>

        <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Active copy */}
          <div className="order-1 lg:order-none">
            <div
              key={activeItem.id}
              className="landing-media-content-fade"
              style={
                {
                  "--media-accent": activeItem.accent,
                  "--media-accent-rgb": activeRgb,
                } as CSSProperties
              }
            >
              <span
                className="mb-4 inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-700"
                style={{
                  borderColor: `rgba(${activeRgb}, 0.35)`,
                  background: `rgba(${activeRgb}, 0.1)`,
                  color: activeItem.accent,
                }}
              >
                {activeItem.category}
              </span>
              <h3
                className="mb-4 text-white"
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  letterSpacing: "0.02em",
                  lineHeight: 0.95,
                }}
              >
                {activeItem.title}
              </h3>
              <p
                className="max-w-md text-base leading-relaxed text-white/80 md:text-lg"
                style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
              >
                {activeItem.description}
              </p>
              {activeItem.href ? (
                <Link
                  href={activeItem.href}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    borderColor: `rgba(${activeRgb}, 0.4)`,
                    background: `rgba(${activeRgb}, 0.12)`,
                    boxShadow: `0 0 24px rgba(${activeRgb}, 0.15)`,
                  }}
                >
                  Workflow öffnen
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </div>

          {/* Main video panel */}
          <div className="order-2 lg:order-none" id="landing-media-panel" role="tabpanel" aria-labelledby={`landing-media-tab-${activeItem.id}`}>
            <div
              className="relative overflow-hidden rounded-2xl border transition-all duration-1000"
              style={{
                borderColor: `rgba(${activeRgb}, 0.28)`,
                boxShadow: `0 0 60px rgba(${activeRgb}, 0.12), 0 24px 48px rgba(0,0,0,0.45)`,
              }}
            >
              <div className="relative aspect-[16/10] w-full bg-zinc-950">
                <div key={activeItem.id} className="landing-media-video-fade absolute inset-0">
                  <video
                    key={activeItem.id}
                    src={activeItem.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                    aria-label={activeItem.title}
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.35) 100%)",
                  }}
                />
                <div
                  className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3"
                  aria-hidden
                >
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm"
                    style={{ background: `rgba(${activeRgb}, 0.25)` }}
                  >
                    {activeItem.category}
                  </span>
                  <span className="font-mono text-xs text-white/60">
                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(landingMedia.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow tabs */}
        <div
          className="mt-10 -mx-2 flex gap-3 overflow-x-auto px-2 pb-2 md:mt-12 md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
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
                className="min-w-[220px] shrink-0 rounded-xl border px-4 py-4 text-left transition-all duration-500 md:min-w-0"
                style={
                  isActive
                    ? {
                        borderColor: item.accent,
                        background: `rgba(${rgb}, 0.1)`,
                        boxShadow: `0 0 28px rgba(${rgb}, 0.2), inset 0 0 0 1px rgba(${rgb}, 0.15)`,
                      }
                    : {
                        borderColor: "rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(8px)",
                      }
                }
              >
                <span
                  className="mb-2 block font-mono text-[10px] tracking-widest"
                  style={{ color: isActive ? item.accent : "rgba(255,255,255,0.45)" }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="block text-sm font-semibold transition-colors duration-300"
                  style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}
                >
                  {item.title}
                </span>
                <span
                  className="mt-1 block text-[10px] uppercase tracking-wider transition-colors duration-300"
                  style={{ color: isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)" }}
                >
                  {item.category}
                </span>
              </button>
            );
          })}
        </div>

        <p
          className="mt-6 text-center text-xs text-white/50 md:text-left"
          style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          aria-live="polite"
        >
          {isPaused ? "Auto-Wechsel pausiert" : "Wechselt automatisch alle 6 Sekunden"}
        </p>
      </div>
    </section>
  );
}
