"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LandingTheme } from "@/hooks/useTheme";

export type DialogStep = 0 | 1 | 2 | 3 | 4;

const HERO_SCENES = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=85",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85",
  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=85",
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=1200&q=85",
] as const;

type LandingHeroV2Props = {
  theme: LandingTheme;
  dialogStep: DialogStep;
  userName: string;
  inputValue: string;
  inputPlaceholder: string;
  inputDisabled: boolean;
  pulseStudio: boolean;
  heroZoomed: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onTypingChange: (typing: boolean) => void;
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export { wordCount };

export function LandingHeroV2({
  theme,
  dialogStep,
  userName,
  inputValue,
  inputPlaceholder,
  inputDisabled,
  pulseStudio,
  heroZoomed,
  onInputChange,
  onSubmit,
  onTypingChange,
}: LandingHeroV2Props) {
  const heroRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowOffset, setGlowOffset] = useState({ x: 0, y: 0 });
  const glowTarget = useRef({ x: 0, y: 0 });
  const glowCurrent = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const t = window.setTimeout(() => setRevealed(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSceneIndex((i) => (i + 1) % HERO_SCENES.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = () => {
      glowCurrent.current.x += (glowTarget.current.x - glowCurrent.current.x) * 0.05;
      glowCurrent.current.y += (glowTarget.current.y - glowCurrent.current.y) * 0.05;
      setGlowOffset({ ...glowCurrent.current });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    setTilt({
      x: Math.max(-5, Math.min(5, dy * 0.01)),
      y: Math.max(-5, Math.min(5, -dx * 0.01)),
    });
    glowTarget.current = { x: dx * 0.03, y: dy * 0.03 };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-24 sm:px-8"
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute z-0 will-change-transform"
        style={{
          top: "50%",
          left: "50%",
          width: 600,
          height: 400,
          marginLeft: -300 + glowOffset.x,
          marginTop: -200 + glowOffset.y,
          borderRadius: "50%",
          filter: "blur(80px)",
          background: `radial-gradient(circle, rgba(${theme.r},${theme.g},${theme.b},0.35) 0%, transparent 70%)`,
          transition: "background 1.2s ease",
        }}
        aria-hidden
      />

      {/* Z-axis canvas */}
      <div
        className="pointer-events-none absolute z-[1] will-change-transform"
        style={{
          top: "42%",
          left: "50%",
          width: "min(580px, 92vw)",
          aspectRatio: "16/10",
          transform: `translate(-50%, -50%) scale(${heroZoomed ? 1.15 : revealed ? 1 : 0.12}) translateZ(${revealed ? 0 : -500}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          filter: revealed ? "blur(0)" : "blur(24px)",
          opacity: revealed ? (heroZoomed ? 0.55 : 1) : 0,
          transition: "transform 2.5s cubic-bezier(0.16, 1, 0.3, 1), filter 2.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 2.5s cubic-bezier(0.16, 1, 0.3, 1)",
          borderRadius: 14,
          border: "0.5px solid rgba(255,255,255,0.12)",
          boxShadow: `var(--theme-glow)`,
          overflow: "hidden",
        }}
      >
        {HERO_SCENES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: i === sceneIndex ? 1 : 0 }}
          />
        ))}
      </div>

      {/* Text overlay */}
      <div
        className="relative z-10 flex w-full max-w-[720px] flex-col items-center text-center"
        style={{
          opacity: heroZoomed ? 0.92 : 1,
          transition: "opacity 0.8s ease",
        }}
      >
        <span
          className="mb-4 inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[1.5px]"
          style={{
            borderColor: "var(--theme-accent-25)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          AI CREATOR STUDIO · 2026
        </span>

        <h1
          className="font-display leading-none tracking-[-2px] text-white"
          style={{
            fontSize: "clamp(40px, 7vw, 72px)",
            textShadow: "0 2px 40px rgba(0,0,0,0.9)",
          }}
        >
          Erstelle Content der{" "}
          <span style={{ color: "var(--theme-accent)", transition: "color 1.2s ease" }}>
            unmöglich
          </span>{" "}
          aussieht.
        </h1>

        <p className="mt-4 max-w-[540px] text-base text-white/40">
          Von viralen Hooks bis zum fertigen Video — Agent Autopilot erledigt alles.
          Über 20 Tools in einem Studio.
        </p>

        <form onSubmit={handleSubmit} className="relative mt-8 w-full max-w-[520px]">
          <input
            type="text"
            value={inputValue}
            disabled={inputDisabled}
            placeholder={inputPlaceholder}
            onChange={(e) => {
              onInputChange(e.target.value);
              onTypingChange(true);
            }}
            onBlur={() => onTypingChange(false)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-[14px] border bg-[rgba(8,8,10,0.7)] py-3.5 pl-[18px] pr-[120px] text-sm text-white outline-none backdrop-blur-md transition-all duration-300 disabled:opacity-50"
            style={{
              borderWidth: "0.5px",
              borderColor: "rgba(255,255,255,0.12)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `rgba(${theme.r},${theme.g},${theme.b},0.4)`;
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${theme.r},${theme.g},${theme.b},0.08)`;
            }}
          />
          <button
            type="submit"
            disabled={inputDisabled || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-300 disabled:opacity-40"
            style={{
              background: "var(--theme-accent)",
              color: "var(--theme-on-accent)",
            }}
          >
            Senden
          </button>
        </form>

        {dialogStep >= 3 && (
          <Link
            href="/signup"
            className={`mt-4 flex h-14 w-full max-w-[520px] items-center justify-center gap-2 rounded-[10px] font-display text-lg tracking-wide no-underline transition-all duration-300 ${
              pulseStudio ? "landing-studio-pulse" : ""
            }`}
            style={{
              background: "var(--theme-accent)",
              color: "var(--theme-on-accent)",
              boxShadow: `0 4px 24px rgba(${theme.r},${theme.g},${theme.b},0.35)`,
            }}
          >
            STUDIO STARTEN
            <ArrowRight size={18} />
          </Link>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/20 sm:gap-3">
          <span>📝 Beschreibe dein Ziel</span>
          <span aria-hidden>→</span>
          <span>🤖 Agent plant & erstellt</span>
          <span aria-hidden>→</span>
          <span>✅ Content ist fertig</span>
        </div>

        {userName && dialogStep >= 1 && dialogStep < 3 && (
          <p className="mt-3 text-xs text-white/30">Schön, {userName}.</p>
        )}
      </div>
    </section>
  );
}
