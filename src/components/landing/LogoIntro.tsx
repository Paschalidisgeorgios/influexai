"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_KEY = "influexai_intro_seen";
const INTRO_DONE_EVENT = "influexai-intro-complete";
const INTRO_REVEAL_EVENT = "influexai-intro-reveal";
const LOGO_SRC = "/images/logo-full.png";
const INTRO_MS = 15000;
const REVEAL_MS = 11500;
const REDUCED_MS = 600;

function finishIntro(setVisible: (v: boolean) => void) {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* private mode */
  }
  document.body.style.overflow = "";
  document.body.classList.remove("logo-intro-active");
  window.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
  window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
  setVisible(false);
}

export function LogoIntro() {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const revealTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (completeTimerRef.current) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const handleSkip = useCallback(() => {
    clearTimers();
    setSkipping(true);
    window.setTimeout(() => finishIntro(setVisible), 280);
  }, [clearTimers]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceIntro = params.get("intro") === "1";

    let seen = false;
    if (!forceIntro) {
      try {
        seen = sessionStorage.getItem(INTRO_KEY) === "1";
      } catch {
        seen = false;
      }
    }

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionMq.matches);

    if (seen) {
      window.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
      window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
      return;
    }

    setVisible(true);
    document.body.style.overflow = "hidden";
    document.body.classList.add("logo-intro-active");

    const duration = motionMq.matches ? REDUCED_MS : INTRO_MS;

    if (motionMq.matches) {
      window.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
    } else {
      revealTimerRef.current = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(INTRO_REVEAL_EVENT));
      }, REVEAL_MS);
    }

    completeTimerRef.current = window.setTimeout(
      () => finishIntro(setVisible),
      duration
    );

    return () => {
      clearTimers();
      document.body.style.overflow = "";
      document.body.classList.remove("logo-intro-active");
    };
  }, [clearTimers]);

  if (!visible) return null;

  return (
    <div
      className={[
        "logo-intro-root",
        reducedMotion ? "logo-intro-root--reduced" : "",
        skipping ? "logo-intro-root--skip" : "",
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
            className="logo-intro-logo"
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
