"use client";

import { useState } from "react";
import Link from "next/link";

const BASE = "https://influexaicreator.com/api/v1";
const ACCENT = "#B4FF00";
const BG = "#060608";

const NAV = [
  { id: "quickstart", label: "Quick Start" },
  { id: "auth", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "rate-limits", label: "Rate Limits" },
];

const CURL_EXAMPLE = `curl -X POST ${BASE}/script \\
  -H "Authorization: Bearer inf_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"topic": "Morning Routine", "duration": "60s", "tone": "energetic"}'`;

const JS_EXAMPLE = `const response = await fetch('${BASE}/script', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer inf_live_YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'Morning Routine',
    duration: '60s',
    tone: 'energetic'
  })
})
const data = await response.json()
console.log(data.data.script)`;

const PY_EXAMPLE = `import requests

r = requests.post(
    "${BASE}/script",
    headers={
        "Authorization": "Bearer inf_live_YOUR_KEY",
        "Content-Type": "application/json",
    },
    json={
        "topic": "Morning Routine",
        "duration": "60s",
        "tone": "energetic",
    },
)
data = r.json()
print(data["data"]["script"])`;

const ENDPOINTS = [
  {
    method: "POST",
    path: "/script",
    credits: 2,
    desc: "Generiert ein Short-Form Video-Script inkl. optionaler Hook-Varianten.",
    params: [
      ["topic", "string", "yes", "Video-Thema oder Titel"],
      ["duration", "string", "no", "z.B. 60s, 90s"],
      ["tone", "string", "no", "z.B. energetic, calm"],
      ["language", "string", "no", "de, en, …"],
      ["hooks", "boolean", "no", "3 Hook-Varianten (default: true)"],
    ],
    response: `{
  "success": true,
  "data": {
    "script": "...",
    "hookVariants": ["...", "..."],
    "wordCount": 89,
    "estimatedSeconds": 62
  },
  "credits_used": 2,
  "credits_remaining": 48
}`,
  },
  {
    method: "POST",
    path: "/niche",
    credits: 2,
    desc: "Analysiert ein Thema und liefert profitable Nischen-Ideen.",
    params: [
      ["topic", "string", "yes", "Hauptthema"],
      ["audience", "string", "no", "Zielgruppe, z.B. 25-34"],
      ["format", "string", "no", "shorts, longform, …"],
    ],
    response: `{
  "success": true,
  "data": { "niches": [{ "title": "...", "potential": 5 }] },
  "credits_used": 2,
  "credits_remaining": 46
}`,
  },
  {
    method: "POST",
    path: "/outlier",
    credits: 3,
    desc: "Findet Outlier-Video-Konzepte für eine Nische.",
    params: [
      ["niche", "string", "yes", "Nische oder Keyword"],
      ["period", "string", "no", "week, month"],
      ["channelSize", "string", "no", "micro, mid, large"],
    ],
    response: `{
  "success": true,
  "data": { "outliers": [{ "title": "...", "outlierScore": 8 }] },
  "credits_used": 3,
  "credits_remaining": 43
}`,
  },
  {
    method: "POST",
    path: "/thumbnail",
    credits: 1,
    desc: "Generiert Thumbnail-Konzepte mit Layout und CTR-Schätzung.",
    params: [
      ["topic", "string", "yes", "Video-Titel"],
      ["style", "string", "no", "text_dominant, face_focus"],
      ["colorEnergy", "string", "no", "acid, warm, cool"],
    ],
    response: `{
  "success": true,
  "data": { "concepts": [{ "conceptTitle": "..." }] },
  "credits_used": 1,
  "credits_remaining": 42
}`,
  },
  {
    method: "GET",
    path: "/credits",
    credits: 0,
    desc: "Prüft verbleibende Credits und API-Verbrauch im Monat.",
    params: [],
    response: `{
  "credits_remaining": 48,
  "credits_used_this_month": 156
}`,
  },
];

