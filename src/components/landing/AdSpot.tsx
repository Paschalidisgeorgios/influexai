"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

const MOBILE_MAX_WIDTH = 768;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
};

function useIsMobile() {
  const [mobile, setMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

export function AdSpot() {
  const t = useTranslations("hero");
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLUListElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  const [started, setStarted] = useState(false);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
  }, []);

  const setOpacity = (el: HTMLElement | null, value: number, transform?: string) => {
    if (!el) return;
    el.style.opacity = String(value);
    if (transform !== undefined) el.style.transform = transform;
  };

  useEffect(() => {
    if (!started) return;

    const logo = logoRef.current;
    const ai = aiRef.current;
    const tagline = taglineRef.current;
    const features = featuresRef.current;
    const cta = ctaRef.current;
    const scan = scanRef.current;
    const hint = scrollHintRef.current;

    [logo, ai, tagline, features, cta, scan, hint].forEach((el) => {
      if (el) {
        el.style.opacity = "0";
        el.style.transform = "translateY(12px)";
      }
    });

    schedule(() => setOpacity(scan, 0.35), 200);
    schedule(
      () => setOpacity(logo, 1, "translateY(0)"),
      600
    );
    schedule(
      () => setOpacity(ai, 1, "translateY(0)"),
      950
    );
    schedule(
      () => setOpacity(tagline, 1, "translateY(0)"),
      1400
    );
    schedule(
      () => setOpacity(features, 1, "translateY(0)"),
      2000
    );
    schedule(
      () => setOpacity(cta, 1, "translateY(0)"),
      2600
    );
    schedule(
      () => setOpacity(hint, 0.7, "translateY(0)"),
      3200
    );

    return () => {
      timeoutIdsRef.current.forEach(clearTimeout);
      timeoutIdsRef.current = [];
    };
  }, [started, schedule]);

  useEffect(() => {
    if (!started || isMobile || typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((w * h) / 14000);
      particlesRef.current = Array.from({ length: Math.max(40, count) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.8 + 0.4,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "#060608";
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(180,255,0,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.fillStyle = "rgba(180,255,0,0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const g = ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        0,
        w * 0.5,
        h * 0.45,
        Math.max(w, h) * 0.55
      );
      g.addColorStop(0, "rgba(180,255,0,0.06)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [started, isMobile]);

  const featureLines = [t("trust_1"), t("trust_2"), t("trust_3")];

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-[#060608] flex flex-col items-center justify-center"
      aria-label="InfluexAI Ad Spot"
    >
      {!isMobile && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden
        />
      )}

      <div
        ref={scanRef}
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-700"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(180,255,0,0.03) 2px, rgba(180,255,0,0.03) 4px)",
        }}
        aria-hidden
      />

      <div
        className="relative z-10 text-center px-6 max-w-4xl"
        style={{ paddingTop: "clamp(72px, 12vh, 120px)" }}
      >
        <div
          ref={logoRef}
          className="opacity-0 transition-all duration-700 ease-out"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(3.5rem, 14vw, 9rem)",
            letterSpacing: "0.08em",
            lineHeight: 0.88,
            color: "#F0EFE8",
          }}
        >
          INFLUEX
          <span
            ref={aiRef}
            className="block opacity-0 transition-all duration-700 ease-out"
            style={{ color: "#B4FF00" }}
          >
            AI
          </span>
        </div>

        <p
          ref={taglineRef}
          className="opacity-0 transition-all duration-700 ease-out mt-6 mx-auto"
          style={{
            fontSize: "clamp(1rem, 2.8vw, 1.35rem)",
            color: "rgba(240,239,232,0.72)",
            lineHeight: 1.5,
            maxWidth: "28ch",
          }}
        >
          {t("headline")}
        </p>

        <ul
          ref={featuresRef}
          className="opacity-0 transition-all duration-700 ease-out mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 list-none p-0 m-0"
          style={{
            fontSize: "clamp(0.78rem, 2vw, 0.9rem)",
            color: "#B4FF00",
          }}
        >
          {featureLines.map((line) => (
            <li key={line}>✓ {line}</li>
          ))}
        </ul>

        <a
          ref={ctaRef}
          href="/auth/sign-up"
          className="opacity-0 transition-all duration-700 ease-out inline-flex items-center justify-center mt-10 min-h-[48px] px-8 py-3 rounded-xl font-bold text-[#060608] bg-[#B4FF00] hover:brightness-110 no-underline"
          style={{
            fontSize: "clamp(0.9rem, 2.2vw, 1rem)",
            boxShadow: "0 0 40px rgba(180,255,0,0.25)",
          }}
        >
          → {t("cta_primary")}
        </a>
      </div>

      <div
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 transition-all duration-700 flex flex-col items-center gap-2 z-10"
        style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}
      >
        <span>Scroll</span>
        <span
          className="block w-px h-8 animate-pulse"
          style={{ background: "linear-gradient(#B4FF00, transparent)" }}
        />
      </div>
    </section>
  );
}
