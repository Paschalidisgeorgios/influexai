"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { dismissFeatureNudge, getFeatureNudgeState } from "@/app/actions/churn";

export function FeatureNudge({ collapsed }: { collapsed?: boolean }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "hidden" }
    | { status: "nudge"; name: string; href: string; feature: string }
    | { status: "all_discovered" }
  >({ status: "loading" });

  const load = useCallback(() => {
    getFeatureNudgeState().then((data) => {
      if (!data) {
        setState({ status: "hidden" });
        return;
      }
      if (data.status === "all_discovered") {
        setState({ status: "all_discovered" });
        return;
      }
      setState({
        status: "nudge",
        name: data.name,
        href: data.href,
        feature: data.feature,
      });
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (collapsed || state.status === "loading" || state.status === "hidden") {
    return null;
  }

  if (state.status === "all_discovered") {
    return (
      <div
        style={{
          margin: "8px",
          padding: "12px",
          borderRadius: 10,
          background: "rgba(180,255,0,0.05)",
          border: "1px solid rgba(180,255,0,0.12)",
          fontSize: "0.72rem",
          color: "#B4FF00",
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        🏆 Du hast alle Features entdeckt!
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "8px",
        padding: "12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "0.72rem",
          color: "rgba(240,239,232,0.55)",
          lineHeight: 1.45,
        }}
      >
        Du hast <strong style={{ color: "#F0EFE8" }}>{state.name}</strong> noch
        nie ausprobiert →
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Link
          href={state.href}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "6px 8px",
            borderRadius: 7,
            background: "rgba(180,255,0,0.1)",
            border: "1px solid rgba(180,255,0,0.2)",
            color: "#B4FF00",
            fontSize: "0.68rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Ausprobieren
        </Link>
        <button
          type="button"
          onClick={async () => {
            await dismissFeatureNudge(state.feature);
            load();
          }}
          style={{
            padding: "6px 8px",
            borderRadius: 7,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#505055",
            fontSize: "0.65rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Später
        </button>
      </div>
    </div>
  );
}
