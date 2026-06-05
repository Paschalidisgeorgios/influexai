"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onGenerationComplete } from "@/lib/client-credits-ui";

const COUNT_KEY = "influex_generation_upsell_count";

export function PostGenerationUpsell() {
  const [visible, setVisible] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const unsub = onGenerationComplete(({ remaining: rem }) => {
      let count = 0;
      try {
        count = parseInt(localStorage.getItem(COUNT_KEY) ?? "0", 10) + 1;
        localStorage.setItem(COUNT_KEY, String(count));
      } catch {
        count = 1;
      }

      if (count % 5 !== 0) return;

      setRemaining(rem);
      setVisible(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(false), 4000);
    });
    return () => {
      unsub();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  const low = remaining < 20;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 90,
        maxWidth: 420,
        width: "calc(100% - 32px)",
        padding: "12px 18px",
        borderRadius: 12,
        background: "rgba(15,15,18,0.95)",
        border: "1px solid rgba(180,255,0,0.2)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.82rem", color: "#F0EFE8", flex: 1 }}>
        Gut gemacht! Du hast noch{" "}
        <strong style={{ color: "#B4FF00" }}>{remaining} Credits</strong>.
        {low && " Lade jetzt auf und erstelle mehr →"}
      </p>
      {low && (
        <Link
          href="/dashboard/credits"
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "#B4FF00",
            color: "#060608",
            fontWeight: 700,
            fontSize: "0.75rem",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Aufladen
        </Link>
      )}
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Schließen"
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.65)",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        ×
      </button>
    </div>
  );
}
