"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Rocket } from "lucide-react";
import {
  generatePhCopy,
  type PhLaunchCopy,
} from "@/app/actions/generate-ph-copy";
import { PH_CHECKLIST, PH_CHECKLIST_TOTAL } from "@/lib/ph-checklist";

const CHECKLIST_KEY = "ph-launch-checklist";
const URL_KEY = "ph-launch-url";
const SNAPSHOTS_KEY = "ph-launch-snapshots";
const PROMO_KEY = "ph-promo-result";

type Snapshot = {
  time: string;
  upvotes: number;
  rank: number;
  comments: number;
};

type PromoResult = {
  code: string;
  expiresAt: string;
  couponId: string;
  dashboardUrl: string;
  message: string;
};

const OUTREACH_TEMPLATE = `Hey [Name],

ich launche heute InfluexAI auf ProductHunt — ein KI Creator Studio für YouTube Shorts.

Würdest du 2 Minuten opfern und auf upvoten?
👉 [PRODUCTHUNT_LINK]

Als Dankeschön: Code FRIEND50 für 50% auf dein erstes Credit-Paket.

Danke! 🙏`;

const card: CSSProperties = {
  padding: 22,
  borderRadius: 16,
  background: "#0f0f12",
  border: "1px solid rgba(255,255,255,0.07)",
  marginBottom: 24,
};

const sectionTitle: CSSProperties = {
  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
  fontSize: "1.35rem",
  letterSpacing: "0.04em",
  color: "#F0EFE8",
  marginBottom: 16,
};

function loadChecklist(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function loadSnapshots(): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? (JSON.parse(raw) as Snapshot[]) : [];
  } catch {
    return [];
  }
}

async function copyText(
  text: string,
  setCopied: (v: string | null) => void,
  id: string
) {
  await navigator.clipboard.writeText(text);
  setCopied(id);
  setTimeout(() => setCopied(null), 2000);
}

