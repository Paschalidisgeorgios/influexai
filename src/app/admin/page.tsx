"use client";

import { useEffect, useState } from "react";
import { AdminAbTestTab } from "@/components/admin/ab-test-tab";
import { AdminChurnTab } from "@/components/admin/churn-tab";
import { AdminCommunityTab } from "@/components/admin/community-tab";
import { AdminApiTab } from "@/components/admin/api-tab";

interface Stats {
  totalUsers: number;
  freeUsers: number;
  starterUsers: number;
  creatorUsers: number;
  proUsers: number;
  businessUsers: number;
  totalCredits: number;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  credits: number;
  created_at: string;
  is_admin: boolean;
}

type AdminTab = "users" | "ab" | "churn" | "community" | "api";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("users");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats ?? null);
        setUsers(Array.isArray(data.users) ? data.users : []);
        setLoading(false);
      })
      .catch(() => {
        setUsers([]);
        setLoading(false);
      });
  }, []);

  const filtered = (users ?? []).filter(
    (u) =>
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const planColor: Record<string, string> = {
    free: "rgba(255,255,255,0.65)",
    starter: "#a78bfa",
    creator: "#B4FF00",
    pro: "#f59e0b",
    business: "#06b6d4",
  };

  const estimatedMonthlyRevenue =
    (stats?.starterUsers ?? 0) * 9.99 +
    (stats?.creatorUsers ?? 0) * 49 +
    (stats?.proUsers ?? 0) * 99 +
    (stats?.businessUsers ?? 0) * 199;

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid #B4FF00",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "rgba(255,255,255,0.65)" }}>Lade Admin-Daten...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem,4vw,3rem)",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 6,
          }}
        >
          ⚙️ Admin Panel
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
          Nutzer & Plattform-Übersicht
        </p>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}
        >
          <a
            href="/dashboard/admin/producthunt"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              background: "rgba(180,255,0,0.08)",
              border: "1px solid rgba(180,255,0,0.25)",
              color: "#B4FF00",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            🚀 ProductHunt Launch Kit →
          </a>
          <a
            href="/dashboard/admin/app-store"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              background: "rgba(180,255,0,0.08)",
              border: "1px solid rgba(180,255,0,0.25)",
              color: "#B4FF00",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📱 App Store Launch Kit →
          </a>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 28,
          padding: 4,
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          width: "fit-content",
        }}
      >
        {(
          [
            { id: "users" as const, label: "Nutzer" },
            { id: "ab" as const, label: "A/B Test" },
            { id: "churn" as const, label: "Churn" },
            { id: "community" as const, label: "Community" },
            { id: "api" as const, label: "API" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: tab === t.id ? 700 : 500,
              fontFamily: "inherit",
              background: tab === t.id ? "#B4FF00" : "transparent",
              color: tab === t.id ? "#060608" : "rgba(255,255,255,0.75)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ab" && <AdminAbTestTab />}

      {tab === "churn" && <AdminChurnTab />}

      {tab === "community" && <AdminCommunityTab />}

      {tab === "api" && <AdminApiTab />}

      {tab === "users" && (
        <>
          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              marginBottom: 32,
            }}
          >
            {[
              {
                label: "Nutzer gesamt",
                value: stats?.totalUsers ?? 0,
                color: "#F0EFE8",
                icon: "👥",
              },
              {
                label: "Free Plan",
                value: stats?.freeUsers ?? 0,
                color: "rgba(255,255,255,0.65)",
                icon: "🆓",
              },
              {
                label: "Starter Plan",
                value: stats?.starterUsers ?? 0,
                color: "#a78bfa",
                icon: "🌱",
              },
              {
                label: "Creator Plan",
                value: stats?.creatorUsers ?? 0,
                color: "#B4FF00",
                icon: "⭐",
              },
              {
                label: "Pro Plan",
                value: stats?.proUsers ?? 0,
                color: "#f59e0b",
                icon: "🚀",
              },
              {
                label: "Business Plan",
                value: stats?.businessUsers ?? 0,
                color: "#06b6d4",
                icon: "💼",
              },
              {
                label: "Credits gesamt",
                value: stats?.totalCredits ?? 0,
                color: "#f59e0b",
                icon: "⚡",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "20px",
                  borderRadius: 14,
                  background: "#0f0f12",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div style={{ fontSize: "1.4rem", marginBottom: 10 }}>
                  {s.icon}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                    fontSize: "2rem",
                    letterSpacing: "0.02em",
                    color: s.color,
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {s.value.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.65)",
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue estimate */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 14,
              marginBottom: 28,
              background: "rgba(180,255,0,0.04)",
              border: "1px solid rgba(180,255,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.65)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                Geschätzter Monatsumsatz
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "2rem",
                  letterSpacing: "0.02em",
                  color: "#B4FF00",
                }}
              >
                €
                {estimatedMonthlyRevenue.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>
              {stats?.starterUsers ?? 0} × €9,99 Starter + {stats?.creatorUsers ?? 0}{" "}
              × €49 Creator + {stats?.proUsers ?? 0} × €99 Pro +{" "}
              {stats?.businessUsers ?? 0} × €199 Business
            </div>
          </div>

          {/* Users Table */}
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#0f0f12",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "1.3rem",
                  letterSpacing: "0.02em",
                  color: "#F0EFE8",
                }}
              >
                Alle Nutzer ({(users ?? []).length})
              </h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suchen..."
                style={{
                  padding: "8px 14px",
                  borderRadius: 9,
                  background: "#18181d",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#F0EFE8",
                  fontSize: "0.875rem",
                  outline: "none",
                  width: 220,
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              />
            </div>

            {/* Column Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                padding: "10px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.65)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <div>Nutzer</div>
              <div>E-Mail</div>
              <div>Plan</div>
              <div>Credits</div>
              <div>Registriert</div>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "32px 20px",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                Keine Nutzer gefunden.
              </div>
            ) : (
              filtered.map((user, i) => (
                <div
                  key={user.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                    padding: "13px 20px",
                    borderBottom:
                      i < filtered.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      "transparent")
                  }
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: "rgba(180,255,0,0.12)",
                        border: "1px solid rgba(180,255,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-bebas), sans-serif",
                        fontSize: "0.95rem",
                        color: "#B4FF00",
                        flexShrink: 0,
                      }}
                    >
                      {(
                        user.full_name?.[0] ??
                        user.email?.[0] ??
                        "?"
                      ).toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#F0EFE8",
                        }}
                      >
                        {user.full_name ?? "—"}
                        {user.is_admin && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.6rem",
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "rgba(255,71,87,0.15)",
                              color: "#ff6b7a",
                              fontWeight: 700,
                            }}
                          >
                            ADMIN
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)" }}>
                    {user.email}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: `${planColor[user.plan] ?? "rgba(255,255,255,0.65)"}18`,
                        border: `1px solid ${planColor[user.plan] ?? "rgba(255,255,255,0.65)"}44`,
                        color: planColor[user.plan] ?? "rgba(255,255,255,0.65)",
                        textTransform: "capitalize",
                      }}
                    >
                      {user.plan}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color:
                        user.credits < 10
                          ? "#ff6b7a"
                          : user.credits < 50
                            ? "#f59e0b"
                            : "#B4FF00",
                    }}
                  >
                    ⚡ {user.credits}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
                    {new Date(user.created_at).toLocaleDateString("de-DE")}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
