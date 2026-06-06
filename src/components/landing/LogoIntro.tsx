"use client";

import { useEffect, useState } from "react";

const INTRO_KEY = "influexai_intro_seen";
const INTRO_DONE_EVENT = "influexai-intro-complete";

function finishIntro(setVisible: (v: boolean) => void) {
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* private mode */
  }
  document.body.style.overflow = "";
  window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
  setVisible(false);
}

export function LogoIntro() {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {
      seen = false;
    }

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionMq.matches);

    if (seen) {
      window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
      return;
    }

    setVisible(true);
    document.body.style.overflow = "hidden";

    if (motionMq.matches) {
      const timer = window.setTimeout(() => finishIntro(setVisible), 300);
      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }

    const timer = window.setTimeout(() => finishIntro(setVisible), 1900);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`logo-intro-overlay ${reducedMotion ? "logo-intro-overlay--reduced" : ""}`}
      role="presentation"
      aria-hidden
    >
      <div className="logo-intro-inner">
        <div className="logo-intro-orbit-wrap">
          <div className="logo-intro-orbit" aria-hidden />
          <div className="logo-intro-mark">I</div>
        </div>
        <p className="logo-intro-wordmark">INFLUEXAI</p>
      </div>
      <div className="logo-intro-wipe" aria-hidden />
    </div>
  );
}

export default LogoIntro;
