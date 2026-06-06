"use client";

import { useEffect, type ReactNode } from "react";

const CREATOR = "#B4FF00";
const BRAND = "#E0A951";

const CREATOR_RGB = { r: 180, g: 255, b: 0 };
const BRAND_RGB = { r: 224, g: 169, b: 81 };

function lerpHex(t: number): string {
  const r = Math.round(CREATOR_RGB.r + (BRAND_RGB.r - CREATOR_RGB.r) * t);
  const g = Math.round(CREATOR_RGB.g + (BRAND_RGB.g - CREATOR_RGB.g) * t);
  const b = Math.round(CREATOR_RGB.b + (BRAND_RGB.b - CREATOR_RGB.b) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function scrollProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

function accentFromScroll(progress: number, reducedMotion: boolean): string {
  if (reducedMotion) {
    return progress >= 0.55 ? BRAND : CREATOR;
  }

  const step = Math.round(progress * 4) / 4;
  return lerpHex(step);
}

function accentFromTransition(
  el: HTMLElement | null,
  scrollProg: number,
  reducedMotion: boolean
): string {
  if (!el) return accentFromScroll(scrollProg, reducedMotion);

  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;

  if (rect.bottom <= 0) return BRAND;
  if (rect.top >= vh) return CREATOR;

  const travel = rect.height + vh;
  const progress = Math.min(1, Math.max(0, (vh - rect.top) / travel));

  if (reducedMotion) {
    return progress >= 0.55 ? BRAND : CREATOR;
  }

  const step = Math.round(progress * 4) / 4;
  return lerpHex(step);
}

function glowFromScroll(progress: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return { x: "50%", y: "50%", strength: "0.45" };
  }

  const x = `${48 + progress * 4}%`;
  const y = `${14 + progress * 72}%`;
  const strength = 0.26 + 0.74 * (1 - Math.sin(progress * Math.PI));

  return { x, y, strength: strength.toFixed(3) };
}

type ScrollWorld = "creator" | "transition" | "brand";

const HEADING_FONT_CREATOR =
  'var(--font-bebas), "Bebas Neue", sans-serif';
const HEADING_FONT_BRAND =
  'var(--font-fraunces), "Fraunces", Georgia, serif';

function worldFromProgress(
  progress: number,
  reducedMotion: boolean
): { world: ScrollWorld; mix: number } {
  const threshold = reducedMotion ? 0.5 : undefined;
  if (threshold !== undefined) {
    return progress >= threshold
      ? { world: "brand", mix: 1 }
      : { world: "creator", mix: 0 };
  }

  if (progress < 0.45) return { world: "creator", mix: 0 };
  if (progress > 0.55) return { world: "brand", mix: 1 };
  const mix = (progress - 0.45) / 0.1;
  return { world: "transition", mix };
}

function applyLight(vars: {
  accent: string;
  glowX: string;
  glowY: string;
  glowStrength: string;
}) {
  const root = document.documentElement;
  root.style.setProperty("--accent", vars.accent);
  root.style.setProperty("--acid", vars.accent);
  root.style.setProperty("--glow-x", vars.glowX);
  root.style.setProperty("--glow-y", vars.glowY);
  root.style.setProperty("--glow-strength", vars.glowStrength);
}

function applyWorld(world: ScrollWorld, mix: number) {
  const root = document.documentElement;
  root.dataset.world = world;
  root.style.setProperty("--world", `"${world}"`);
  root.style.setProperty("--world-mix", mix.toFixed(3));

  const useBrandFont = world === "brand" || (world === "transition" && mix >= 0.5);
  root.style.setProperty(
    "--heading-font",
    useBrandFont ? HEADING_FONT_BRAND : HEADING_FONT_CREATOR
  );

  if (world === "brand") {
    root.style.setProperty("--heading-weight", "300");
    root.style.setProperty("--heading-style", "italic");
    root.style.setProperty("--heading-transform", "none");
    root.style.setProperty("--heading-tracking", "-0.02em");
    root.style.setProperty("--heading-leading", "1.08");
  } else if (world === "creator") {
    root.style.setProperty("--heading-weight", "400");
    root.style.setProperty("--heading-style", "normal");
    root.style.setProperty("--heading-transform", "uppercase");
    root.style.setProperty("--heading-tracking", "-0.04em");
    root.style.setProperty("--heading-leading", "0.88");
  } else {
    root.style.setProperty(
      "--heading-weight",
      mix >= 0.5 ? "300" : "400"
    );
    root.style.setProperty(
      "--heading-style",
      mix >= 0.5 ? "italic" : "normal"
    );
    root.style.setProperty(
      "--heading-transform",
      mix >= 0.5 ? "none" : "uppercase"
    );
    root.style.setProperty(
      "--heading-tracking",
      `${(-0.04 + mix * 0.02).toFixed(3)}em`
    );
    root.style.setProperty(
      "--heading-leading",
      (0.88 + mix * 0.2).toFixed(3)
    );
  }
}

function clearLight() {
  const root = document.documentElement;
  root.style.removeProperty("--accent");
  root.style.removeProperty("--acid");
  root.style.removeProperty("--glow-x");
  root.style.removeProperty("--glow-y");
  root.style.removeProperty("--glow-strength");
}

function clearWorld() {
  const root = document.documentElement;
  delete root.dataset.world;
  root.style.removeProperty("--world");
  root.style.removeProperty("--world-mix");
  root.style.removeProperty("--heading-font");
  root.style.removeProperty("--heading-weight");
  root.style.removeProperty("--heading-style");
  root.style.removeProperty("--heading-transform");
  root.style.removeProperty("--heading-tracking");
  root.style.removeProperty("--heading-leading");
}

export function LightSystem({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let rafId = 0;
    let lastKey = "";

    const update = () => {
      rafId = 0;
      const progress = scrollProgress();
      const transitionEl = document.getElementById("world-transition");
      const glow = glowFromScroll(progress, reducedMotion);
      const accent = accentFromTransition(
        transitionEl,
        progress,
        reducedMotion
      );
      const { world, mix } = worldFromProgress(progress, reducedMotion);
      const key = `${accent}|${glow.x}|${glow.y}|${glow.strength}|${world}|${mix.toFixed(3)}`;

      if (key !== lastKey) {
        applyLight({
          accent,
          glowX: glow.x,
          glowY: glow.y,
          glowStrength: glow.strength,
        });
        applyWorld(world, mix);
        lastKey = key;
      }
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    };

    applyLight({
      accent: CREATOR,
      glowX: "50%",
      glowY: "14%",
      glowStrength: "1",
    });
    applyWorld("creator", 0);
    scheduleUpdate();

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafId) cancelAnimationFrame(rafId);
      clearLight();
      clearWorld();
    };
  }, []);

  return (
    <>
      <div className="ix-stage" aria-hidden />
      {children}
      <div className="ix-vignette" aria-hidden />
      <div className="ix-grain" aria-hidden />
    </>
  );
}
