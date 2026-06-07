"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "influexai_intro_seen";
const INTRO_DONE_EVENT = "influexai:intro-complete";
const INTRO_REVEAL_EVENT = "influexai:intro-reveal";
const LOGO_SRC = "/images/Logo-full.png";
const INTRO_DURATION = 10000;
const REVEAL_MS = 7500;
const EXIT_DURATION = 600;

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

export function LogoIntro() {
  const [showIntro, setShowIntro] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const finishCalledRef = useRef(false);
  const introTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const deferredEventTimerRef = useRef<number | null>(null);

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
    finishIntro();
  }, [finishIntro]);

  useEffect(() => {
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
      deferredEventTimerRef.current = window.setTimeout(() => {
        dispatchIntroEvent(INTRO_REVEAL_EVENT);
        dispatchIntroEvent(INTRO_DONE_EVENT);
        deferredEventTimerRef.current = null;
      }, 50);
      return;
    }

    if (!readIntroSeen()) {
      setShowIntro(true);
      document.body.style.overflow = "hidden";
      document.documentElement.classList.add("logo-intro-active");
      return;
    }

    deferredEventTimerRef.current = window.setTimeout(() => {
      dispatchIntroEvent(INTRO_REVEAL_EVENT);
      dispatchIntroEvent(INTRO_DONE_EVENT);
      deferredEventTimerRef.current = null;
    }, 50);
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
      if (deferredEventTimerRef.current) {
        window.clearTimeout(deferredEventTimerRef.current);
      }
      releaseIntroLock();
    };
  }, [releaseIntroLock]);

  if (!showIntro) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "#060608",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: isExiting ? 0 : 1,
        transition: isExiting ? `opacity ${EXIT_DURATION}ms ease` : undefined,
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(180,255,0,0.05) 0%, transparent 70%)",
          animation: "logoIntroGlowPulse 10s ease forwards",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            opacity: 0,
            animation: "logoIntroLogo 10s ease forwards",
          }}
        >
          <img
            src="/images/Logo-full.png"
            alt="INFLUEXAI"
            draggable={false}
            decoding="sync"
            fetchPriority="high"
            style={{
              display: "block",
              width: "clamp(200px, 55vw, 340px)",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "calc(50% - 52px)",
          left: 0,
          width: "100%",
          height: "1.5px",
          background: "#B4FF00",
          boxShadow: "0 0 8px rgba(180,255,0,0.7)",
          transform: "scaleX(0)",
          transformOrigin: "center",
          animation: "logoIntroLine 10s ease forwards",
          pointerEvents: "none",
          zIndex: 11,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "calc(50% + 52px)",
          left: 0,
          width: "100%",
          height: "1.5px",
          background: "#B4FF00",
          boxShadow: "0 0 8px rgba(180,255,0,0.7)",
          transform: "scaleX(0)",
          transformOrigin: "center",
          animation: "logoIntroLine 10s ease forwards",
          pointerEvents: "none",
          zIndex: 11,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#060608",
          clipPath: "inset(0 0 0 0)",
          animation: "logoIntroSplitTop 10s ease forwards",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      <button
        type="button"
        onClick={handleSkip}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          zIndex: 20,
          padding: "8px 16px",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "transparent",
          color: "rgba(255,255,255,0.4)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Überspringen
      </button>
    </div>
  );
}

export default LogoIntro;
