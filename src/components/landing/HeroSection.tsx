"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Hero3DScene } from "./Hero3DScene";
import { SmartCapsule } from "./SmartCapsule";
import { useThemeCycle } from "@/hooks/useThemeCycle";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { applyThemeToRoot, getLandingTheme } from "@/hooks/useTheme";

type DialogStep = 0 | 1 | 2 | 3;

declare global {
  interface Window {
    __landingCapsuleShow?: (msg: string, duration?: number) => void;
  }
}

export function HeroSection() {
  const { rgb, scene, sceneIdx, themeKey, lockTheme } = useThemeCycle(4000);
  const scrollDepth = useScrollDepth();
  const [baseDepth, setBaseDepth] = useState(0);
  const [impulse, setImpulse] = useState(0);
  const [dialogStep, setDialogStep] = useState<DialogStep>(0);
  const [userName, setUserName] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [capsuleMsg, setCapsuleMsg] = useState("AI CORE: ACTIVE [INITIALIZING]");
  const [isFlashing, setIsFlashing] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState("Dein Name hier...");
  const [inputDisabled, setInputDisabled] = useState(false);
  const capMsgTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const depthProgress = Math.max(baseDepth, 0.3 + scrollDepth * 0.7);

  const showCapsuleMsg = useCallback(
    (msg: string, duration = 4000) => {
      if (capMsgTimerRef.current) clearTimeout(capMsgTimerRef.current);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 600);
      setCapsuleMsg(msg);
      capMsgTimerRef.current = setTimeout(() => {
        setCapsuleMsg(`AI CORE: ACTIVE [${themeKey.toUpperCase()}_MODE]`);
      }, duration);
    },
    [themeKey]
  );

  useEffect(() => {
    applyThemeToRoot(getLandingTheme(themeKey));
  }, [themeKey]);

  useEffect(() => {
    const t = setTimeout(() => setBaseDepth(1), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    window.__landingCapsuleShow = showCapsuleMsg;
    return () => {
      delete window.__landingCapsuleShow;
    };
  }, [showCapsuleMsg]);

  useEffect(() => {
    const t = setTimeout(() => {
      showCapsuleMsg(
        "Hey... genau du vor dem Bildschirm. Klick ins Eingabefeld und verrat mir, wie du heißt. 👇",
        6000
      );
    }, 1600);
    return () => clearTimeout(t);
  }, [showCapsuleMsg]);

  useEffect(
    () => () => {
      if (capMsgTimerRef.current) clearTimeout(capMsgTimerRef.current);
    },
    []
  );

  const triggerImpulse = useCallback((amount: number) => {
    setImpulse(amount);
    setTimeout(() => setImpulse(0), 300);
  }, []);

  const handleSubmit = useCallback(() => {
    const val = inputValue.trim();
    if (!val) return;

    if (dialogStep === 0) {
      setUserName(val);
      setInputValue("");
      lockTheme("blue");
      showCapsuleMsg(`${val}! Starker Name. Freut mich auf Augenhöhe! 🤝`, 5000);
      triggerImpulse(40);

      setTimeout(() => {
        setInputPlaceholder(`Ein Cyberpunk-Video? Ein 3D-Logo? Schreib es mir, ${val}...`);
        showCapsuleMsg(
          `Sag mal, ${val}, was willst du heute Erstaunliches erschaffen? 🔥`,
          6000
        );
        setDialogStep(2);
      }, 1800);
    } else if (dialogStep === 2) {
      lockTheme("violet");
      triggerImpulse(60);
      showCapsuleMsg(
        `Geisteskranke Idee, ${userName}. Ich liebe es! Prozessoren übertaktet. 🚀`,
        8000
      );
      setInputValue("");
      setInputPlaceholder(`${userName}'s Studio ist bereit. 🚀`);
      setInputDisabled(true);
      setDialogStep(3);
    }
  }, [
    inputValue,
    dialogStep,
    userName,
    lockTheme,
    showCapsuleMsg,
    triggerImpulse,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <SmartCapsule rgb={rgb} message={capsuleMsg} isFlashing={isFlashing} />

      <section className="relative flex h-screen min-h-[620px] items-center justify-center overflow-hidden bg-[#08080a]">
        <Hero3DScene
          scene={scene}
          sceneIdx={sceneIdx}
          rgb={rgb}
          depthProgress={depthProgress}
          impulse={impulse}
        />

        <div className="pointer-events-none relative z-20 mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
          <div
            className="mb-6 inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-1.5 backdrop-blur-md"
            style={{
              background: `rgba(${rgb},0.07)`,
              borderColor: `rgba(${rgb},0.2)`,
              color: `rgba(${rgb},0.65)`,
              transition: "all 0.8s ease",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            <span
              className="relative flex shrink-0 items-center justify-center overflow-hidden"
              style={{ width: "12px", height: "12px" }}
            >
              <span
                className="absolute inset-0 animate-ping rounded-full"
                style={{
                  background: `rgba(${rgb},0.4)`,
                  animationDuration: "2s",
                }}
              />
              <span
                className="relative rounded-full"
                style={{
                  width: "5px",
                  height: "5px",
                  background: `rgb(${rgb})`,
                }}
              />
            </span>
            AI Creator Studio · 2026
          </div>

          <h1
            className="mb-4 font-bold leading-[1.04] tracking-tight text-white"
            style={{
              fontSize: "clamp(28px, 6.5vw, 72px)",
              letterSpacing: "-2px",
              textShadow: "0 2px 40px rgba(0,0,0,0.95)",
            }}
          >
            Erstelle Content{" "}
            <span style={{ color: "rgba(255,255,255,0.22)" }}>der</span>{" "}
            <span
              style={{
                color: `rgb(${rgb})`,
                textShadow: `0 0 30px rgba(${rgb},0.4)`,
                transition: "color 0.8s ease, text-shadow 0.8s ease",
              }}
            >
              unmöglich
            </span>
            <br />
            aussieht.
          </h1>

          <p className="mx-auto mb-7 max-w-md text-base leading-relaxed text-white/35">
            Von viralen Hooks bis zum fertigen Video — Agent Autopilot erledigt alles.
            Über 20 Tools in einem Studio.
          </p>

          <div className="pointer-events-auto mb-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: `rgb(${rgb})`,
                color: "#08080a",
                boxShadow: `0 4px 24px rgba(${rgb},0.3)`,
                transition: "background 0.8s ease, box-shadow 0.3s ease",
              }}
            >
              Studio starten →
            </Link>
            <button
              type="button"
              className="rounded-full border border-white/12 px-6 py-3 text-sm text-white/45 transition-all duration-200 hover:border-white/30 hover:text-white/80"
            >
              Demo ansehen
            </button>
          </div>

          <div className="pointer-events-auto relative mx-auto max-w-[480px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              disabled={inputDisabled}
              className="w-full rounded-xl border px-4 py-3 pr-12 font-sans text-sm text-white outline-none transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "rgba(8,8,10,0.72)",
                backdropFilter: "blur(12px)",
                borderColor: inputDisabled
                  ? "rgba(255,255,255,0.06)"
                  : `rgba(${rgb},0.2)`,
                boxShadow: inputDisabled ? "none" : `0 0 0 3px rgba(${rgb},0.06)`,
                fontSize: "13px",
              }}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={inputDisabled}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#08080a] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-0"
              style={{
                background: `rgb(${rgb})`,
                transition: "background 0.8s ease",
              }}
            >
              ↵
            </button>
          </div>

          <p className="mt-2 text-[9px] tracking-wider text-white/15">
            Enter zum Senden
          </p>
        </div>
      </section>

      <style jsx global>{`
        @keyframes scanLine {
          0% {
            top: 0;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