export function ApiDocsPage() {
  const [tab, setTab] = useState<"curl" | "js" | "py">("curl");

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#F0EFE8" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          gap: 32,
          padding: "32px 20px 64px",
        }}
      >
        <aside
          className="api-docs-sidebar"
          style={{
            width: 200,
            flexShrink: 0,
            position: "sticky",
            top: 24,
            alignSelf: "flex-start",
            display: "none",
          }}
        >
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              style={{
                display: "block",
                padding: "8px 0",
                color: "#505055",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              {n.label}
            </a>
          ))}
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <section style={{ marginBottom: 48 }}>
            <h1
              style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                margin: "0 0 8px",
                color: "#F0EFE8",
              }}
            >
              InfluexAI API
            </h1>
            <p
              style={{
                color: "#505055",
                fontSize: "1.05rem",
                margin: "0 0 20px",
              }}
            >
              Integriere KI-Content in deine App in 5 Minuten
            </p>
            <Link
              href="/dashboard/api"
              style={{
                display: "inline-block",
                padding: "12px 22px",
                borderRadius: 10,
                background: ACCENT,
                color: BG,
                fontWeight: 800,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              API Key holen →
            </Link>
          </section>

          <section id="quickstart" style={{ marginBottom: 48 }}>
            <h2 style={h2}>Quick Start</h2>
            <p style={p}>
              Authentifiziere jeden Request mit deinem API-Key im{" "}
              <code style={codeInline}>Authorization</code>-Header.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {(
                [
                  ["curl", "cURL"],
                  ["js", "JavaScript"],
                  ["py", "Python"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: tab === id ? ACCENT : "rgba(255,255,255,0.06)",
                    color: tab === id ? BG : "#505055",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: "0.78rem",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <CodeBlock
              code={
                tab === "curl"
                  ? CURL_EXAMPLE
                  : tab === "js"
                    ? JS_EXAMPLE
                    : PY_EXAMPLE
              }
            />
          </section>

          <section id="auth" style={{ marginBottom: 48 }}>
            <h2 style={h2}>Authentication</h2>
            <p style={p}>
              Header:{" "}
              <code style={codeInline}>Authorization: Bearer inf_live_…</code>
            </p>
            <p style={p}>
              Keys werden als SHA-256-Hash gespeichert. Du siehst den vollen Key
              nur einmal bei der Erstellung.
            </p>
          </section>

          <section id="endpoints" style={{ marginBottom: 48 }}>
            <h2 style={h2}>Endpoints</h2>
            <p style={p}>
              Base URL: <code style={codeInline}>{BASE}/</code>
            </p>
            {ENDPOINTS.map((ep) => (
              <div
                key={ep.path}
                style={{
                  marginBottom: 32,
                  padding: 20,
                  borderRadius: 14,
                  background: "#0f0f12",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background:
                        ep.method === "GET"
                          ? "rgba(59,130,246,0.2)"
                          : "rgba(180,255,0,0.15)",
                      color: ep.method === "GET" ? "#60a5fa" : ACCENT,
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      marginRight: 10,
                    }}
                  >
                    {ep.method}
                  </span>
                  <code style={{ color: "#F0EFE8", fontSize: "0.95rem" }}>
                    {BASE}
                    {ep.path}
                  </code>
                  <span
                    style={{
                      marginLeft: 12,
                      fontSize: "0.75rem",
                      color: "#505055",
                    }}
                  >
                    {ep.credits > 0 ? `${ep.credits} Credits` : "Kostenlos"}
                  </span>
                </div>
                <p style={{ ...p, marginTop: 0 }}>{ep.desc}</p>
                {ep.params.length > 0 && (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.78rem",
                      marginBottom: 14,
                    }}
                  >
                    <thead>
                      <tr style={{ color: "#505055", textAlign: "left" }}>
                        {["Name", "Typ", "Pflicht", "Beschreibung"].map((h) => (
                          <th key={h} style={{ padding: "6px 8px" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ep.params.map((row) => (
                        <tr
                          key={row[0]}
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <td style={{ padding: 8, color: ACCENT }}>
                            {row[0]}
                          </td>
                          <td style={{ padding: 8 }}>{row[1]}</td>
                          <td style={{ padding: 8 }}>{row[2]}</td>
                          <td style={{ padding: 8, color: "#505055" }}>
                            {row[3]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#505055",
                    marginBottom: 6,
                  }}
                >
                  Response
                </div>
                <CodeBlock code={ep.response} lang="json" />
              </div>
            ))}
          </section>

          <section id="rate-limits" style={{ marginBottom: 48 }}>
            <h2 style={h2}>Rate Limits</h2>
            <ul style={{ color: "#505055", lineHeight: 1.8, paddingLeft: 20 }}>
              <li>
                <strong style={{ color: "#F0EFE8" }}>60 requests</strong> pro
                Minute pro API-Key
              </li>
              <li>Credits werden mit dem Dashboard-Guthaben geteilt</li>
              <li>Kein zusätzlicher API-Aufschlag — normale Credit-Preise</li>
              <li>
                Mehr Volumen?{" "}
                <a
                  href="mailto:support@influexaicreator.com"
                  style={{ color: ACCENT }}
                >
                  Kontaktiere uns
                </a>
              </li>
            </ul>
            <CodeBlock
              code={`{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retry_after": 60
}`}
              lang="json"
            />
          </section>
        </main>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .api-docs-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const copy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <button
        type="button"
        onClick={copy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: "4px 10px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.06)",
          color: "#505055",
          fontSize: "0.68rem",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Copy
      </button>
      <pre
        style={{
          margin: 0,
          padding: 16,
          paddingTop: 36,
          borderRadius: 10,
          background: "#0a0a0c",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "auto",
          fontSize: "0.78rem",
          lineHeight: 1.5,
        }}
      >
        <code>
          {lang === "json" ? highlightJson(code) : highlightShell(code)}
        </code>
      </pre>
    </div>
  );
}

function highlightShell(text: string) {
  const parts = text.split(
    /(curl|POST|GET|Bearer|inf_live_\w+|https?:\/\/[^\s'"]+)/g
  );
  return parts.map((part, i) => {
    if (/^(curl|POST|GET)$/.test(part))
      return (
        <span key={i} style={{ color: "#c084fc" }}>
          {part}
        </span>
      );
    if (part.startsWith("Bearer") || part.startsWith("inf_live"))
      return (
        <span key={i} style={{ color: ACCENT }}>
          {part}
        </span>
      );
    if (part.startsWith("http"))
      return (
        <span key={i} style={{ color: "#60a5fa" }}>
          {part}
        </span>
      );
    return (
      <span key={i} style={{ color: "#a3a3a8" }}>
        {part}
      </span>
    );
  });
}

function highlightJson(text: string) {
  return text.split(/(".*?")/g).map((part, i) =>
    part.startsWith('"') ? (
      <span key={i} style={{ color: ACCENT }}>
        {part}
      </span>
    ) : (
      <span key={i} style={{ color: "#a3a3a8" }}>
        {part}
      </span>
    )
  );
}

const h2: React.CSSProperties = {
  fontFamily: "var(--font-bebas), sans-serif",
  fontSize: "1.5rem",
  color: "#F0EFE8",
  marginBottom: 12,
};

const p: React.CSSProperties = {
  color: "#505055",
  fontSize: "0.9rem",
  lineHeight: 1.6,
  marginBottom: 12,
};

const codeInline: React.CSSProperties = {
  color: ACCENT,
  background: "rgba(180,255,0,0.08)",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: "0.85em",
};
