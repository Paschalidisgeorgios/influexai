"use client";

import { SpringReveal } from "@/components/ui/SpringReveal";
import { CountUp } from "@/components/ui/CountUp";
import type { LiveStats } from "@/lib/live-stats";

export function LiveStatsBarClient({ stats }: { stats: LiveStats }) {
  return (
    <SpringReveal delay={0.1}>
      <div
        style={{
          width: "100%",
          background: "rgba(180,255,0,0.05)",
          borderTop: "1px solid rgba(180,255,0,0.1)",
          borderBottom: "1px solid rgba(180,255,0,0.1)",
          padding: "12px 16px",
          textAlign: "center",
          fontSize: 14,
          fontFamily: "var(--font-dm), 'DM Sans', sans-serif",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.5,
        }}
      >
        <span aria-hidden style={{ marginRight: 6 }}>
          ⚡
        </span>
        <strong style={{ color: "#B4FF00", fontWeight: 700 }}>
          <CountUp to={stats.users} />
        </strong>{" "}
        Creators registriert
        <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
        <strong style={{ color: "#B4FF00", fontWeight: 700 }}>
          <CountUp to={stats.generations} delay={0.08} />
        </strong>{" "}
        Contents erstellt
        <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
        <strong style={{ color: "#B4FF00", fontWeight: 700 }}>
          <CountUp to={stats.scripts} delay={0.16} />
        </strong>{" "}
        Scripts generiert
      </div>
    </SpringReveal>
  );
}
