"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  adminCreateAnnouncement,
  adminGiftCreditsByEmail,
  adminSearchUser,
  adminSetMaintenanceMode,
  getAdminBusinessAnalytics,
  getAdminLiveActivity,
  getMaintenanceMode,
} from "@/app/actions/admin-analytics";
import type {
  AdminAnalyticsPayload,
  LiveEvent,
  RevenueRange,
} from "@/lib/admin-analytics-types";
import { formatRelativeTime } from "@/lib/community";

const ACCENT = "#B4FF00";
const BG = "#060608";

function eur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function cohortColor(pct: number | null) {
  if (pct === null) return "transparent";
  if (pct >= 60) return "rgba(16,185,129,0.25)";
  if (pct >= 30) return "rgba(251,191,36,0.2)";
  return "rgba(255,107,122,0.2)";
}

const EVENT_BADGE: Record<
  LiveEvent["type"],
  { label: string; bg: string; color: string }
> = {
  signup: { label: "Signup", bg: "rgba(59,130,246,0.2)", color: "#60a5fa" },
  generation: {
    label: "Generation",
    bg: "rgba(180,255,0,0.15)",
    color: ACCENT,
  },
  purchase: { label: "Purchase", bg: "rgba(16,185,129,0.2)", color: "#10b981" },
  referral: { label: "Referral", bg: "rgba(168,85,247,0.2)", color: "#a78bfa" },
  churn: { label: "Churn", bg: "rgba(255,107,122,0.2)", color: "#ff6b7a" },
};

