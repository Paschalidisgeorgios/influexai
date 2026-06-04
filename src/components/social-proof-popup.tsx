"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MESSAGES = [
  "👤 Creator aus Deutschland hat gerade einen Script generiert",
  "🔥 Jemand aus der Fitness-Niche hat 5 Outlier gefunden",
  "⚡ Neuer Creator hat sich vor 2 Minuten angemeldet",
  "📈 Creator hat gerade seine Niche analysiert",
  "🎯 Script für 'Morning Routine' wurde gerade erstellt",
  "💡 Jemand hat 3 Thumbnail-Konzepte generiert",
];

const MAX_POPUPS = 3;
const FIRST_DELAY_MS = 15_000;
const VISIBLE_MS = 5_000;

function pickMessage(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

function nextIntervalMs(): number {
  return 45_000 + Math.floor(Math.random() * 45_000);
}

export function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [message, setMessage] = useState("");

  const popupCountRef = useRef(0);
  const heroInViewRef = useRef(true);
  const dismissedRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (scheduleRef.current) clearTimeout(scheduleRef.current);
    hideTimerRef.current = null;
    scheduleRef.current = null;
  }, []);

  const hidePopup = useCallback(() => {
    setExiting(true);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 300);
  }, []);

  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    clearTimers();
    hidePopup();
  }, [clearTimers, hidePopup]);

  const showPopup = useCallback(() => {
    if (
      dismissedRef.current ||
      popupCountRef.current >= MAX_POPUPS ||
      !heroInViewRef.current
    ) {
      return;
    }

    popupCountRef.current += 1;
    setMessage(pickMessage());
    setExiting(false);
    setVisible(true);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(hidePopup, VISIBLE_MS);
  }, [hidePopup]);

  const scheduleNextPopup = useCallback(() => {
    if (
      dismissedRef.current ||
      popupCountRef.current >= MAX_POPUPS ||
      !heroInViewRef.current
    ) {
      return;
    }

    scheduleRef.current = setTimeout(() => {
      showPopup();
      if (popupCountRef.current < MAX_POPUPS) {
        scheduleNextPopup();
      }
    }, nextIntervalMs());
  }, [showPopup]);

  useEffect(() => {
    const hero = document.getElementById("landing-hero-sentinel");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        heroInViewRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          clearTimers();
          setVisible((v) => {
            if (v) {
              setExiting(true);
              setTimeout(() => {
                setVisible(false);
                setExiting(false);
              }, 300);
            }
            return false;
          });
        }
      },
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [clearTimers]);

  useEffect(() => {
    scheduleRef.current = setTimeout(() => {
      showPopup();
      if (popupCountRef.current < MAX_POPUPS) {
        scheduleNextPopup();
      }
    }, FIRST_DELAY_MS);

    return clearTimers;
  }, [clearTimers, showPopup, scheduleNextPopup]);

  if (!visible && !exiting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        width: 280,
        zIndex: 9999,
        background: "#111111",
        border: "1px solid rgba(180,255,0,0.2)",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        animation: exiting
          ? "socialProofOut 300ms ease forwards"
          : "socialProofIn 300ms ease forwards",
        fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#B4FF00",
          flexShrink: 0,
          marginTop: 5,
          animation: "socialProofPulse 1.5s ease-in-out infinite",
        }}
      />
      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: 13,
          lineHeight: 1.45,
          color: "rgba(255,255,255,0.75)",
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Schließen"
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.35)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes socialProofIn {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes socialProofOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-24px); }
        }
        @keyframes socialProofPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(180,255,0,0.45); }
          50% { box-shadow: 0 0 0 6px rgba(180,255,0,0); }
        }
      `}</style>
    </div>
  );
}
