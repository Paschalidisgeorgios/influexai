"use client";

import { useEffect, useState } from "react";

const ACCENT = "#B4FF00";

type Stats = {
  totalKeys: number;
  activeKeys: number;
  requestsToday: number;
  requestsMonth: number;
  errorRatePct: number;
};

type LogRow = {
  id: string;
  at: string;
  user: string;
  endpoint: string;
  status: number;
  responseTimeMs: number;
  creditsUsed: number;
};

export function AdminApiTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topUsers, setTopUsers] = useState<
    { email: string; requests: number }[]
  >([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/api-stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setTopUsers(
          (data.topUsers ?? []).map(
            (u: { email: string; requests: number }) => ({
              email: u.email,
              requests: u.requests,
            })
          )
        );
        setLogs(data.recentLogs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: "rgba(255,255,255,0.65)", padding: 24 }}>API-Daten laden…</p>;
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          { label: "Keys gesamt", value: stats?.totalKeys ?? 0 },
          { label: "Aktive Keys", value: stats?.activeKeys ?? 0 },
          { label: "Requests heute", value: stats?.requestsToday ?? 0 },
          { label: "Requests (Monat)", value: stats?.requestsMonth ?? 0 },
          {
            label: "Fehlerrate",
            value: `${stats?.errorRatePct ?? 0}%`,
            color: (stats?.errorRatePct ?? 0) > 10 ? "#ff6b7a" : ACCENT,
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)" }}>
              {c.label}
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: c.color ?? "#F0EFE8",
              }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#F0EFE8", fontSize: "0.95rem", marginBottom: 12 }}>
        Top API-Nutzer (Monat)
      </h3>
      <div style={{ marginBottom: 28, fontSize: "0.82rem" }}>
        {topUsers.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Noch keine API-Nutzung.</p>
        ) : (
          topUsers.map((u) => (
            <div
              key={u.email}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: "#F0EFE8" }}>{u.email}</span>
              <span style={{ color: ACCENT }}>{u.requests} requests</span>
            </div>
          ))
        )}
      </div>

      <h3 style={{ color: "#F0EFE8", fontSize: "0.95rem", marginBottom: 12 }}>
        Letzte API-Logs
      </h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.78rem",
          }}
        >
          <thead>
            <tr style={{ color: "rgba(255,255,255,0.65)", textAlign: "left" }}>
              {["Zeit", "User", "Endpoint", "Status", "ms", "Credits"].map(
                (h) => (
                  <th key={h} style={{ padding: 8 }}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr
                key={l.id}
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <td style={{ padding: 8, color: "rgba(255,255,255,0.65)" }}>
                  {new Date(l.at).toLocaleString("de-DE")}
                </td>
                <td style={{ padding: 8, color: "#F0EFE8" }}>{l.user}</td>
                <td style={{ padding: 8 }}>{l.endpoint}</td>
                <td
                  style={{
                    padding: 8,
                    color: l.status >= 400 ? "#ff6b7a" : "#10b981",
                  }}
                >
                  {l.status}
                </td>
                <td style={{ padding: 8 }}>{l.responseTimeMs}</td>
                <td style={{ padding: 8 }}>{l.creditsUsed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