export function BusinessAnalyticsDashboard() {
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null);
  const [live, setLive] = useState<LiveEvent[]>([]);
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("90d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState(false);

  const [giftOpen, setGiftOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [annOpen, setAnnOpen] = useState(false);
  const [giftEmail, setGiftEmail] = useState("");
  const [giftAmount, setGiftAmount] = useState("10");
  const [giftReason, setGiftReason] = useState("Admin Bonus");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      id: string;
      email: string;
      full_name: string | null;
      credits: number;
      plan: string;
      created_at: string;
      generationCount: number;
    }[]
  >([]);
  const [annMessage, setAnnMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdminBusinessAnalytics(revenueRange);
    if ("error" in res) {
      setError(res.error);
      setData(null);
    } else {
      setError(null);
      setData(res);
    }
    setLoading(false);
  }, [revenueRange]);

  const loadLive = useCallback(async () => {
    const res = await getAdminLiveActivity();
    if (!("error" in res)) setLive(res);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getMaintenanceMode().then(setMaintenance);
  }, []);

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 30000);
    return () => clearInterval(t);
  }, [loadLive]);

  if (loading && !data) {
    return (
      <p style={{ color: "#505055", padding: 40, textAlign: "center" }}>
        Business Analytics laden…
      </p>
    );
  }

  if (error || !data) {
    return <p style={{ color: "#ff6b7a", padding: 40 }}>{error ?? "Fehler"}</p>;
  }

  const { kpis, revenue, growth, featureUsage, topUsers, funnel, cohorts } =
    data;
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <Link
          href="/dashboard/admin/producthunt"
          style={{
            fontSize: "0.78rem",
            color: "#505055",
            textDecoration: "none",
          }}
        >
          ← Admin
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "2.5rem",
            color: "#F0EFE8",
            margin: "8px 0 4px",
          }}
        >
          Business Command Center
        </h1>
        <p style={{ color: "#505055", fontSize: "0.88rem", margin: 0 }}>
          Umsatz, Wachstum, Funnel & Live-Aktivität
        </p>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          {
            title: "MRR (Monat)",
            value: eur(kpis.mrrCents),
            sub: `${kpis.mrrChangePct >= 0 ? "+" : ""}${kpis.mrrChangePct}% vs letzten Monat`,
            subColor: kpis.mrrChangePct >= 0 ? "#10b981" : "#ff6b7a",
          },
          {
            title: "Gesamt-Umsatz",
            value: eur(kpis.totalRevenueCents),
            sub: "all time",
          },
          {
            title: "Aktive User (7T)",
            value: String(kpis.activeUsers7d),
            sub: "mit Generation",
          },
          {
            title: "Nutzer gesamt",
            value: String(kpis.totalUsers),
            sub: `+${kpis.newUsersThisWeek} diese Woche`,
          },
          {
            title: "ARPU",
            value: eur(kpis.arpuCents),
            sub: "pro zahlendem User",
          },
          {
            title: "Churn (geschätzt)",
            value: `${kpis.churnRatePct}%`,
            sub: "30T inaktiv",
            subColor: "#ff6b7a",
          },
        ].map((c) => (
          <div
            key={c.title}
            style={{
              padding: 18,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{ fontSize: "0.68rem", color: "#505055", marginBottom: 6 }}
            >
              {c.title}
            </div>
            <div
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "1.75rem",
                color: ACCENT,
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: c.subColor ?? "#505055",
                marginTop: 4,
              }}
            >
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}
      >
        {[
          { label: "Credits schenken", onClick: () => setGiftOpen(true) },
          { label: "User suchen", onClick: () => setSearchOpen(true) },
          { label: "Announcement", onClick: () => setAnnOpen(true) },
          {
            label: maintenance ? "Wartung AN" : "Maintenance Mode",
            onClick: async () => {
              const res = await adminSetMaintenanceMode(!maintenance);
              if (res.success) setMaintenance(res.enabled ?? !maintenance);
            },
          },
          {
            label: "Export Users CSV",
            onClick: () => window.open("/api/admin/analytics/export", "_blank"),
          },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.onClick}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(180,255,0,0.25)",
              background: "rgba(180,255,0,0.06)",
              color: ACCENT,
              fontWeight: 600,
              fontSize: "0.78rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Revenue */}
      <Section title="Umsatz Verlauf">
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {(["30d", "90d", "12m"] as RevenueRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRevenueRange(r)}
              style={tabStyle(revenueRange === r)}
            >
              {r === "12m" ? "12 Monate" : r}
            </button>
          ))}
        </div>
        <ChartBox height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#505055", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fill: "#505055", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f0f12",
                  border: "1px solid #333",
                }}
                formatter={(v) => [`€${Number(v ?? 0).toFixed(2)}`, "Umsatz"]}
              />
              <Area
                type="monotone"
                dataKey="revenueEur"
                stroke={ACCENT}
                fill="rgba(180,255,0,0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>
      </Section>

      {/* Growth */}
      <Section title="User Wachstum">
        <ChartBox height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={growth}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#505055", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis yAxisId="left" tick={{ fill: "#505055", fontSize: 10 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#505055", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f0f12",
                  border: "1px solid #333",
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="signups"
                fill="rgba(180,255,0,0.4)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke={ACCENT}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartBox>
      </Section>

      {/* Feature usage */}
      <Section title="Feature Nutzung (letzte 30 Tage)">
        <ChartBox height={Math.max(200, featureUsage.length * 36)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureUsage}
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                horizontal={false}
              />
              <XAxis type="number" tick={{ fill: "#505055", fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: "#F0EFE8", fontSize: 11 }}
                width={95}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f0f12",
                  border: "1px solid #333",
                }}
              />
              <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]}>
                {featureUsage.map((entry, i) => (
                  <Cell
                    key={`c-${i}`}
                    fill={`rgba(180,255,0,${0.25 + (entry.pct / 100) * 0.75})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        <p style={{ fontSize: "0.75rem", color: "#505055", marginTop: 8 }}>
          {featureUsage.map((f) => `${f.label}: ${f.pct}%`).join(" · ")}
        </p>

        <h3
          style={{
            fontSize: "0.9rem",
            color: "#F0EFE8",
            margin: "24px 0 12px",
          }}
        >
          Top 10 User by Generations
        </h3>
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                {[
                  "Email",
                  "Generations",
                  "Credits spent",
                  "Member since",
                  "Aktion",
                ].map((h) => (
                  <th
                    key={h}
                    style={{ padding: 10, textAlign: "left", color: "#505055" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td style={{ padding: 10, color: "#F0EFE8" }}>{u.email}</td>
                  <td style={{ padding: 10 }}>{u.generations}</td>
                  <td style={{ padding: 10 }}>{u.creditsSpent}</td>
                  <td style={{ padding: 10, color: "#505055" }}>
                    {new Date(u.memberSince).toLocaleDateString("de-DE")}
                  </td>
                  <td style={{ padding: 10 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminGiftCreditsByEmail(
                          u.email,
                          5,
                          "Top user bonus"
                        );
                        alert("5 Credits geschenkt");
                      }}
                      style={smallBtn}
                    >
                      +5 Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Funnel */}
      <Section title="Conversion Funnel">
        <p style={{ fontSize: "0.78rem", color: "#505055", marginBottom: 16 }}>
          {data.landingNote}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "center",
          }}
        >
          {funnel.map((step, i) => {
            const widthPct = Math.max(15, (step.count / maxFunnel) * 100);
            const gray = 180 - i * 25;
            const borderColor =
              i === funnel.length - 1
                ? ACCENT
                : `rgba(${gray},${gray},${gray},0.5)`;
            return (
              <div key={step.key} style={{ width: "100%", maxWidth: 560 }}>
                <div
                  style={{
                    margin: "0 auto",
                    width: `${widthPct}%`,
                    minWidth: 120,
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: `2px solid ${borderColor}`,
                    background:
                      i === funnel.length - 1
                        ? "rgba(180,255,0,0.08)"
                        : "rgba(255,255,255,0.03)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#F0EFE8",
                      fontSize: "0.9rem",
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      color: ACCENT,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                    }}
                  >
                    {step.count.toLocaleString("de-DE")} ({step.pct}%)
                  </div>
                </div>
                {i < funnel.length - 1 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#505055",
                      margin: "4px 0",
                    }}
                  >
                    ↓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Cohort */}
      <Section title="Cohort Retention">
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              fontSize: "0.8rem",
              minWidth: 480,
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Cohort</th>
                <th style={thStyle}>Signup</th>
                {["Woche 1", "Woche 2", "Woche 3", "Woche 4"].map((w) => (
                  <th key={w} style={thStyle}>
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((row) => (
                <tr key={row.weekLabel}>
                  <td style={tdStyle}>{row.weekLabel}</td>
                  <td style={tdStyle}>{row.signupCount}</td>
                  {row.retention.map((pct, i) => (
                    <td
                      key={i}
                      style={{
                        ...tdStyle,
                        background: cohortColor(pct),
                        fontWeight: 700,
                      }}
                    >
                      {pct === null ? "—" : `${pct}%`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Live feed */}
      <Section title="Live Activity">
        <p style={{ fontSize: "0.72rem", color: "#505055", marginBottom: 12 }}>
          Aktualisiert alle 30 Sekunden
        </p>
        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#0f0f12",
            overflow: "hidden",
          }}
        >
          {live.map((ev) => {
            const badge = EVENT_BADGE[ev.type];
            return (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  fontSize: "0.8rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#505055", minWidth: 72 }}>
                  {formatRelativeTime(ev.at)}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: badge.bg,
                    color: badge.color,
                    fontWeight: 700,
                    fontSize: "0.68rem",
                  }}
                >
                  {ev.type === "signup" && "🔑 "}
                  {ev.type === "generation" && "⚡ "}
                  {ev.type === "purchase" && "💳 "}
                  {ev.type === "referral" && "👥 "}
                  {badge.label}
                </span>
                <span style={{ color: "#F0EFE8" }}>{ev.userLabel}</span>
                <span style={{ color: "#505055" }}>{ev.detail}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {giftOpen && (
        <Modal title="Credits schenken" onClose={() => setGiftOpen(false)}>
          <input
            placeholder="E-Mail"
            value={giftEmail}
            onChange={(e) => setGiftEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Anzahl"
            value={giftAmount}
            onChange={(e) => setGiftAmount(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Grund"
            value={giftReason}
            onChange={(e) => setGiftReason(e.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={async () => {
              const res = await adminGiftCreditsByEmail(
                giftEmail,
                parseInt(giftAmount, 10) || 0,
                giftReason
              );
              alert(res.success ? "OK" : res.error);
              setGiftOpen(false);
            }}
            style={primaryBtn}
          >
            Schenken
          </button>
        </Modal>
      )}

      {searchOpen && (
        <Modal title="User suchen" onClose={() => setSearchOpen(false)}>
          <input
            placeholder="E-Mail"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={async () => {
              const res = await adminSearchUser(searchEmail);
              if ("users" in res) setSearchResults(res.users ?? []);
            }}
            style={primaryBtn}
          >
            Suchen
          </button>
          {searchResults.map((u) => (
            <div
              key={u.id}
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                fontSize: "0.82rem",
              }}
            >
              <div style={{ color: "#F0EFE8", fontWeight: 700 }}>{u.email}</div>
              <div style={{ color: "#505055" }}>
                {u.full_name} · {u.credits} Credits · {u.generationCount} gens ·{" "}
                {u.plan}
              </div>
            </div>
          ))}
        </Modal>
      )}

      {annOpen && (
        <Modal title="Announcement (24h)" onClose={() => setAnnOpen(false)}>
          <textarea
            value={annMessage}
            onChange={(e) => setAnnMessage(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Nachricht für alle Dashboards…"
          />
          <button
            type="button"
            onClick={async () => {
              const res = await adminCreateAnnouncement(annMessage);
              alert(res.success ? "Announcement aktiv" : res.error);
              setAnnOpen(false);
            }}
            style={primaryBtn}
          >
            Senden
          </button>
        </Modal>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "1.35rem",
          color: "#F0EFE8",
          marginBottom: 14,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ChartBox({
  height,
  children,
}: {
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height,
        padding: 12,
        borderRadius: 14,
        background: "#0f0f12",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    background: active ? ACCENT : "rgba(255,255,255,0.06)",
    color: active ? BG : "#505055",
    fontWeight: 600,
    fontSize: "0.75rem",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(6,6,8,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 24,
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(180,255,0,0.2)",
        }}
      >
        <h3 style={{ color: "#F0EFE8", marginTop: 0 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#18181d",
  color: "#F0EFE8",
  fontFamily: "inherit",
  fontSize: "0.88rem",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: ACCENT,
  color: BG,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const smallBtn: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 6,
  border: "1px solid rgba(180,255,0,0.3)",
  background: "rgba(180,255,0,0.08)",
  color: ACCENT,
  fontSize: "0.72rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const thStyle: React.CSSProperties = {
  padding: 10,
  textAlign: "left",
  color: "#505055",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const tdStyle: React.CSSProperties = {
  padding: 10,
  color: "#F0EFE8",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};
