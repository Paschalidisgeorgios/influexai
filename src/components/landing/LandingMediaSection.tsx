"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { SpringReveal } from "@/components/ui/SpringReveal";
import { landingMedia, type LandingMediaItem } from "@/lib/landing-media";

function accentRgb(hex: string): string {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function MediaCard({ item }: { item: LandingMediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rgb = accentRgb(item.accent);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, []);

  const inner = (
    <article
      className="group relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-[0_0_32px_rgba(var(--media-accent-rgb),0.14)]"
      style={
        {
          "--media-accent-rgb": rgb,
          borderColor: `rgba(${rgb}, 0.18)`,
          background: "rgba(10, 13, 18, 0.92)",
        } as CSSProperties
      }
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          src={item.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(5,6,8,0.92) 0%, rgba(5,6,8,0.25) 45%, rgba(5,6,8,0.15) 100%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `inset 0 0 0 1px rgba(${rgb}, 0.35)`,
          }}
        />
      </div>

      <div className="relative flex flex-1 flex-col p-5 md:p-6">
        <span
          className="mb-3 inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{
            borderColor: `rgba(${rgb}, 0.3)`,
            background: `rgba(${rgb}, 0.08)`,
            color: item.accent,
          }}
        >
          {item.category}
        </span>
        <h3
          className="mb-2 text-white"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(1.35rem, 2.5vw, 1.75rem)",
            letterSpacing: "0.02em",
            lineHeight: 1.05,
          }}
        >
          {item.title}
        </h3>
        <p
          className="text-sm leading-relaxed text-white/70"
          style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
        >
          {item.description}
        </p>
      </div>
    </article>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block h-full no-underline">
        {inner}
      </Link>
    );
  }

  return inner;
}

export function LandingMediaSection() {
  return (
    <section
      id="landing-media"
      className="border-t px-4 py-16 md:px-10 md:py-20"
      style={{
        borderColor: "var(--border-soft)",
        background: "var(--bg-secondary)",
      }}
      aria-labelledby="landing-media-heading"
    >
      <div className="mx-auto w-full max-w-[1160px]">
        <SpringReveal>
          <p className="landing-neon-section-kicker landing-neon-section-kicker--blue mb-2">
            Im Studio
          </p>
          <h2
            id="landing-media-heading"
            className="max-w-2xl font-[family-name:var(--font-bebas)] text-[clamp(28px,6vw,48px)] leading-[0.95] tracking-[0.02em] text-white"
          >
            Tools, die du wirklich nutzt.
          </h2>
          <p
            className="mt-4 max-w-[560px] text-sm leading-relaxed text-white/70 md:text-base"
            style={{ fontFamily: "var(--font-dm), 'DM Sans', sans-serif" }}
          >
            Von Creator-Visuals bis filmischen KI-Videos — vier zentrale Workflows
            aus dem InfluexAI Studio.
          </p>
        </SpringReveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {landingMedia.map((item, i) => (
            <SpringReveal key={item.id} delay={i * 0.06}>
              <MediaCard item={item} />
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
