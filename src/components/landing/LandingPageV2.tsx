"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { LandingBadge } from "@/components/landing/LandingBadge";
import { LandingBentoShowcase } from "@/components/landing/LandingBentoShowcase";
import { LandingCtaV2 } from "@/components/landing/LandingCtaV2";
import {
  LandingHeroV2,
  wordCount,
  type DialogStep,
} from "@/components/landing/LandingHeroV2";
import { LandingNavV2 } from "@/components/landing/LandingNavV2";
import { LandingUseCasesSection } from "@/components/landing/LandingUseCasesSection";
import { LandingFooter, PricingSection } from "@/components/landing/Sections";
import { useMouseVelocity } from "@/hooks/useMouseVelocity";
import { useSentientBadge } from "@/hooks/useSentientBadge";
import { useTheme } from "@/hooks/useTheme";

const BEHAVIOR_COOLDOWN_MS = 4000;

export function LandingPageV2() {
  const heroRef = useRef<HTMLDivElement>(null);
  const loadTime = useRef(Date.now());
  const earlyScrollFired = useRef(false);
  const lastBehaviorAt = useRef(0);
  const step2Timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { theme, lockTheme } = useTheme("green");
  const [dialogStep, setDialogStep] = useState<DialogStep>(0);
  const [userName, setUserName] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputPlaceholder, setInputPlaceholder] = useState("Dein Name hier...");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pulseStudio, setPulseStudio] = useState(false);
  const [heroZoomed, setHeroZoomed] = useState(false);
  const [dialogueBadge, setDialogueBadge] = useState<string | null>(null);
  const [behaviorActive, setBehaviorActive] = useState(false);

  const { message, badgeVisible, showMessage } = useSentientBadge(isTyping);

  const canShowBehavior = dialogStep === 0 && !dialogueBadge;

  const pushBehavior = useCallback(
    (text: string, duration: number, priority: number) => {
      if (!canShowBehavior || behaviorActive) return;
      const now = Date.now();
      if (now - lastBehaviorAt.current < BEHAVIOR_COOLDOWN_MS) return;
      lastBehaviorAt.current = now;
      setBehaviorActive(true);
      showMessage(text, duration, priority);
      window.setTimeout(() => setBehaviorActive(false), duration);
    },
    [canShowBehavior, behaviorActive, showMessage]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDialogueBadge(
        "Hey... ja, genau du vor dem Bildschirm. Klick mal kurz in das Eingabefeld und verrat mir, wie du heißt. 👇"
      );
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (dialogStep !== 0 || userName) return;
    const t = window.setTimeout(() => {
      setDialogueBadge(
        "Immer noch da? Gut. Ich warte auf deinen Namen... 👀"
      );
    }, 10000);
    return () => window.clearTimeout(t);
  }, [dialogStep, userName]);

  useEffect(() => {
    let lastY = window.scrollY;
    let lastTs = performance.now();
    let fastSince: number | null = null;
    let lastFastTrigger = 0;

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = now - lastTs;
      if (dt < 16) return;

      const velocity = (Math.abs(y - lastY) / dt) * 1000;
      lastY = y;
      lastTs = now;

      if (
        !earlyScrollFired.current &&
        now - loadTime.current < 2000 &&
        y > 200
      ) {
        earlyScrollFired.current = true;
        pushBehavior(
          "Halt, geh wieder hoch! Das Intro-Video war verdammt teuer zu rendern! 🎬",
          5000,
          7
        );
      }

      if (velocity > 800) {
        if (fastSince === null) fastSince = now;
        if (now - fastSince >= 200 && now - lastFastTrigger >= 6000) {
          lastFastTrigger = now;
          fastSince = null;
          pushBehavior(
            "Hey, scroll nicht so schnell! Meine Quantenprozessoren kommen bei dem Tempo nicht mit! 🧠",
            5000,
            6
          );
        }
      } else {
        fastSince = null;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pushBehavior]);

  useMouseVelocity(heroRef, {
    thresholdPxPerFrame: 60,
    sustainMs: 800,
    cooldownMs: 8000,
    onWobble: useCallback(() => {
      pushBehavior(
        "Alles okay bei dir? Suchst du den Login oder testest du nur meine Framerate? ⏱️",
        4000,
        5
      );
    }, [pushBehavior]),
  });

  const handleBentoLongHover = useCallback(() => {
    pushBehavior(
      "Ich sehe dich... Keine Sorge, du darfst das Design anfassen (klicken). 👀",
      4000,
      4
    );
  }, [pushBehavior]);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text || inputDisabled) return;

    if (dialogStep === 0) {
      const words = wordCount(text);
      if (words < 1 || words > 3) return;
      const name = text.split(/\s+/)[0] ?? text;
      setUserName(name);
      setDialogStep(1);
      lockTheme("blue");
      setInputValue("");
      setDialogueBadge(
        `${name}! Starker Name. Freut mich, auf Augenhöhe zu kommunizieren. 🤝`
      );

      if (step2Timer.current) clearTimeout(step2Timer.current);
      step2Timer.current = setTimeout(() => {
        setDialogStep(2);
        setInputPlaceholder("Ein Cyberpunk-Video? Ein 3D-Logo? Schreib es mir...");
        setDialogueBadge(
          `Sag mal, ${name}, warum bist du eigentlich hier? Was genau willst du heute Erstaunliches erschaffen? Schrei es in die Box!`
        );
      }, 1500);
      return;
    }

    if (dialogStep === 2) {
      if (wordCount(text) <= 3) return;
      setDialogStep(3);
      lockTheme("violet");
      setInputValue("");
      setInputDisabled(true);
      setInputPlaceholder(`${userName}'s Studio ist bereit. 🚀`);
      setHeroZoomed(true);
      setPulseStudio(true);
      setDialogueBadge(
        `Geisteskranke Idee, ${userName}. Ich liebe es! Ich habe die Prozessoren übertaktet. Klick auf 'Studio starten' und lass uns die Welt verändern!`
      );
      window.setTimeout(() => setPulseStudio(false), 6000);
    }
  }, [dialogStep, inputDisabled, inputValue, lockTheme, userName]);

  useEffect(
    () => () => {
      if (step2Timer.current) clearTimeout(step2Timer.current);
    },
    []
  );

  const badgeContent =
    dialogueBadge ??
    (dialogStep >= 1 && dialogStep <= 3
      ? theme.badgeLabel
      : behaviorActive
        ? message
        : dialogStep === 0 && !isTyping
          ? theme.badgeLabel
          : message);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#08080a] text-white">
      <style jsx global>{`
        @keyframes landing-studio-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.45);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0);
          }
        }
        .landing-studio-pulse {
          animation: landing-studio-pulse 1.2s ease-in-out 3;
        }
        .landing-v2-pricing .pc-hot {
          box-shadow: 0 0 40px rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.12) !important;
          border-color: rgba(var(--theme-r), var(--theme-g), var(--theme-b), 0.28) !important;
        }
      `}</style>

      <LandingNavV2 />
      <LandingBadge text={badgeContent} visible={badgeVisible} />

      <main>
        <div ref={heroRef}>
          <LandingHeroV2
            theme={theme}
            dialogStep={dialogStep}
            userName={userName}
            inputValue={inputValue}
            inputPlaceholder={inputPlaceholder}
            inputDisabled={inputDisabled}
            pulseStudio={pulseStudio}
            heroZoomed={heroZoomed}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            onTypingChange={setIsTyping}
          />
        </div>

        <LandingBentoShowcase onBentoLongHover={handleBentoLongHover} />
        <LandingUseCasesSection />

        <div id="pricing" className="landing-v2-pricing border-t border-white/[0.06]">
          <PricingSection />
        </div>

        <LandingCtaV2 />
      </main>

      <LandingFooter />
    </div>
  );
}
