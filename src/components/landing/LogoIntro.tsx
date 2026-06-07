"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "influexai_intro_seen";
const INTRO_DONE_EVENT = "influexai-intro-complete";
const INTRO_REVEAL_EVENT = "influexai-intro-reveal";
const LOGO_SRC = "/images/Logo-full.png";
const INTRO_DURATION = 15000;
const REVEAL_MS = 11500;
const EXIT_DURATION = 600;

function hasSeenIntro(): boolean {
  try {
    const value = sessionStorage.getItem(INTRO_STORAGE_KEY);
    return value === "true" || value === "1";
  } catch {
    return false;
  }
}

export function LogoIntro() {
  const [showIntro, setShowIntro] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const finishCalledRef = useRef(false);
  const introTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  const clearIntroTimers = useCallback(() => {
    if (introTimerRef.current) {
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const finishIntro = useCallback(() => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;

    clearIntroTimers();

    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
    } catch {
      /* private mode */
    }

    setIsExiting(true);

    exitTimerRef.current = window.setTimeout(() => {
      setShowIntro(false);
      document.body.style.overflow = "";
      document.documentElement.classList.remove("logo-intro-active");
      window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
      exitTimerRef.current = null;
    }, EXIT_DURATION);
  }, [clearIntroTimers]);

  const handleSkip = useCallback(() => {
    finishIntro();
  }, [finishIntro]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceIntro = params.get("intro") === "1";
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionMq.matches);

    if (motionMq.matches && !forceIntro) {
      window.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
      window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
      return;
    }

    if (forceIntro || !hasSeenIntro()) {
      setShowIntro(true);
    } else {
      window.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
      window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
    }
  }, []);

  useEffect(() => {
    if (!showIntro) return;

    finishCalledRef.current = false;
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("logo-intro-active");

    revealTimerRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
    }, REVEAL_MS);

    introTimerRef.current = window.setTimeout(() => {
      finishIntro();
    }, INTRO_DURATION);

    return () => {
      clearIntroTimers();
    };
  }, [showIntro, finishIntro, clearIntroTimers]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  if (!showIntro) return null;

  return (
    <div
      className={[
        "logo-intro-root",
        reducedMotion ? "logo-intro-root--reduced" : "",
        isExiting ? "logo-intro-root--skip" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="presentation"
      aria-hidden
    >
      <div className="logo-intro-bg" aria-hidden>
        <div className="logo-intro-bg-grid" />
        <div className="logo-intro-glow" />
      </div>

      <div className="logo-intro-split logo-intro-split--top" aria-hidden />
      <div className="logo-intro-split logo-intro-split--bottom" aria-hidden />

      <div className="logo-intro-stage">
        <div className="logo-intro-line logo-intro-line--top" aria-hidden />
        <div className="logo-intro-logo-layer">
          <img
            src={LOGO_SRC}
            alt="INFLUEXAI"
            className="intro-logo"
            draggable={false}
          />
        </div>
        <div className="logo-intro-line logo-intro-line--bottom" aria-hidden />
      </div>

      <div className="logo-intro-fade" aria-hidden />

      <button
        type="button"
        className="logo-intro-skip"
        onClick={handleSkip}
      >
        Intro überspringen
      </button>
    </div>
  );
}

export default LogoIntro;
