"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { LightFrame } from "@/components/LightFrame";
import { useDemoReveal } from "./use-demo-reveal";

const SWEEP_MS = 2600;
const RESOLUTION_STEPS = [720, 1080, 1440, 2160, 3840] as const;

type UpscalerDemoProps = {
  src: string;
  videoSrc?: string;
};

function formatResolution(progress: number): string {
  if (progress >= 0.98) return "4K";
  const idx = Math.min(
    RESOLUTION_STEPS.length - 1,
    Math.floor(progress * (RESOLUTION_STEPS.length - 1))
  );
  const height = RESOLUTION_STEPS[idx];
  return height >= 3840 ? "4K" : `${height}p`;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function useSweepProgress(active: boolean): { progress: number; reducedMotion: boolean } {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(1);
      return;
    }

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / SWEEP_MS);
      setProgress(easeOutCubic(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active]);

  return { progress, reducedMotion };
}

type UpscalerMediaProps = {
  src: string;
  videoSrc?: string;
  className?: string;
  style?: CSSProperties;
};

function UpscalerMedia({ src, videoSrc, className, style }: UpscalerMediaProps) {
  if (videoSrc) {
    return (
      <video
        className={className}
        style={style}
        src={videoSrc}
        poster={src}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} style={style} draggable={false} />
  );
}

export function UpscalerDemo({ src, videoSrc }: UpscalerDemoProps) {
  const t = useTranslations("landingPage.toolDemos.upscaler");
  const { ref, visible } = useDemoReveal();
  const { progress, reducedMotion } = useSweepProgress(visible);
  const sweepPct = progress * 100;
  const done = progress >= 1;
  const showBeam = !reducedMotion && progress > 0 && progress < 1;

  return (
    <div ref={ref} className={["tool-demo-beat", visible ? "is-visible" : ""].filter(Boolean).join(" ")}>
      <div className="upscaler-grid">
        <div className="upscaler-grid__copy">
          <h3 className="demo-heading landing-heading text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.08] mb-3">
            {t("title")}
          </h3>
          <p className="text-sm md:text-base text-white/65 leading-relaxed max-w-md">
            {t("benefit")}
          </p>
        </div>

        <LightFrame className="upscaler-grid__visual tool-demo-beat__frame rounded-2xl border border-white/[0.08] bg-[#111114]">
          <div className="upscaler-demo relative aspect-[16/10] overflow-hidden bg-[#111114]">
            {!done ? (
              <div className="absolute inset-0" aria-hidden>
                <UpscalerMedia
                  src={src}
                  videoSrc={videoSrc}
                  className="upscaler-demo__media upscaler-demo__media--blur h-full w-full object-cover"
                />
              </div>
            ) : null}

            {done ? (
              <UpscalerMedia
                src={src}
                videoSrc={videoSrc}
                className="upscaler-demo__media upscaler-demo__media--sharp absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sweepPct}% 0 0)` }}
              >
                <UpscalerMedia
                  src={src}
                  videoSrc={videoSrc}
                  className="upscaler-demo__media h-full w-full object-cover"
                />
              </div>
            )}

            {showBeam ? (
              <div
                className="upscaler-demo__beam"
                style={{ left: `${sweepPct}%` }}
                aria-hidden
              />
            ) : null}

            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3 md:p-4">
              <span className="rounded-md border border-[color-mix(in_srgb,var(--accent,#B4FF00)_35%,transparent)] bg-black/50 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--accent,#B4FF00)] backdrop-blur-sm">
                {t("after_label")}
              </span>
              <span className="rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-xs tabular-nums text-[var(--accent,#B4FF00)] backdrop-blur-sm">
                {formatResolution(progress)}
              </span>
              <span className="rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white/55 backdrop-blur-sm">
                {t("before_label")}
              </span>
            </div>
          </div>
        </LightFrame>
      </div>
    </div>
  );
}
