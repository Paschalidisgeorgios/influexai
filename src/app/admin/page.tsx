"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalUsers: number;
  freeUsers: number;
  creatorUsers: number;
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

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(data => {
        setStats(data.stats);
        setUsers(data.users);
        setLoading(false);
      });
  }, []);

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const planColor: Record<string, string> = {
    free: "#505055",
    creator: "#B4FF00",
    business: "#06b6d4",
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid #B4FF00", borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
      }} />
      <p style={{ color: "#505055" }}>Lade Admin-Daten...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(2rem,4vw,3rem)",
          letterSpacing: "0.02em",
          color: "#F0EFE8", marginBottom: 6,
        }}>
          ⚙️ Admin Panel
        </h1>
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>
          Nutzer & Plattform-Übersicht
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12, marginBottom: 32,
      }}>
        {[
          { label: "Nutzer gesamt", value: stats?.totalUsers ?? 0, color: "#F0EFE8", icon: "👥" },
          { label: "Free Plan", value: stats?.freeUsers ?? 0, color: "#505055", icon: "🆓" },
          { label: "Creator Plan", value: stats?.creatorUsers ?? 0, color: "#B4FF00", icon: "⭐" },
          { label: "Business Plan", value: stats?.businessUsers ?? 0, color: "#06b6d4", icon: "💼" },
          { label: "Credits gesamt", value: stats?.totalCredits ?? 0, color: "#f59e0b", icon: "⚡" },
        ].map((s) => (
          <div key={s.label} style={{
            padding: "20px", borderRadius: 14,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 10 }}>{s.icon}</div>
            <div style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "2rem", letterSpacing: "0.02em",
              color: s.color, lineHeight: 1, marginBottom: 4,
            }}>
              {s.value.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#505055", fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue estimate */}
      <div style={{
        padding: "16px 20px", borderRadius: 14, marginBottom: 28,
        background: "rgba(180,255,0,0.04)",
        border: "1px solid rgba(180,255,0,0.15)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#505055", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Geschätzter Monatsumsatz
          </div>
          <div style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "2rem", letterSpacing: "0.02em", color: "#B4FF00",
          }}>
            €{((stats?.creatorUsers ?? 0) * 39 + (stats?.businessUsers ?? 0) * 99).toLocaleString()}
          </div>
        </div>
        <div style={{ fontSize: "0.82rem", color: "#505055" }}>
          {stats?.creatorUsers} × €39 Creator + {stats?.businessUsers} × €99 Business
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0f0f12",
      }}>
        {/* Table Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <h2 style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.3rem", letterSpacing: "0.02em",
            color: "#F0EFE8",
          }}>
            Alle Nutzer ({users.length})
          </h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            style={{
              padding: "8px 14px", borderRadius: 9,
              background: "#18181d",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "#F0EFE8", fontSize: "0.875rem",
              outline: "none", width: 220,
              fontFamily: "var(--font-dm), sans-serif",
            }}
          />
        </div>

        {/* Column Headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          fontSize: "0.68rem", fontWeight: 700,
          color: "#505055", textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          <div>Nutzer</div>
          <div>E-Mail</div>
          <div>Plan</div>
          <div>Credits</div>
          <div>Registriert</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#505055" }}>
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
                borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: "rgba(180,255,0,0.12)",
                  border: "1px solid rgba(180,255,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "0.95rem", color: "#B4FF00", flexShrink: 0,
                }}>
                  {(user.full_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#F0EFE8" }}>
                    {user.full_name ?? "—"}
                    {user.is_admin && (
                      <span style={{
                        marginLeft: 6, fontSize: "0.6rem",
                        padding: "1px 6px", borderRadius: 4,
                        background: "rgba(255,71,87,0.15)",
                        color: "#ff6b7a", fontWeight: 700,
                      }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#505055" }}>
                {user.email}
              </div>
              <div>
                <span style={{
                  fontSize: "0.72rem", fontWeight: 700,
                  padding: "3px 10px", borderRadius: 99,
                  background: `${planColor[user.plan] ?? "#505055"}18`,
                  border: `1px solid ${planColor[user.plan] ?? "#505055"}44`,
                  color: planColor[user.plan] ?? "#505055",
                  textTransform: "capitalize",
                }}>
                  {user.plan}
                </span>
              </div>
              <div style={{
                fontSize: "0.875rem", fontWeight: 700,
                color: user.credits < 10 ? "#ff6b7a" : user.credits < 50 ? "#f59e0b" : "#B4FF00",
              }}>
                ⚡ {user.credits}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#505055" }}>
                {new Date(user.created_at).toLocaleDateString("de-DE")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
