"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "influexai_intro_seen";
const INTRO_DONE_EVENT = "influexai:intro-complete";
const INTRO_REVEAL_EVENT = "influexai:intro-reveal";
const LOGO_SRC = "/images/Logo-full.png";
const INTRO_DURATION = 15000;
const REVEAL_MS = 11500;
const EXIT_DURATION = 600;

const OVERLAY_STYLE = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 999999,
  background: "#060608",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "auto" as const,
};

function dispatchIntroEvent(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}

function readIntroSeen(): boolean {
  try {
    const value = sessionStorage.getItem(INTRO_STORAGE_KEY);
    return value === "true" || value === "1";
  } catch {
    return false;
  }
}

function shouldShowIntroInitially(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const forceIntro = params.get("intro") === "1";
  if (forceIntro) return true;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (reducedMotion) return false;

  return !readIntroSeen();
}

export function LogoIntro() {
  const [showIntro, setShowIntro] = useState(shouldShowIntroInitially);
  const [isExiting, setIsExiting] = useState(false);
  const [manualSkip, setManualSkip] = useState(false);
  const finishCalledRef = useRef(false);
  const introTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const reducedMotionTimerRef = useRef<number | null>(null);

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

  const releaseIntroLock = useCallback(() => {
    document.body.style.overflow = "";
    document.documentElement.classList.remove("logo-intro-active");
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
      releaseIntroLock();
      dispatchIntroEvent(INTRO_DONE_EVENT);
      exitTimerRef.current = null;
    }, EXIT_DURATION);
  }, [clearIntroTimers, releaseIntroLock]);

  const handleSkip = useCallback(() => {
    setManualSkip(true);
    finishIntro();
  }, [finishIntro]);

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceIntro = params.get("intro") === "1";

    if (forceIntro) {
      try {
        sessionStorage.removeItem(INTRO_STORAGE_KEY);
      } catch {
        /* private mode */
      }
      setShowIntro(true);
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("logo-intro-active");
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setShowIntro(false);
      reducedMotionTimerRef.current = window.setTimeout(() => {
        dispatchIntroEvent(INTRO_REVEAL_EVENT);
        dispatchIntroEvent(INTRO_DONE_EVENT);
        reducedMotionTimerRef.current = null;
      }, 50);
      return;
    }

    if (!readIntroSeen()) {
      setShowIntro(true);
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("logo-intro-active");
      return;
    }

    setShowIntro(false);
    dispatchIntroEvent(INTRO_REVEAL_EVENT);
    dispatchIntroEvent(INTRO_DONE_EVENT);
  }, []);

  useEffect(() => {
    if (!showIntro || isExiting) return;

    finishCalledRef.current = false;

    revealTimerRef.current = window.setTimeout(() => {
      dispatchIntroEvent(INTRO_REVEAL_EVENT);
    }, REVEAL_MS);

    introTimerRef.current = window.setTimeout(() => {
      finishIntro();
    }, INTRO_DURATION);

    return () => {
      clearIntroTimers();
    };
  }, [showIntro, isExiting, finishIntro, clearIntroTimers]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
      if (reducedMotionTimerRef.current) {
        window.clearTimeout(reducedMotionTimerRef.current);
      }
    };
  }, []);

  if (!showIntro) return null;

  return (
    <div
      className={[
        "logo-intro-root",
        manualSkip ? "logo-intro-root--skip" : "",
        isExiting && !manualSkip ? "logo-intro-root--exit" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={OVERLAY_STYLE}
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
            decoding="sync"
            fetchPriority="high"
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