function CopyBlock({
  id,
  label,
  text,
  copiedId,
  onCopy,
  rows = 4,
}: {
  id: string;
  label: string;
  text: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  rows?: number;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{ fontSize: "0.78rem", fontWeight: 700, color: "#B4FF00" }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={() => onCopy(text, id)}
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            border: "1px solid rgba(180,255,0,0.3)",
            background: "rgba(180,255,0,0.08)",
            color: "#B4FF00",
            fontSize: "0.72rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {copiedId === id ? "✓ Kopiert" : "Kopieren"}
        </button>
      </div>
      <textarea
        readOnly
        value={text}
        rows={rows}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          background: "#18181d",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#F0EFE8",
          fontSize: "0.85rem",
          lineHeight: 1.55,
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

export default function ProductHuntLaunchKitPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copy, setCopy] = useState<PhLaunchCopy | null>(null);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [phUrl, setPhUrl] = useState("");
  const [upvotes, setUpvotes] = useState("");
  const [rank, setRank] = useState("");
  const [comments, setComments] = useState("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChecked(loadChecklist());
    setPhUrl(localStorage.getItem(URL_KEY) ?? "");
    setSnapshots(loadSnapshots());
    try {
      const p = localStorage.getItem(PROMO_KEY);
      if (p) setPromo(JSON.parse(p) as PromoResult);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const checkedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );
  const progress = PH_CHECKLIST_TOTAL
    ? Math.round((checkedCount / PH_CHECKLIST_TOTAL) * 100)
    : 0;

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    void copyText(text, setCopiedId, id);
  };

  const runCopyGen = async () => {
    setCopyLoading(true);
    setCopyError(null);
    const res = await generatePhCopy();
    setCopyLoading(false);
    if (!res.success) setCopyError(res.error);
    else setCopy(res.copy);
  };

  const runPromo = async () => {
    setPromoLoading(true);
    setPromoError(null);
    const res = await fetch("/api/admin/ph-promo", { method: "POST" });
    const data = await res.json();
    setPromoLoading(false);
    if (!res.ok) {
      setPromoError(data.error ?? "Fehler");
      return;
    }
    const result: PromoResult = {
      code: data.code,
      expiresAt: data.expiresAt,
      couponId: data.couponId,
      dashboardUrl: data.dashboardUrl,
      message: data.message,
    };
    setPromo(result);
    localStorage.setItem(PROMO_KEY, JSON.stringify(result));
  };

  const outreachText = OUTREACH_TEMPLATE.replace(
    "[PRODUCTHUNT_LINK]",
    phUrl.trim() || "https://www.producthunt.com/posts/influexai"
  );

  const saveSnapshot = () => {
    const snap: Snapshot = {
      time: new Date().toISOString(),
      upvotes: parseInt(upvotes, 10) || 0,
      rank: parseInt(rank, 10) || 0,
      comments: parseInt(comments, 10) || 0,
    };
    const next = [...snapshots, snap];
    setSnapshots(next);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(next));
    if (phUrl.trim()) localStorage.setItem(URL_KEY, phUrl.trim());
  };

  const chartData = snapshots.map((s) => ({
    label: new Date(s.time).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    upvotes: s.upvotes,
    rank: s.rank,
    comments: s.comments,
  }));

  const refreshFromStorage = useCallback(() => {
    setSnapshots(loadSnapshots());
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const iv = setInterval(refreshFromStorage, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [hydrated, refreshFromStorage]);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.9rem",
    outline: "none" as const,
    fontFamily: "inherit",
  };

  if (!hydrated) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#505055" }}>
        Lade Launch Kit…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Rocket size={28} color="#B4FF00" />
          <h1
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              color: "#F0EFE8",
              margin: 0,
            }}
          >
            ProductHunt Launch Kit
          </h1>
        </div>
        <p style={{ color: "#505055", fontSize: "0.88rem", margin: 0 }}>
          Internes Tool — Copy, Checkliste, Promo-Code & Launch-Tracker
        </p>
        <Link
          href="/admin"
          style={{
            display: "inline-block",
            marginTop: 12,
            color: "#505055",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          ← Admin Panel
        </Link>
      </div>

      {/* Section 1: Checklist */}
      <section style={card}>
        <h2 style={sectionTitle}>Launch Checklist</h2>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.82rem",
              color: "#505055",
              marginBottom: 8,
            }}
          >
            <span>
              {checkedCount} / {PH_CHECKLIST_TOTAL} erledigt
            </span>
            <span style={{ color: "#B4FF00", fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "#222228",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#B4FF00",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {PH_CHECKLIST.map((section) => (
          <div key={section.title} style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#B4FF00",
                marginBottom: 10,
              }}
            >
              {section.title}
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {section.items.map((item) => {
                const done = !!checked[item.id];
                return (
                  <li key={item.id} style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        cursor: "pointer",
                        fontSize: "0.88rem",
                        color: done ? "#505055" : "#F0EFE8",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleItem(item.id)}
                        style={{ marginTop: 3, accentColor: "#B4FF00" }}
                      />
                      {item.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {/* Section 2: Copy Generator */}
      <section style={card}>
        <h2 style={sectionTitle}>Copy Generator</h2>
        <button
          type="button"
          onClick={runCopyGen}
          disabled={copyLoading}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: copyLoading ? "#333" : "#B4FF00",
            color: "#060608",
            fontWeight: 800,
            cursor: copyLoading ? "wait" : "pointer",
            fontFamily: "inherit",
            marginBottom: 16,
          }}
        >
          {copyLoading ? "Generiere…" : "Copy generieren"}
        </button>
        {copyError && (
          <p style={{ color: "#ff6b7a", fontSize: "0.88rem" }}>{copyError}</p>
        )}
        {copy && (
          <div>
            {copy.taglines.map((t, i) => (
              <CopyBlock
                key={`tag-${i}`}
                id={`tag-${i}`}
                label={`Tagline — ${t.angle} (${t.text.length}/60)`}
                text={t.text}
                copiedId={copiedId}
                onCopy={handleCopy}
                rows={1}
              />
            ))}
            <CopyBlock
              id="description"
              label="Beschreibung (ProductHunt)"
              text={copy.description}
              copiedId={copiedId}
              onCopy={handleCopy}
              rows={10}
            />
            <CopyBlock
              id="maker"
              label="Maker Comment"
              text={copy.makerComment}
              copiedId={copiedId}
              onCopy={handleCopy}
              rows={8}
            />
            <CopyBlock
              id="reply"
              label="First Reply Template"
              text={copy.firstReplyTemplate}
              copiedId={copiedId}
              onCopy={handleCopy}
              rows={4}
            />
            {copy.twitterThread.map((tweet, i) => (
              <CopyBlock
                key={`tw-${i}`}
                id={`tw-${i}`}
                label={`Twitter ${i + 1}/3`}
                text={tweet}
                copiedId={copiedId}
                onCopy={handleCopy}
                rows={3}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Promo Code */}
      <section style={card}>
        <h2 style={sectionTitle}>Promo Code Generator</h2>
        <button
          type="button"
          onClick={runPromo}
          disabled={promoLoading}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            background: promoLoading ? "#333" : "#B4FF00",
            color: "#060608",
            fontWeight: 800,
            cursor: promoLoading ? "wait" : "pointer",
            fontFamily: "inherit",
            marginBottom: 16,
          }}
        >
          {promoLoading ? "Erstelle…" : "PH Launch Code erstellen"}
        </button>
        {promoError && (
          <p style={{ color: "#ff6b7a", fontSize: "0.88rem" }}>{promoError}</p>
        )}
        {promo && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(180,255,0,0.06)",
              border: "1px solid rgba(180,255,0,0.2)",
            }}
          >
            <p style={{ color: "#B4FF00", fontWeight: 700, margin: "0 0 8px" }}>
              {promo.message}
            </p>
            <p
              style={{
                color: "#505055",
                fontSize: "0.82rem",
                margin: "0 0 4px",
              }}
            >
              Coupon ID: {promo.couponId}
            </p>
            <p
              style={{
                color: "#505055",
                fontSize: "0.82rem",
                margin: "0 0 12px",
              }}
            >
              Läuft ab: {new Date(promo.expiresAt).toLocaleString("de-DE")}
            </p>
            <a
              href={promo.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#B4FF00", fontSize: "0.85rem" }}
            >
              Stripe Dashboard öffnen →
            </a>
          </div>
        )}
      </section>

      {/* Section 4: Outreach */}
      <section style={card}>
        <h2 style={sectionTitle}>Supporter Outreach</h2>
        <p style={{ color: "#505055", fontSize: "0.82rem", marginBottom: 12 }}>
          PH-Link wird aus dem Tracker übernommen (oder Platzhalter).
        </p>
        <CopyBlock
          id="outreach"
          label="Nachricht an Supporter"
          text={outreachText}
          copiedId={copiedId}
          onCopy={handleCopy}
          rows={12}
        />
      </section>

      {/* Section 5: Launch Tracker */}
      <section style={card}>
        <h2 style={sectionTitle}>Launch Day Tracker</h2>
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#505055",
            marginBottom: 6,
          }}
        >
          ProductHunt URL
        </label>
        <input
          type="url"
          value={phUrl}
          onChange={(e) => setPhUrl(e.target.value)}
          placeholder="https://www.producthunt.com/posts/..."
          style={{ ...inputStyle, marginBottom: 16 }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {(
            [
              {
                key: "upvotes",
                label: "Aktuelle Upvotes",
                value: upvotes,
                set: setUpvotes,
              },
              {
                key: "rank",
                label: "Aktueller Rank",
                value: rank,
                set: setRank,
              },
              {
                key: "comments",
                label: "Kommentare",
                value: comments,
                set: setComments,
              },
            ] as const
          ).map((f) => (
            <div key={f.key}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  color: "#505055",
                  marginBottom: 6,
                }}
              >
                {f.label}
              </label>
              <input
                type="number"
                min={0}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={saveSnapshot}
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid rgba(180,255,0,0.35)",
            background: "rgba(180,255,0,0.08)",
            color: "#B4FF00",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 20,
          }}
        >
          Aktualisieren
        </button>

        <p style={{ fontSize: "0.75rem", color: "#505055", marginBottom: 12 }}>
          Auto-Refresh alle 5 Min · Ziele: 50 (good), 100 (great), 200 (top 5)
        </p>

        {chartData.length === 0 ? (
          <p style={{ color: "#505055", textAlign: "center", padding: 24 }}>
            Noch keine Daten — Werte eingeben und „Aktualisieren“ klicken.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#505055", fontSize: 10 }} />
              <YAxis
                tick={{ fill: "#505055", fontSize: 10 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f0f12",
                  border: "1px solid rgba(180,255,0,0.2)",
                  borderRadius: 8,
                }}
              />
              <ReferenceLine
                y={50}
                stroke="#505055"
                strokeDasharray="4 4"
                label={{ value: "Good 50", fill: "#505055", fontSize: 10 }}
              />
              <ReferenceLine
                y={100}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: "Great 100", fill: "#f59e0b", fontSize: 10 }}
              />
              <ReferenceLine
                y={200}
                stroke="#B4FF00"
                strokeDasharray="4 4"
                label={{ value: "Top 5 · 200", fill: "#B4FF00", fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="upvotes"
                stroke="#B4FF00"
                strokeWidth={2}
                dot={{ r: 4, fill: "#B4FF00" }}
                name="Upvotes"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {snapshots.length > 0 && (
          <div style={{ marginTop: 16, fontSize: "0.78rem", color: "#505055" }}>
            {snapshots.length} Einträge · Letzter:{" "}
            {new Date(snapshots[snapshots.length - 1].time).toLocaleString(
              "de-DE"
            )}
          </div>
        )}
      </section>
    </div>
  );
}
