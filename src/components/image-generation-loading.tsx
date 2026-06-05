"use client";

import { useEffect, useState } from "react";

const IMAGE_LOADING_MESSAGES = [
  "KI analysiert deinen Prompt...",
  "Gesichtszüge werden generiert...",
  "Beleuchtung wird optimiert...",
  "Qualität wird verfeinert...",
  "Fast fertig...",
];

const ESTIMATED_MS = 30_000;

type Props = {
  title?: string;
  subtitle?: string;
};

export function ImageGenerationLoading({
  title = "InfluexAI Vision generiert...",
  subtitle,
}: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % IMAGE_LOADING_MESSAGES.length);
    }, 4000);

    const start = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(95, (elapsed / ESTIMATED_MS) * 100));
    }, 200);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        background: "#0f0f12",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "1.8rem",
          letterSpacing: "0.02em",
          color: "#F0EFE8",
          marginBottom: 10,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "#B4FF00",
          fontSize: "0.9rem",
          minHeight: 22,
          marginBottom: 20,
        }}
      >
        {IMAGE_LOADING_MESSAGES[msgIndex]}
      </p>
      {subtitle && (
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginBottom: 16 }}>
          {subtitle}
        </p>
      )}
      <div
        style={{
          height: 6,
          background: "#222228",
          borderRadius: 99,
          overflow: "hidden",
          maxWidth: 400,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#B4FF00",
            borderRadius: 99,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", marginTop: 12 }}>
        Geschätzte Dauer: 20–40 Sekunden
      </p>
    </div>
  );
}
