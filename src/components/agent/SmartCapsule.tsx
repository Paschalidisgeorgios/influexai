"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SmartCapsuleProps {
  themeKey?: "green" | "blue" | "violet";
  initialMessage?: string;
}

const THEME_RGB = {
  green: "180,255,0",
  blue: "40,160,255",
  violet: "160,64,255",
} as const;

const DEFAULT_MESSAGE = "AI CORE: ACTIVE [MODEL_COMPUTING]";

declare global {
  interface Window {
    __capsuleShow?: (msg: string, duration?: number) => void;
  }
}

export function SmartCapsule({
  themeKey = "green",
  initialMessage,
}: SmartCapsuleProps) {
  const [displayMessage, setDisplayMessage] = useState(DEFAULT_MESSAGE);
  const [textOpacity, setTextOpacity] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cooldownRef = useRef({ scroll: 0, mouse: 0, hover: 0 });
  const mouseMoveRef = useRef<{ x: number; y: number; t: number }[]>([]);

  const rgb = THEME_RGB[themeKey];

  const showMessage = useCallback((msg: string, duration = 4000) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    setTextOpacity(0);
    setTimeout(() => {
      setDisplayMessage(msg);
      setTextOpacity(1);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 600);
    }, 200);
    messageTimerRef.current = setTimeout(() => {
      setTextOpacity(0);
      setTimeout(() => {
        setDisplayMessage(DEFAULT_MESSAGE);
        setTextOpacity(1);
      }, 200);
    }, duration);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    const contentEl = document.querySelector(".dashboard-scroll-area");
    const trackScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setIsScrolled(target.scrollTop > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    contentEl?.addEventListener("scroll", trackScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      contentEl?.removeEventListener("scroll", trackScroll);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      mouseMoveRef.current.push({ x: e.clientX, y: e.clientY, t: now });
      mouseMoveRef.current = mouseMoveRef.current.filter((m) => now - m.t < 1000);

      if (mouseMoveRef.current.length > 10) {
        let totalDist = 0;
        for (let i = 1; i < mouseMoveRef.current.length; i++) {
          const dx = mouseMoveRef.current[i].x - mouseMoveRef.current[i - 1].x;
          const dy = mouseMoveRef.current[i].y - mouseMoveRef.current[i - 1].y;
          totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        if (totalDist > 800 && now - cooldownRef.current.mouse > 8000) {
          cooldownRef.current.mouse = now;
          showMessage(
            "Alles okay? Suchst du die Credits oder testest du meine Framerate? ⏱️",
            4000
          );
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [showMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      showMessage(
        initialMessage ||
          "Hi! Bereit für etwas Großes? Was erschaffen wir heute? 👇",
        5000
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [initialMessage, showMessage]);

  useEffect(() => {
    window.__capsuleShow = showMessage;
    return () => {
      delete window.__capsuleShow;
    };
  }, [showMessage]);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

  const glowSize = isScrolled ? 12 : 20;
  const glowOpacity = isScrolled ? 0.15 : 0.25;

  return (
    <div
      className="pointer-events-none fixed top-6 left-1/2 z-50 select-none"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className="flex items-center gap-2 rounded-full border transition-all duration-500"
        style={{
          padding: isScrolled ? "4px 12px" : "5px 14px",
          background: isFlashing
            ? `rgba(${rgb},0.12)`
            : isScrolled
              ? "rgba(9,9,11,0.25)"
              : "rgba(24,24,27,0.65)",
          backdropFilter: isScrolled ? "blur(40px)" : "blur(20px)",
          borderColor: `rgba(${rgb},${isScrolled ? 0.2 : 0.3})`,
          boxShadow: isFlashing
            ? `0 0 40px rgba(${rgb},0.5),0 0 80px rgba(${rgb},0.2)`
            : `0 0 ${glowSize}px rgba(${rgb},${glowOpacity}),0 0 ${glowSize * 2}px rgba(${rgb},${glowOpacity * 0.4})`,
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          willChange: "transform",
        }}
      >
        <span
          className="relative flex shrink-0 items-center justify-center"
          style={{
            width: isScrolled ? "10px" : "12px",
            height: isScrolled ? "10px" : "12px",
          }}
        >
          <span
            className="absolute inset-0 animate-ping rounded-full"
            style={{
              background: `rgba(${rgb},0.35)`,
              animationDuration: "2s",
            }}
          />
          <span
            className="relative rounded-full"
            style={{
              width: isScrolled ? "5px" : "6px",
              height: isScrolled ? "5px" : "6px",
              background: `rgb(${rgb})`,
              boxShadow: `0 0 8px rgba(${rgb},0.9)`,
              transition: "all 0.5s ease",
            }}
          />
        </span>

        <span
          className="font-sans font-medium uppercase"
          style={{
            fontSize: isScrolled ? "9px" : "10px",
            letterSpacing: isScrolled ? "1px" : "1.5px",
            color: `rgba(${rgb},0.75)`,
            opacity: textOpacity,
            transition:
              "opacity 0.3s ease, font-size 0.5s ease, letter-spacing 0.5s ease",
            maxWidth: isScrolled ? "280px" : "480px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayMessage}
        </span>
      </div>
    </div>
  );
}

export const capsuleShow = (msg: string, duration?: number) => {
  if (typeof window !== "undefined" && window.__capsuleShow) {
    window.__capsuleShow(msg, duration);
  }
};
