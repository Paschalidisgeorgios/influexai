"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getAgencyDashboard,
  inviteTenantMember,
  transferCreditsToMember,
  removeTenantMember,
  updateTenantBranding,
  type AgencyMember,
} from "@/app/actions/agency";

import type { AgencyDashboardData } from "@/app/actions/agency";

type DashboardData = AgencyDashboardData | { error: string } | null;

export function AgencyDashboard({ subscribed }: { subscribed?: boolean }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("#B4FF00");
  const [secondary, setSecondary] = useState("#060608");
  const [customDomain, setCustomDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAgencyDashboard();
    setData(res);
    if ("tenant" in res && res.tenant) {
      setName(res.tenant.name);
      setPrimary(res.tenant.primary_color);
      setSecondary(res.tenant.secondary_color);
      setCustomDomain(res.tenant.custom_domain ?? "");
      setLogoUrl(res.tenant.logo_url ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p style={{ color: "#505055", padding: 40 }}>Agentur-Dashboard laden…</p>
    );
  }

  if (!data || "error" in data || !("members" in data)) {
    return (
      <div style={{ padding: 40, maxWidth: 560 }}>
        <h1 style={{ color: "#F0EFE8", fontFamily: "var(--font-bebas)" }}>
          Agentur Dashboard
        </h1>
        <p style={{ color: "#505055" }}>
          {"error" in (data ?? {}) ? data?.error : "Keine Agentur."}{" "}
          <Link href="/dashboard/white-label" style={{ color: "var(--accent)" }}>
            White-Label Plan wählen →
          </Link>
        </p>
      </div>
    );
  }

  const { tenant, members, usedSeats, plan } = data;
  const pct = Math.min(100, (usedSeats / tenant.max_seats) * 100);
  const inactive = !tenant.is_active;

  return (
    <div
      style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 48px" }}
    >
      {subscribed && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            background: "rgba(180,255,0,0.1)",
            border: "1px solid rgba(180,255,0,0.3)",
            color: "var(--accent)",
          }}
        >
          ✅ Abo aktiv — willkommen in deinem White-Label Studio!
        </div>
      )}

      {inactive && (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            borderRadius: 10,
            background: "rgba(255,107,122,0.12)",
            border: "1px solid rgba(255,107,122,0.35)",
            color: "#ff6b7a",
            fontWeight: 700,
          }}
        >
          Plan abgelaufen — Kunden haben noch 7 Tage Kulanz, danach kein Zugang.
          Erneuere dein Abo unter Billing.
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "2.5rem",
              color: "#F0EFE8",
              margin: 0,
            }}
          >
            Deine Agentur: {tenant.name}
          </h1>
          <span
            style={{
              display: "inline-block",
              marginTop: 8,
              padding: "4px 12px",
              borderRadius: 8,
              background: "rgba(180,255,0,0.12)",
              color: "var(--accent)",
              fontWeight: 700,
              fontSize: "0.78rem",
            }}
          >
            {plan.name}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "#505055" }}>
            Credits Pool
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--accent)",
            }}
          >
            {tenant.credits_pool}
          </div>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/stripe/agency-credits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: "pool_500" }),
              });
              const j = await res.json();
              if (j.url) window.location.href = j.url;
            }}
            style={{
              marginTop: 8,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "var(--background)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Credits Pool kaufen
          </button>
        </div>
      </div>

      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ color: "#F0EFE8", fontWeight: 600 }}>
            Seats: {usedSeats} / {tenant.max_seats}
          </span>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent)",
              color: "var(--background)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Mitglied einladen
          </button>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 99,
            background: "#222",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "var(--accent)",
            }}
          />
        </div>
        <p style={{ marginTop: 10, fontSize: "0.8rem", color: "#505055" }}>
          Subdomain:{" "}
          <strong style={{ color: "var(--accent)" }}>
            {tenant.slug}.influexaicreator.com
          </strong>
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ color: "#F0EFE8", fontSize: "1.1rem", marginBottom: 12 }}>
          Kunden
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.82rem",
            }}
          >
            <thead>
              <tr style={{ color: "#505055", textAlign: "left" }}>
                {[
                  "Name",
                  "Email",
                  "Registriert",
                  "Aktivität",
                  "Gens",
                  "Credits",
                  "",
                ].map((h) => (
                  <th key={h} style={{ padding: 10 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m: AgencyMember) => (
                <MemberRow key={m.id} member={m} onRefresh={load} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <h2 style={{ color: "#F0EFE8", marginBottom: 16 }}>Branding</h2>
        <div style={{ display: "grid", gap: 12, maxWidth: 480 }}>
          <label style={{ color: "#505055", fontSize: "0.8rem" }}>
            App-Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ color: "#505055", fontSize: "0.8rem" }}>
            Logo URL
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </label>
          <label style={{ color: "#505055", fontSize: "0.8rem" }}>
            Primärfarbe
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              style={{ width: "100%", height: 40 }}
            />
          </label>
          <label style={{ color: "#505055", fontSize: "0.8rem" }}>
            Hintergrund
            <input
              type="color"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              style={{ width: "100%", height: 40 }}
            />
          </label>
          <label style={{ color: "#505055", fontSize: "0.8rem" }}>
            Custom Domain (Enterprise)
            <input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="studio.deine-agentur.de"
              style={inputStyle}
            />
          </label>
          <p style={{ fontSize: "0.75rem", color: "#505055", lineHeight: 1.5 }}>
            CNAME: <code>{tenant.slug}.influexaicreator.com</code> →
            influexaicreator.com
          </p>
          <button
            type="button"
            onClick={async () => {
              const res = await updateTenantBranding({
                name,
                primary_color: primary,
                secondary_color: secondary,
                logo_url: logoUrl,
                custom_domain: customDomain,
              });
              if (res.success) alert("Branding gespeichert");
              else alert(res.error);
            }}
            style={btnStyle}
          >
            Branding speichern
          </button>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            border: `2px solid ${primary}`,
            background: secondary,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                width={36}
                height={36}
                unoptimized
                style={{ borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: primary,
                  color: secondary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {name.charAt(0)}
              </div>
            )}
            <span
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "1.2rem",
                color: "#F0EFE8",
              }}
            >
              {name}
            </span>
          </div>
          <p
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.8rem",
            }}
          >
            Vorschau — so sehen deine Kunden die App.
          </p>
        </div>
      </section>

      {inviteOpen && (
        <Modal onClose={() => setInviteOpen(false)} title="Mitglied einladen">
          <input
            placeholder="E-Mail"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={inputStyle}
          />
          <select
            value={inviteRole}
            onChange={(e) =>
              setInviteRole(e.target.value as "admin" | "member")
            }
            style={inputStyle}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="button"
            onClick={async () => {
              const res = await inviteTenantMember(inviteEmail, inviteRole);
              if (res.success) {
                alert(`Einladung erstellt:\n${res.inviteUrl}`);
                setInviteOpen(false);
                load();
              } else alert(res.error);
            }}
            style={btnStyle}
          >
            Einladen
          </button>
        </Modal>
      )}
    </div>
  );
}

