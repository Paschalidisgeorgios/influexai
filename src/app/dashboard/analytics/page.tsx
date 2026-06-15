"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BarChart2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAnalytics,
  type AnalyticsData,
  type AnalyticsDateRange,
} from "@/app/actions/get-analytics";
import { AnalyticsSkeleton } from "@/components/skeletons/analytics-skeleton";

const RANGES: { id: AnalyticsDateRange; label: string }[] = [
  { id: "7d", label: "Letzte 7 Tage" },
  { id: "30d", label: "30 Tage" },
  { id: "90d", label: "90 Tage" },
  { id: "all", label: "Alles" },
];

const ACCENT = "#B4FF00";
const BG = "#060608";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const cardStyle: CSSProperties = {
  padding: "18px 20px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const sectionStyle: CSSProperties = {
  marginBottom: 32,
};

const sectionTitle: CSSProperties = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#F0EFE8",
  marginBottom: 14,
};

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsDateRange>("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnalytics(range).then((res) => {
      if ("error" in res) {
        setError(res.error);
        setData(null);
      } else {
        setError(null);
        setData(res.data);
      }
      setLoading(false);
    });
  }, [range]);

  if (loading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return <div style={{ padding: 40, color: "#ff6b7a" }}>{error}</div>;
  }

  if (!data) return null;

  if (data.totalGenerations === 0) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "60px auto",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: "rgba(180,255,0,0.12)",
            boxShadow: "0 0 0 0 rgba(180,255,0,0.4)",
            animation: "analyticsPulse 2s ease-in-out infinite",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BarChart2 size={32} color={ACCENT} />
        </div>
        <style>{`
          @keyframes analyticsPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(180,255,0,0.35); }
            50% { box-shadow: 0 0 0 16px rgba(180,255,0,0); }
          }
        `}</style>
        <h1 style={{ fontSize: "1.35rem", color: "#F0EFE8", marginBottom: 12 }}>
          Deine Creator Stats
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.8)",
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          Hier siehst du bald deine Creator Stats.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 10,
            background: ACCENT,
            color: BG,
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          Erste Creation starten →
        </Link>
      </div>
    );
  }

  const activityHasData = data.dailyActivity.some((d) => d.count > 0);
  const flowMax = Math.max(...data.flowUsage.map((f) => f.count), 1);
  const flowChartData = [...data.flowUsage]
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  const creditChartData = data.creditHistory.map((t) => ({
    ...t,
    label: formatDateTime(t.date),
    shortLabel: formatDate(t.date),
  }));

  return (
    <div className="w-full min-w-0 max-w-[960px] mx-auto box-border" style={{ padding: "8px 0 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "#F0EFE8",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Deine Creator Stats
        </h1>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: 4,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {RANGES.map((r) => {
            const active = range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                style={{
                  padding: "10px 14px",
                  minHeight: 44,
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  fontWeight: active ? 700 : 500,
                  fontFamily: "inherit",
                  background: active ? ACCENT : "transparent",
                  color: active ? BG : "rgba(255,255,255,0.75)",
                  transition: "all 0.15s",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview cards */}
      <div
        className="analytics-overview-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <div style={cardStyle}>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
            Gesamt Creations
          </p>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: ACCENT,
              lineHeight: 1,
            }}
          >
            {data.totalGenerations}
          </p>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(240,239,232,0.4)",
              marginTop: 8,
            }}
          >
            +{data.thisWeekGenerations} diese Woche
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
            Credits verbraucht
          </p>
          <p
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: ACCENT,
              lineHeight: 1,
            }}
          >
            {data.totalCreditsSpent}
          </p>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(240,239,232,0.4)",
              marginTop: 8,
            }}
          >
            Ø {data.avgCreditsPerGeneration} pro Creation
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
            Aktivste Funktion
          </p>
          <p
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#F0EFE8",
              lineHeight: 1.3,
            }}
          >
            {data.mostUsedFlow?.name ?? "—"}
          </p>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(240,239,232,0.4)",
              marginTop: 8,
            }}
          >
            {data.mostUsedFlow?.count ?? 0} mal genutzt
          </p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
            Streak
          </p>
          <p
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#F0EFE8",
              lineHeight: 1,
            }}
          >
            🔥 {data.currentStreak} Tage aktiv
          </p>
          <p
            style={{
              fontSize: "0.78rem",
              color: "rgba(240,239,232,0.4)",
              marginTop: 8,
            }}
          >
            Persönlicher Rekord: {data.recordStreak} Tage
          </p>
        </div>
      </div>

      {/* Activity */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Deine Aktivität</h2>
        <div style={{ ...cardStyle, padding: "16px 8px 8px" }}>
          {!activityHasData ? (
            <p
              style={{
                textAlign: "center",
                padding: "48px 16px",
                color: "rgba(240,239,232,0.35)",
                fontSize: "0.9rem",
              }}
            >
              Noch keine Aktivität in diesem Zeitraum
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={data.dailyActivity}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(180,255,0,0.25)" />
                    <stop offset="100%" stopColor="rgba(180,255,0,0.02)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f12",
                    border: "1px solid rgba(180,255,0,0.2)",
                    borderRadius: 8,
                    fontSize: "0.8rem",
                  }}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as {
                      date: string;
                      count: number;
                    };
                    if (!row) return "";
                    return `${formatDate(row.date)} · ${row.count} Creation${row.count === 1 ? "" : "s"}`;
                  }}
                  formatter={(value) => [Number(value ?? 0), "Creations"]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#activityFill)"
                  dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: ACCENT, stroke: BG, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Flow usage */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Genutzte Features</h2>
        <div style={{ ...cardStyle, padding: "16px 12px" }}>
          {flowChartData.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                padding: 32,
                color: "rgba(240,239,232,0.35)",
              }}
            >
              Noch keine Feature-Nutzung
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(160, flowChartData.length * 44)}
            >
              <BarChart
                data={flowChartData}
                layout="vertical"
                margin={{ top: 0, right: 48, left: 4, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fill: "#F0EFE8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
                  {flowChartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={ACCENT}
                      fillOpacity={0.25 + (0.75 * entry.count) / flowMax}
                    />
                  ))}
                </Bar>
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    background: "#0f0f12",
                    border: "1px solid rgba(180,255,0,0.2)",
                    borderRadius: 8,
                  }}
                  formatter={(v) => [`${Number(v ?? 0)}×`, "Nutzungen"]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ marginTop: 8 }}>
            {data.flowUsage.map((f) => (
              <div
                key={f.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "rgba(240,239,232,0.35)",
                  padding: "4px 0",
                }}
              >
                <span>{f.label}</span>
                <span style={{ color: f.count > 0 ? ACCENT : "rgba(255,255,255,0.65)" }}>
                  {f.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credits */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Credits Verlauf</h2>
        <div
          style={{ ...cardStyle, padding: "16px 8px 8px", marginBottom: 16 }}
        >
          {creditChartData.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                padding: 40,
                color: "rgba(240,239,232,0.35)",
              }}
            >
              Noch keine Credit-Transaktionen
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={creditChartData}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f12",
                    border: "1px solid rgba(180,255,0,0.2)",
                    borderRadius: 8,
                    fontSize: "0.78rem",
                  }}
                  formatter={(v, _n, props) => {
                    const p = props?.payload as {
                      amount: number;
                      description: string;
                    };
                    const sign = p.amount >= 0 ? "+" : "";
                    return [
                      `${Number(v ?? 0)} (${sign}${p.amount})`,
                      p.description,
                    ];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const p = payload as { isPurchase: boolean };
                    if (p.isPurchase && cx != null && cy != null) {
                      return (
                        <circle
                          key={`${cx}-${cy}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#22c55e"
                          stroke={BG}
                          strokeWidth={2}
                        />
                      );
                    }
                    return (
                      <circle
                        key={`${cx}-${cy}-line`}
                        cx={cx}
                        cy={cy}
                        r={2}
                        fill={ACCENT}
                        strokeWidth={0}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table
            className="dashboard-data-table"
            style={{
              width: "100%",
              minWidth: 520,
              borderCollapse: "collapse",
              fontSize: "0.78rem",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                {["Datum", "Aktion", "Credits (+/-)", "Verbleibend"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        color: "rgba(255,255,255,0.65)",
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((t, i) => (
                <tr
                  key={`${t.date}-${i}`}
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    {formatDateTime(t.date)}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#F0EFE8" }}>
                    {t.action}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontWeight: 700,
                      color: t.amount >= 0 ? "#22c55e" : "#ff6b7a",
                    }}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {t.amount}
                  </td>
                  <td style={{ padding: "10px 12px", color: ACCENT }}>
                    {t.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Saved content */}
      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Gespeicherte Scripts &amp; Ideen</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Scripts",
              count: data.savedCounts.scripts,
              href: "/dashboard/script-generator/saved",
            },
            {
              label: "Nischen-Ideen",
              count: data.savedCounts.nicheIdeas,
              href: "/dashboard/niche-analyzer",
            },
            {
              label: "Outlier-Konzepte",
              count: data.savedCounts.outlierConcepts,
              href: "/dashboard/outlier-detector",
            },
          ].map((item) => (
            <div key={item.label} style={cardStyle}>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 6,
                }}
              >
                {item.label}
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: ACCENT }}>
                {item.count}
              </p>
              <Link
                href={item.href}
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  fontSize: "0.75rem",
                  color: ACCENT,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Alle ansehen →
              </Link>
            </div>
          ))}
        </div>

        {data.savedPreviews.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.savedPreviews.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                style={{
                  ...cardStyle,
                  display: "block",
                  textDecoration: "none",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      textTransform: "none",
                      letterSpacing: "0.08em",
                      color: ACCENT,
                    }}
                  >
                    {item.kind === "script"
                      ? "Script"
                      : item.kind === "niche"
                        ? "Nische"
                        : "Outlier"}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.65)" }}>
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: "0.88rem",
                    color: "#F0EFE8",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
