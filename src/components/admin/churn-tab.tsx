"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  adminChurnAction,
  getAdminChurnDashboard,
  type ChurnUserRow,
} from "@/app/actions/churn";
import type { ChurnRiskLevel } from "@/lib/churn-score";

type Filter = ChurnRiskLevel | "all";

const RISK_COLORS: Record<ChurnRiskLevel, string> = {
  low: "#505055",
  medium: "#f59e0b",
  high: "#ff6b7a",
  critical: "#ff4757",
};

const RISK_LABELS: Record<ChurnRiskLevel, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminChurnTab() {
  const [filter, setFilter] = useState<Filter>("all");
  const [users, setUsers] = useState<ChurnUserRow[]>([]);
  const [metrics, setMetrics] = useState({
    critical: 0,
    high: 0,
    winbackSent: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminChurnDashboard(filter).then((data) => {
      if ("error" in data) {
        setError(data.error ?? "Fehler");
        setLoading(false);
        return;
      }
      setUsers(data.users);
      setMetrics(data.metrics);
      setLoading(false);
    });
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (
    userId: string,
    action: "gift_credits" | "send_email" | "mark_churned"
  ) => {
    setActing(`${userId}-${action}`);
    const res = await adminChurnAction(userId, action);
    setActing(null);
    if (!res.success) {
      alert(res.error ?? "Aktion fehlgeschlagen");
      return;
    }
    load();
  };

  if (loading) {
    return (
      <p style={{ color: "#505055", padding: 40, textAlign: "center" }}>
        Lade Churn-Daten…
      </p>
    );
  }

  if (error) {
    return (
      <p style={{ color: "#ff6b7a", padding: 40, textAlign: "center" }}>
        {error}
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Churn Risk: Kritisch",
            value: metrics.critical,
            color: "#ff4757",
            icon: "🔴",
          },
          {
            label: "Churn Risk: Hoch",
            value: metrics.high,
            color: "#ff6b7a",
            icon: "🟠",
          },
          {
            label: "Win-back E-Mails (Monat)",
            value: metrics.winbackSent,
            color: "#B4FF00",
            icon: "📧",
          },
          {
            label: "Win-back Conversion",
            value: `${metrics.conversionRate}%`,
            color: "#06b6d4",
            icon: "📈",
          },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              padding: 18,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ fontSize: "1.2rem", marginBottom: 8 }}>{m.icon}</div>
            <div
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "2rem",
                color: m.color,
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#505055" }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(
            [
              { id: "all" as const, label: "Alle" },
              { id: "critical" as const, label: "Kritisch" },
              { id: "high" as const, label: "Hoch" },
              { id: "medium" as const, label: "Mittel" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: filter === f.id ? 700 : 500,
                fontFamily: "inherit",
                background:
                  filter === f.id ? "#B4FF00" : "rgba(255,255,255,0.04)",
                color: filter === f.id ? "#060608" : "rgba(240,239,232,0.45)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <a
          href="/api/admin/churn/export"
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(180,255,0,0.08)",
            border: "1px solid rgba(180,255,0,0.2)",
            color: "#B4FF00",
            fontSize: "0.78rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          CSV Export ↓
        </a>
      </div>

      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0f0f12",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 0.6fr 0.7fr 2fr",
            padding: "10px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#505055",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <div>E-Mail</div>
          <div>Letzter Login</div>
          <div>Letzte Generation</div>
          <div>Score</div>
          <div>Risiko</div>
          <div>Aktion</div>
        </div>

        {users.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#505055" }}>
            Keine at-risk Nutzer in diesem Filter.
          </div>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 1fr 0.6fr 0.7fr 2fr",
                padding: "12px 16px",
                alignItems: "center",
                borderBottom:
                  i < users.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ color: "#F0EFE8", wordBreak: "break-all" }}>
                {u.email}
              </div>
              <div style={{ color: "#505055" }}>
                {formatDate(u.lastActiveAt)}
              </div>
              <div style={{ color: "#505055" }}>
                {formatDate(u.lastGenerationAt)}
              </div>
              <div style={{ fontWeight: 700, color: RISK_COLORS[u.risk] }}>
                {u.score}
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: `${RISK_COLORS[u.risk]}22`,
                    color: RISK_COLORS[u.risk],
                  }}
                >
                  {RISK_LABELS[u.risk]}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => runAction(u.id, "gift_credits")}
                  style={actionBtnStyle}
                >
                  {acting === `${u.id}-gift_credits` ? "…" : "5 Credits"}
                </button>
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => runAction(u.id, "send_email")}
                  style={actionBtnStyle}
                >
                  {acting === `${u.id}-send_email` ? "…" : "E-Mail"}
                </button>
                <button
                  type="button"
                  disabled={acting !== null}
                  onClick={() => {
                    if (
                      confirm(
                        `${u.email} als churned markieren? Wird aus aktivem Tracking entfernt.`
                      )
                    ) {
                      runAction(u.id, "mark_churned");
                    }
                  }}
                  style={{
                    ...actionBtnStyle,
                    color: "#505055",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  Churned
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const actionBtnStyle: CSSProperties = {
  padding: "5px 8px",
  borderRadius: 6,
  border: "1px solid rgba(180,255,0,0.25)",
  background: "rgba(180,255,0,0.06)",
  color: "#B4FF00",
  fontSize: "0.65rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