function MemberRow({
  member,
  onRefresh,
}: {
  member: AgencyMember;
  onRefresh: () => void;
}) {
  return (
    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <td style={{ padding: 10, color: "#F0EFE8" }}>
        {member.full_name ?? "—"}
      </td>
      <td style={{ padding: 10 }}>{member.email}</td>
      <td style={{ padding: 10, color: "#505055" }}>
        {new Date(member.created_at).toLocaleDateString("de-DE")}
      </td>
      <td style={{ padding: 10, color: "#505055" }}>
        {member.last_activity
          ? new Date(member.last_activity).toLocaleDateString("de-DE")
          : "—"}
      </td>
      <td style={{ padding: 10 }}>{member.generation_count}</td>
      <td style={{ padding: 10 }}>{member.credits}</td>
      <td style={{ padding: 10 }}>
        <button
          type="button"
          onClick={async () => {
            const n = prompt("Credits vergeben:", "10");
            if (!n) return;
            const res = await transferCreditsToMember(
              member.id,
              parseInt(n, 10)
            );
            alert(res.success ? "OK" : res.error);
            onRefresh();
          }}
          style={smallBtn}
        >
          + Credits
        </button>
        <button
          type="button"
          onClick={() => removeTenantMember(member.id).then(onRefresh)}
          style={{ ...smallBtn, color: "#ff6b7a", marginLeft: 6 }}
        >
          Entfernen
        </button>
      </td>
    </tr>
  );
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
        background: "rgba(6,6,8,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
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
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#18181d",
  color: "#F0EFE8",
  fontFamily: "inherit",
};

const btnStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent)",
  color: "var(--background)",
  fontWeight: 700,
  cursor: "pointer",
};

const smallBtn: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid rgba(180,255,0,0.3)",
  background: "transparent",
  color: "var(--accent)",
  fontSize: "0.72rem",
  cursor: "pointer",
};
