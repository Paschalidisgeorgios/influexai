"use client";

import Link from "next/link";
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

const PLAN_COLORS: Record<string, string> = {
  free: "rgba(255,255,255,0.65)",
  starter: "#a78bfa",
  creator: "#c8e6a0",
  pro: "#f59e0b",
  business: "#06b6d4",
};

const TABS: { id: AdminTab; label: string }[] = [
  { id: "users", label: "Nutzer" },
  { id: "ab", label: "A/B Test" },
  { id: "churn", label: "Churn" },
  { id: "community", label: "Community" },
  { id: "api", label: "API" },
];

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

  const estimatedMonthlyRevenue =
    (stats?.starterUsers ?? 0) * 9.99 +
    (stats?.creatorUsers ?? 0) * 49 +
    (stats?.proUsers ?? 0) * 99 +
    (stats?.businessUsers ?? 0) * 199;

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
        <p className="text-sm text-white/55">Lade Admin-Daten…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-white/55">Nutzer- und Plattform-Übersicht</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/admin/producthunt"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 no-underline transition-colors hover:border-white/16 hover:bg-white/[0.05] hover:text-white/90"
          >
            ProductHunt Launch Kit
          </Link>
          <Link
            href="/dashboard/admin/app-store"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 no-underline transition-colors hover:border-white/16 hover:bg-white/[0.05] hover:text-white/90"
          >
            App Store Launch Kit
          </Link>
        </div>
      </header>

      <div className="mb-7 inline-flex flex-wrap gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white/[0.09] text-white"
                : "text-white/55 hover:bg-white/[0.04] hover:text-white/80"
            }`}
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
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { label: "Nutzer gesamt", value: stats?.totalUsers ?? 0, color: "#F0EFE8" },
              { label: "Free Plan", value: stats?.freeUsers ?? 0, color: PLAN_COLORS.free },
              { label: "Starter Plan", value: stats?.starterUsers ?? 0, color: PLAN_COLORS.starter },
              { label: "Creator Plan", value: stats?.creatorUsers ?? 0, color: PLAN_COLORS.creator },
              { label: "Pro Plan", value: stats?.proUsers ?? 0, color: PLAN_COLORS.pro },
              { label: "Business Plan", value: stats?.businessUsers ?? 0, color: PLAN_COLORS.business },
              { label: "Credits gesamt", value: stats?.totalCredits ?? 0, color: "#f59e0b" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/[0.08] bg-[#0c0c0f] p-4"
              >
                <div
                  className="font-mono text-2xl font-semibold tabular-nums leading-none"
                  style={{ color: s.color }}
                >
                  {s.value.toLocaleString()}
                </div>
                <div className="mt-2 text-xs font-medium text-white/50">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0c0f] px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                Geschätzter Monatsumsatz
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white/90">
                €
                {estimatedMonthlyRevenue.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-white/45">
              {stats?.starterUsers ?? 0} × €9,99 Starter + {stats?.creatorUsers ?? 0} × €49
              Creator + {stats?.proUsers ?? 0} × €99 Pro + {stats?.businessUsers ?? 0} × €199
              Business
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0f]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
              <h2 className="text-lg font-semibold text-white">
                Alle Nutzer ({(users ?? []).length})
              </h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suchen…"
                className="w-full max-w-[220px] rounded-lg border border-white/10 bg-[#111114] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
              />
            </div>

            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-2 border-b border-white/[0.06] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
              <div>Nutzer</div>
              <div>E-Mail</div>
              <div>Plan</div>
              <div>Credits</div>
              <div>Registriert</div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-white/50">
                Keine Nutzer gefunden.
              </div>
            ) : (
              filtered.map((user, i) => (
                <div
                  key={user.id}
                  className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] items-center gap-2 px-5 py-3 transition-colors hover:bg-white/[0.02] ${
                    i < filtered.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-semibold text-white/70">
                      {(user.full_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">
                        {user.full_name ?? "—"}
                        {user.is_admin ? (
                          <span className="ml-2 rounded border border-red-400/25 bg-red-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
                            Admin
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="truncate text-xs text-white/55">{user.email}</div>
                  <div>
                    <span
                      className="inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                      style={{
                        color: PLAN_COLORS[user.plan] ?? "rgba(255,255,255,0.65)",
                        borderColor: `${PLAN_COLORS[user.plan] ?? "rgba(255,255,255,0.65)"}44`,
                        background: `${PLAN_COLORS[user.plan] ?? "rgba(255,255,255,0.65)"}14`,
                      }}
                    >
                      {user.plan}
                    </span>
                  </div>
                  <div
                    className="font-mono text-sm font-semibold tabular-nums"
                    style={{
                      color:
                        user.credits < 10
                          ? "#f87171"
                          : user.credits < 50
                            ? "#f59e0b"
                            : "rgba(255,255,255,0.82)",
                    }}
                  >
                    {user.credits}
                  </div>
                  <div className="text-xs text-white/45">
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
