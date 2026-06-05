"use client";

import { useState } from "react";

const ACCENT = "#B4FF00";
const STORAGE_KEY = "influexai_api_playground_key";

type PlaygroundEndpoint = {
  id: string;
  method: "GET" | "POST";
  path: string;
  defaultBody?: string;
};

const ENDPOINTS: PlaygroundEndpoint[] = [
  { id: "me", method: "GET", path: "/me" },
  {
    id: "script",
    method: "POST",
    path: "/script",
    defaultBody: JSON.stringify(
      {
        topic: "Morning Routine",
        duration: "60s",
        tone: "energetic",
        language: "de",
      },
      null,
      2
    ),
  },
  {
    id: "image",
    method: "POST",
    path: "/image",
    defaultBody: JSON.stringify(
      {
        prompt: "Creator at desk, acid noir lighting, cinematic",
        category: "creator",
        aspect_ratio: "landscape_16_9",
      },
      null,
      2
    ),
  },
  {
    id: "niche",
    method: "POST",
    path: "/niche",
    defaultBody: JSON.stringify(
      { topic: "Fitness", audience: "25-34", format: "shorts" },
      null,
      2
    ),
  },
  {
    id: "viral-score",
    method: "POST",
    path: "/viral-score",
    defaultBody: JSON.stringify(
      {
        script:
          "Stop scrolling — this 60-second morning routine changed how I edit every Short.",
        thumbnail_idea: "Split face shocked reaction, neon green accent text HOOK",
        niche: "Productivity",
        language: "de",
      },
      null,
      2
    ),
  },
  { id: "generations", method: "GET", path: "/generations?limit=10" },
];

export function ApiPlayground({ baseUrl }: { baseUrl: string }) {
  const [apiKey, setApiKey] = useState("");
  const [selected, setSelected] = useState(ENDPOINTS[0].id);
  const [body, setBody] = useState(ENDPOINTS[0].defaultBody ?? "");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const ep =
    ENDPOINTS.find((e) => e.id === selected) ?? ENDPOINTS[0];

  const persistKey = (value: string) => {
    setApiKey(value);
    if (typeof window !== "undefined") {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loadStoredKey = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
  };

  const onSelectEndpoint = (id: string) => {
    setSelected(id);
    const next = ENDPOINTS.find((e) => e.id === id);
    if (next?.defaultBody) setBody(next.defaultBody);
    else setBody("");
    setResponse(null);
    setStatus(null);
  };

  const send = async () => {
    if (!apiKey.trim()) {
      alert("Bitte API-Key eingeben.");
      return;
    }
    setLoading(true);
    setResponse(null);
    setStatus(null);
    try {
      const url = `${baseUrl.replace(/\/$/, "")}${ep.path}`;
      const init: RequestInit = {
        method: ep.method,
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          Accept: "application/json",
        },
      };
      if (ep.method === "POST") {
        init.headers = {
          ...init.headers,
          "Content-Type": "application/json",
        };
        init.body = body;
      }
      const res = await fetch(url, init);
      setStatus(res.status);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (e) {
      setStatus(0);
      setResponse(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="playground" style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontFamily: "var(--font-bebas), sans-serif",
          fontSize: "1.5rem",
          color: "#F0EFE8",
          marginBottom: 12,
        }}
      >
        Playground
      </h2>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", marginBottom: 16 }}>
        Teste Endpoints direkt im Browser. Business-Plan und gültiger API-Key
        erforderlich. Der Key wird nur lokal im Browser gespeichert.
      </p>

      <div
        style={{
          padding: 20,
          borderRadius: 14,
          background: "#0f0f12",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            marginBottom: 6,
          }}
        >
          API Key
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => persistKey(e.target.value)}
            onFocus={loadStoredKey}
            placeholder="inf_live_…"
            style={{
              flex: 1,
              minWidth: 220,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#18181d",
              color: "#F0EFE8",
              fontFamily: "monospace",
              fontSize: "0.78rem",
            }}
          />
          <button
            type="button"
            onClick={loadStoredKey}
            style={ghostBtn}
          >
            Aus Speicher laden
          </button>
        </div>

        <label
          style={{
            display: "block",
            fontSize: "0.72rem",
            color: "rgba(255,255,255,0.65)",
            marginBottom: 6,
          }}
        >
          Endpoint
        </label>
        <select
          value={selected}
          onChange={(e) => onSelectEndpoint(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 360,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#18181d",
            color: "#F0EFE8",
            marginBottom: 16,
            fontFamily: "inherit",
          }}
        >
          {ENDPOINTS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.method} {e.path}
            </option>
          ))}
        </select>

        {ep.method === "POST" && (
          <>
            <label
              style={{
                display: "block",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.65)",
                marginBottom: 6,
              }}
            >
              JSON Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#0a0a0c",
                color: ACCENT,
                fontFamily: "monospace",
                fontSize: "0.78rem",
                marginBottom: 16,
                resize: "vertical",
              }}
            />
          </>
        )}

        <button
          type="button"
          onClick={send}
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: ACCENT,
            color: "#060608",
            fontWeight: 800,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {loading ? "Sende…" : "Request senden"}
        </button>

        {(response !== null || status !== null) && (
          <div style={{ marginTop: 20 }}>
            {status !== null && (
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", marginBottom: 8 }}>
                Status:{" "}
                <span
                  style={{
                    color: status >= 200 && status < 300 ? "#10b981" : "#ff6b7a",
                    fontWeight: 700,
                  }}
                >
                  {status || "—"}
                </span>
              </p>
            )}
            <pre
              style={{
                margin: 0,
                padding: 16,
                borderRadius: 10,
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "auto",
                fontSize: "0.75rem",
                color: "#a3a3a8",
                maxHeight: 360,
              }}
            >
              {response}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "rgba(255,255,255,0.65)",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "0.82rem",
};
