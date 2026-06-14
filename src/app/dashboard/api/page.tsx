"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKeyRow,
  type ApiUsageStats,
} from "@/app/actions/api-keys";

const ACCENT = "#B4FF00";

export default function DeveloperApiPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [usage, setUsage] = useState<ApiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("Production");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listApiKeys();
    if ("error" in res) {
      setError(res.error);
    } else {
      setKeys(res.keys);
      setUsage(res.usage);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    const res = await createApiKey(newKeyName);
    setCreating(false);
    if (res.success) {
      setRevealedKey(res.key);
      load();
    } else {
      alert(res.error);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("API-Key wirklich widerrufen?")) return;
    const res = await revokeApiKey(id);
    if (res.success) load();
    else alert(res.error);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "2.25rem",
            color: "#F0EFE8",
            margin: "0 0 6px",
          }}
        >
          InfluexAI Developer API
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", margin: 0 }}>
          Integriere KI-Content-Generierung in deine eigene App
        </p>
        <Link
          href="/docs"
          style={{
            display: "inline-block",
            marginTop: 12,
            color: ACCENT,
            fontSize: "0.85rem",
            fontWeight: 700,
          }}
        >
          API Docs ansehen →
        </Link>
      </div>

      {revealedKey && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            background: "rgba(180,255,0,0.08)",
            border: "1px solid rgba(180,255,0,0.35)",
          }}
        >
          <p
            style={{
              color: "#ff6b7a",
              fontWeight: 700,
              fontSize: "0.82rem",
              margin: "0 0 8px",
            }}
          >
            ⚠️ Kopiere diesen Key jetzt — er wird nicht erneut angezeigt!
          </p>
          <code
            style={{
              display: "block",
              padding: 12,
              background: "#060608",
              borderRadius: 8,
              color: ACCENT,
              fontSize: "0.78rem",
              wordBreak: "break-all",
            }}
          >
            {revealedKey}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(revealedKey);
              alert("Kopiert!");
            }}
            style={btnStyle}
          >
            In Zwischenablage kopieren
          </button>
          <button
            type="button"
            onClick={() => setRevealedKey(null)}
            style={{
              ...btnStyle,
              marginLeft: 8,
              background: "transparent",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Schließen
          </button>
        </div>
      )}

      {usage && !usage.apiAccess && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            background: "rgba(255,107,122,0.08)",
            border: "1px solid rgba(255,107,122,0.3)",
          }}
        >
          <p style={{ color: "#F0EFE8", margin: "0 0 8px", fontWeight: 700 }}>
            Pro- oder Business-Plan erforderlich
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", margin: 0 }}>
            Die Public API ist im Pro- und Business-Plan verfügbar. Upgrade über
            Pricing — das Upgrade-Modal erscheint automatisch auf dieser Seite.
          </p>
        </div>
      )}

      {usage && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Requests (Monat)", value: usage.requestsThisMonth },
            { label: "Heute (UTC)", value: `${usage.requestsToday}/${usage.rateLimitPerDay}` },
            { label: "Credits via API", value: usage.creditsConsumedThisMonth },
            {
              label: "Rate Limit / Tag",
              value: `Pro ${usage.rateLimitProPerDay} · Business ${usage.rateLimitBusinessPerDay}`,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#0f0f12",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.65)" }}>
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "1.5rem",
                  color: ACCENT,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ color: "#F0EFE8", fontSize: "1rem", marginTop: 0 }}>
          API Keys
        </h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", marginBottom: 16 }}>
          Maximal 3 aktive Keys (Pro & Business). Keys werden gehasht gespeichert —
          einmalig sichtbar nach Erstellung. Credits teilen sich mit dem
          Dashboard-Guthaben.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key-Name"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={
              creating || keys.length >= 3 || (usage !== null && !usage.apiAccess)
            }
            style={btnStyle}
          >
            {creating ? "…" : "API Key generieren"}
          </button>
        </div>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Laden…</p>
        ) : error ? (
          <p style={{ color: "#ff6b7a" }}>{error}</p>
        ) : keys.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.65)" }}>Noch keine API-Keys.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8rem",
              }}
            >
              <thead>
                <tr style={{ color: "rgba(255,255,255,0.65)", textAlign: "left" }}>
                  {[
                    "Name",
                    "Key",
                    "Erstellt",
                    "Zuletzt",
                    "Requests",
                    "Status",
                    "",
                  ].map((h) => (
                    <th key={h} style={{ padding: "8px 10px" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr
                    key={k.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <td style={{ padding: 10, color: "#F0EFE8" }}>{k.name}</td>
                    <td
                      style={{
                        padding: 10,
                        fontFamily: "monospace",
                        color: ACCENT,
                      }}
                    >
                      {k.masked}
                    </td>
                    <td style={{ padding: 10, color: "rgba(255,255,255,0.65)" }}>
                      {new Date(k.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td style={{ padding: 10, color: "rgba(255,255,255,0.65)" }}>
                      {k.last_used_at
                        ? new Date(k.last_used_at).toLocaleDateString("de-DE")
                        : "—"}
                    </td>
                    <td style={{ padding: 10 }}>{k.request_count}</td>
                    <td style={{ padding: 10, color: "#10b981" }}>Aktiv</td>
                    <td style={{ padding: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleRevoke(k.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,107,122,0.4)",
                          background: "transparent",
                          color: "#ff6b7a",
                          cursor: "pointer",
                          fontSize: "0.72rem",
                          fontFamily: "inherit",
                        }}
                      >
                        Widerrufen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>
        <strong style={{ color: "#F0EFE8" }}>Base URL:</strong>{" "}
        <code style={{ color: ACCENT }}>
          https://influexaicreator.com/api/v1/
        </code>
        <br />
        <strong style={{ color: "#F0EFE8" }}>Auth:</strong>{" "}
        <code>Authorization: Bearer inf_live_…</code>
      </section>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 160,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#18181d",
  color: "#F0EFE8",
  fontFamily: "inherit",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: ACCENT,
  color: "#060608",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "0.85rem",
};
