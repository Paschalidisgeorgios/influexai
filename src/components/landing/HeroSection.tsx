"use client";

import { useState, useEffect } from "react";

type Audience = "creator" | "brand";

const HERO_CONTENT: Record<Audience, { headline: string[]; sub: string }> = {
  creator: {
    headline: ["Dein", "Gesicht.", "Deine Regeln."],
    sub: "Erstelle deinen KI-Influencer, streame live ohne Gesicht und generiere Produkt-Ads die konvertieren — in Minuten.",
  },
  brand: {
    headline: ["Dein KI-", "Marken-", "Botschafter."],
    sub: "Konsistente Markenkommunikation ohne teure Shootings. Produktvideos in 90 Sekunden. Skalierbar für KMUs und Agenturen.",
  },
};

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80&fit=crop",
    tall: true,
    tag: "live" as const,
    tagLabel: "LIVE",
    title: "@diana.influexai",
    sub: "KI-Charakter aktiv · Face Consistent",
  },
  {
    src: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80&fit=crop",
    tall: false,
    tag: "brand" as const,
    tagLabel: "Brand Ad",
    title: "Beauty Campaign",
    sub: "URL → Spot · 90 Sek.",
  },
  {
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&q=80&fit=crop",
    tall: false,
    tag: "ai" as const,
    tagLabel: "KI-Ich",
    title: "Fashion · Milan",
    sub: "Nano Banana Pro · 4K",
  },
];

export function HeroSection() {
  const [audience, setAudience] = useState<Audience>("creator");
  const [scrollY, setScrollY] = useState(0);
  const content = HERO_CONTENT[audience];

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      document.querySelectorAll<HTMLElement>("[data-parallax-card]").forEach(
        (el, i) => {
          const d = (i % 2 === 0 ? 1 : -1) * (0.4 + i * 0.2);
          el.style.transform = `translate(${x * d * 0.4}px, ${y * d * 0.4}px)`;
        }
      );
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="min-h-screen grid lg:grid-cols-2 grid-cols-1 overflow-hidden relative pt-[76px]">
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-100px", left: "-100px",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(180,255,0,0.04), transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* LEFT: Copy */}
      <div
        className="flex flex-col justify-center relative z-10"
        style={{
          padding: "clamp(40px,6vw,72px) clamp(20px,4vw,48px) clamp(60px,8vw,90px) clamp(20px,6vw,64px)",
          transform: `translateY(${scrollY * 0.06}px)`,
          transition: "transform 0.1s linear",
        }}
      >
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-[7px] h-[7px] rounded-full bg-[#B4FF00] animate-blink" aria-hidden />
          <span className="kicker">KI-Creator & Brand-Studio · 2026</span>
        </div>

        {/* Audience toggle */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {(["creator", "brand"] as Audience[]).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-200 border"
              style={{
                background: audience === a ? "#B4FF00" : "transparent",
                borderColor: audience === a ? "#B4FF00" : "rgba(255,255,255,0.13)",
                color: audience === a ? "#060608" : "rgba(240,239,232,0.6)",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {a === "creator" ? "Für Creator" : "Für Marken"}
            </button>
          ))}
        </div>

        {/* Headline */}
        <h1
          className="mb-7"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(3.2rem, 8vw, 7.5rem)",
            letterSpacing: "0.02em",
            lineHeight: 0.92,
          }}
        >
          {content.headline.map((line, i) => (
            <span key={i} className="block">
              {i === content.headline.length - 1 ? (
                <span style={{ color: "#B4FF00" }}>{line}</span>
              ) : (
                line
              )}
            </span>
          ))}
        </h1>

        <p
          className="mb-8"
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.1rem)",
            color: "rgba(240,239,232,0.6)",
            lineHeight: 1.75,
            maxWidth: 440,
          }}
        >
          {content.sub}
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 mb-10">
          <a href="/dashboard" className="btn-acid justify-center sm:justify-start">
            → Kostenlos starten
          </a>
          <a href="#features" className="btn-ghost justify-center sm:justify-start">
            Features ansehen
          </a>
        </div>

        <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: "0.82rem", color: "#505055" }}>
          {["✓ Keine Kreditkarte", "50 gratis Credits", "DSGVO-konform"].map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && <span className="w-[3px] h-[3px] rounded-full inline-block" style={{ background: "#505055" }} />}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* RIGHT: Image grid - hidden on mobile */}
      <div
        className="hidden lg:grid relative z-10"
        style={{
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 10,
          padding: "24px clamp(20px,6vw,64px) 80px 12px",
        }}
      >
        {IMAGES.map((img, i) => (
          <div
            key={i}
            data-parallax-card=""
            className="img-card"
            style={{
              gridRow: img.tall ? "1 / 3" : "auto",
              transition: "transform 0.15s ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.title}
              style={{ filter: "brightness(0.8) saturate(1.15)", minHeight: img.tall ? undefined : 160, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,6,8,0.92) 0%, rgba(6,6,8,0.10) 50%, transparent 80%)" }} />
            <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
              <div>
                {img.tag === "live" && (
                  <span className="tag-live">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#ff4757] animate-blink inline-block" aria-hidden />
                    LIVE
                  </span>
                )}
                {img.tag === "brand" && <span className="tag-brand">{img.tagLabel}</span>}
                {img.tag === "ai" && <span className="tag-ai">{img.tagLabel}</span>}
              </div>
              <div>
                <div className="font-bold text-[0.82rem] text-white" style={{ letterSpacing: "-0.02em" }}>{img.title}</div>
                <div className="text-[0.68rem] text-white/45 mt-0.5">{img.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
