"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { countWinner, rateWinner, type AbResults } from "@/lib/ab-stats";

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function cellStyle(winner: boolean): CSSProperties {
  return {
    padding: "14px 16px",
    color: winner ? "#B4FF00" : "#F0EFE8",
    fontWeight: winner ? 700 : 500,
    background: winner ? "rgba(180,255,0,0.06)" : "transparent",
  };
}

export function AdminAbTestTab() {
  const [results, setResults] = useState<AbResults | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/ab-stats")
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results ?? null);
        setWarning(data.warning ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReset = async () => {
    if (
      !confirm(
        "Alle A/B-Test-Events löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }
    setResetting(true);
    const res = await fetch("/api/admin/ab-reset", { method: "POST" });
    setResetting(false);
    if (res.ok) load();
    else alert("Zurücksetzen fehlgeschlagen.");
  };

  if (loading) {
    return (
      <p style={{ color: "rgba(255,255,255,0.65)", padding: 40, textAlign: "center" }}>
        Lade A/B-Daten…
      </p>
    );
  }

  const a = results?.a ?? {
    views: 0,
    signupClicks: 0,
    signups: 0,
    clickRate: 0,
    conversionRate: 0,
  };
  const b = results?.b ?? {
    views: 0,
    signupClicks: 0,
    signups: 0,
    clickRate: 0,
    conversionRate: 0,
  };

  const viewsWinner = countWinner(a.views, b.views);
  const clicksWinner = countWinner(a.signupClicks, b.signupClicks);
  const clickRateWinner = rateWinner(a.clickRate, b.clickRate);
  const signupsWinner = countWinner(a.signups, b.signups);
  const convWinner = rateWinner(a.conversionRate, b.conversionRate);

  const rows: {
    metric: string;
    aVal: string;
    bVal: string;
    winner: "a" | "b" | null;
    showCheck: boolean;
  }[] = [
    {
      metric: "Views",
      aVal: String(a.views),
      bVal: String(b.views),
      winner: viewsWinner,
      showCheck: false,
    },
    {
      metric: "CTA Clicks",
      aVal: String(a.signupClicks),
      bVal: String(b.signupClicks),
      winner: clicksWinner,
      showCheck: false,
    },
    {
      metric: "Click Rate",
      aVal: pct(a.clickRate),
      bVal: pct(b.clickRate),
      winner: clickRateWinner,
      showCheck: true,
    },
    {
      metric: "Signups",
      aVal: String(a.signups),
      bVal: String(b.signups),
      winner: signupsWinner,
      showCheck: false,
    },
    {
      metric: "Conversion",
      aVal: pct(a.conversionRate),
      bVal: pct(b.conversionRate),
      winner: convWinner,
      showCheck: true,
    },
  ];

  return (
    <div>
      {warning && (
        <p
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: 10,
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
            color: "#f59e0b",
            fontSize: "0.85rem",
          }}
        >
          {warning}
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", margin: 0 }}>
          Landing Page: Variante A (Control) vs. B (Headline + Social Proof)
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,71,87,0.35)",
            background: "rgba(255,71,87,0.08)",
            color: "#ff6b7a",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: resetting ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {resetting ? "…" : "Test zurücksetzen"}
        </button>
      </div>

      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0f0f12",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Metric", "Variant A", "Variant B", "Winner"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    color: "rgba(255,255,255,0.65)",
                    fontWeight: 700,
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.metric}
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <td
                  style={{
                    padding: "14px 16px",
                    color: "#F0EFE8",
                    fontWeight: 600,
                  }}
                >
                  {row.metric}
                </td>
                <td style={cellStyle(row.winner === "a")}>{row.aVal}</td>
                <td style={cellStyle(row.winner === "b")}>{row.bVal}</td>
                <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.65)" }}>
                  {row.winner && row.showCheck ? (
                    <span style={{ color: "#B4FF00" }}>
                      ✓ {row.winner.toUpperCase()}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 16, fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>
        ✓ Winner bei Click Rate & Conversion nur wenn Differenz &gt; 5%.
      </p>
    </div>
  );
}
