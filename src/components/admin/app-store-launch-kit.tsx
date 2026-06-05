"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import {
  generateStoreCopy,
  type StoreCopyBundle,
  type StoreLocaleCopy,
} from "@/app/actions/generate-store-copy";
import {
  APP_STORE_CHECKLIST,
  APP_STORE_CHECKLIST_TOTAL,
  EAS_COMMANDS,
  EAS_JSON_EXAMPLE,
  LAUNCH_TIMELINE,
  SCREENSHOT_CONCEPTS,
} from "@/lib/app-store-checklist";

const CHECKLIST_KEY = "app-store-launch-checklist";
const COPY_KEY = "app-store-launch-copy";

type LocaleTab = "de" | "en" | "el";

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

function loadCopy(): StoreCopyBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COPY_KEY);
    return raw ? (JSON.parse(raw) as StoreCopyBundle) : null;
  } catch {
    return null;
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
  maxHint,
}: {
  id: string;
  label: string;
  text: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  rows?: number;
  maxHint?: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{ fontSize: "0.78rem", fontWeight: 700, color: "#B4FF00" }}
        >
          {label}
          {maxHint ? (
            <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
              {" "}
              ({maxHint})
            </span>
          ) : null}
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

function LocaleCopyPanel({
  locale,
  data,
  copiedId,
  onCopy,
}: {
  locale: LocaleTab;
  data: StoreLocaleCopy;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const prefix = locale;
  return (
    <div>
      <CopyBlock
        id={`${prefix}-name`}
        label="App Name (iOS)"
        text={data.appName}
        copiedId={copiedId}
        onCopy={onCopy}
        rows={1}
        maxHint={`${data.appName.length}/30`}
      />
      <CopyBlock
        id={`${prefix}-subtitle`}
        label="Subtitle (iOS)"
        text={data.subtitle}
        copiedId={copiedId}
        onCopy={onCopy}
        rows={1}
        maxHint={`${data.subtitle.length}/30`}
      />
      <CopyBlock
        id={`${prefix}-short`}
        label="Short Description (Play Store)"
        text={data.shortDescription}
        copiedId={copiedId}
        onCopy={onCopy}
        rows={2}
        maxHint={`${data.shortDescription.length}/80`}
      />
      <CopyBlock
        id={`${prefix}-full`}
        label="Full Description"
        text={data.fullDescription}
        copiedId={copiedId}
        onCopy={onCopy}
        rows={12}
        maxHint={`${data.fullDescription.length}/4000`}
      />
      <CopyBlock
        id={`${prefix}-keywords`}
        label="Keywords (iOS)"
        text={data.keywords}
        copiedId={copiedId}
        onCopy={onCopy}
        rows={2}
        maxHint={`${data.keywords.length}/100`}
      />
      <CopyBlock
        id={`${prefix}-review`}
        label="App Review Notes (iOS)"
        text={data.reviewNotes}
        copiedId={copiedId}
        onCopy={onCopy}
        rows={5}
      />
    </div>
  );
}

export function AppStoreLaunchKit() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copy, setCopy] = useState<StoreCopyBundle | null>(null);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localeTab, setLocaleTab] = useState<LocaleTab>("de");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChecked(loadChecklist());
    setCopy(loadCopy());
    setHydrated(true);
  }, []);

  const checkedCount = useMemo(
    () => Object.values(checked).filter(Boolean).length,
    [checked]
  );
  const progress = APP_STORE_CHECKLIST_TOTAL
    ? Math.round((checkedCount / APP_STORE_CHECKLIST_TOTAL) * 100)
    : 0;

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleCopy = useCallback((text: string, id: string) => {
    void copyText(text, setCopiedId, id);
  }, []);

  const runCopyGen = async () => {
    setCopyLoading(true);
    setCopyError(null);
    const res = await generateStoreCopy();
    setCopyLoading(false);
    if (!res.success) {
      setCopyError(res.error);
      return;
    }
    setCopy(res.copy);
    localStorage.setItem(COPY_KEY, JSON.stringify(res.copy));
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 8,
    border: active
      ? "1px solid rgba(180,255,0,0.45)"
      : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(180,255,0,0.12)" : "transparent",
    color: active ? "#B4FF00" : "rgba(255,255,255,0.65)",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
    fontFamily: "inherit",
  });

  if (!hydrated) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.65)" }}>
        Lade App Store Kit…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Smartphone size={28} color="#B4FF00" />
          <h1
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              color: "#F0EFE8",
              margin: 0,
            }}
          >
            App Store Launch Kit
          </h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", margin: 0 }}>
          iOS & Play Store — Checkliste, ASO-Copy, Screenshots, EAS &
          Launch-Timeline
        </p>
        <Link
          href="/admin"
          style={{
            display: "inline-block",
            marginTop: 12,
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.82rem",
            textDecoration: "none",
          }}
        >
          ← Admin Panel
        </Link>
      </div>

      {/* Part 1: Checklist */}
      <section style={card}>
        <h2 style={sectionTitle}>Asset Checklist</h2>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.65)",
              marginBottom: 8,
            }}
          >
            <span>
              {checkedCount} / {APP_STORE_CHECKLIST_TOTAL} erledigt
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

        {APP_STORE_CHECKLIST.map((section) => (
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
                        color: done ? "rgba(255,255,255,0.65)" : "#F0EFE8",
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

      {/* Part 2: Copy Generator */}
      <section style={card}>
        <h2 style={sectionTitle}>Store Copy Generator</h2>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.85rem",
            marginTop: 0,
            marginBottom: 16,
          }}
        >
          Generiert ASO-Texte für DE, EN und EL (Greek) in einem Durchlauf.
        </p>
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
          {copyLoading ? "Generiere…" : "App Store Copy generieren"}
        </button>
        {copyError && (
          <p style={{ color: "#ff6b7a", fontSize: "0.88rem" }}>{copyError}</p>
        )}
        {copy && (
          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              {(
                [
                  ["de", "DE"],
                  ["en", "EN"],
                  ["el", "EL"],
                ] as const
              ).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocaleTab(code)}
                  style={tabStyle(localeTab === code)}
                >
                  {label}
                </button>
              ))}
            </div>
            <LocaleCopyPanel
              locale={localeTab}
              data={copy[localeTab]}
              copiedId={copiedId}
              onCopy={handleCopy}
            />
          </div>
        )}
      </section>

      {/* Part 3: Screenshot Guide */}
      <section style={card}>
        <h2 style={sectionTitle}>Screenshot Guide</h2>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.85rem",
            marginTop: 0,
            marginBottom: 16,
          }}
        >
          iPhone 6.9&quot;:{" "}
          <strong style={{ color: "#F0EFE8" }}>1320 × 2868 px</strong> · Min. 3
          Screenshots · Simulator oder Gerät + Screenshot-Tool
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <a
            href="https://shots.so"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(180,255,0,0.25)",
              color: "#B4FF00",
              fontSize: "0.82rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Shots.so ↗
          </a>
          <a
            href="https://app-mockup.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F0EFE8",
              fontSize: "0.82rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            AppMockUp ↗
          </a>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SCREENSHOT_CONCEPTS.map((concept, index) => (
            <div
              key={concept.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(140px, 200px) 1fr",
                gap: 20,
                padding: 18,
                borderRadius: 14,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  aspectRatio: "1320/2868",
                  maxHeight: 280,
                  borderRadius: 20,
                  background: concept.frameBg,
                  border: "2px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "40%",
                    height: 5,
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.15)",
                  }}
                />
                <div style={{ padding: "28px 14px 14px", height: "100%" }}>
                  <div
                    style={{
                      fontSize: "0.55rem",
                      fontWeight: 800,
                      color: "#B4FF00",
                      marginBottom: 6,
                    }}
                  >
                    #{index + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-bebas)",
                      fontSize: "0.75rem",
                      color: "#F0EFE8",
                      lineHeight: 1.1,
                      marginBottom: 10,
                    }}
                  >
                    {concept.headline}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minHeight: 120,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px dashed rgba(255,255,255,0.1)",
                      position: "relative",
                    }}
                  >
                    {concept.highlights.map((h, i) => (
                      <div
                        key={h}
                        style={{
                          position: "absolute",
                          top: `${12 + i * 28}%`,
                          left: i % 2 === 0 ? "8%" : "40%",
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: "1.5px solid #B4FF00",
                          background: "rgba(180,255,0,0.15)",
                          fontSize: "0.45rem",
                          color: "#B4FF00",
                          fontWeight: 700,
                          maxWidth: "45%",
                        }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#B4FF00",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: "0 0 6px",
                  }}
                >
                  {concept.screen}
                </p>
                <p
                  style={{
                    color: "#F0EFE8",
                    fontSize: "0.9rem",
                    margin: "0 0 10px",
                  }}
                >
                  {concept.description}
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "0.8rem",
                    margin: "0 0 8px",
                  }}
                >
                  <strong style={{ color: "#F0EFE8" }}>Headline:</strong>{" "}
                  {concept.headline}
                </p>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", margin: 0 }}>
                  <strong style={{ color: "#F0EFE8" }}>Frame:</strong>{" "}
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: concept.frameBg,
                      verticalAlign: "middle",
                      marginRight: 6,
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  {concept.frameBg}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Part 4: EAS Build */}
      <section style={card}>
        <h2 style={sectionTitle}>Expo Build Commands</h2>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "0.85rem",
            marginTop: 0,
            marginBottom: 12,
          }}
        >
          Aus dem Mobile-Repo (
          <code style={{ color: "#B4FF00" }}>influexai-mobile</code>):
        </p>
        <CopyBlock
          id="eas-cmds"
          label="Terminal Commands"
          text={EAS_COMMANDS}
          copiedId={copiedId}
          onCopy={handleCopy}
          rows={14}
        />
        <CopyBlock
          id="eas-json"
          label="eas.json (Beispiel)"
          text={EAS_JSON_EXAMPLE}
          copiedId={copiedId}
          onCopy={handleCopy}
          rows={18}
        />
      </section>

      {/* Part 5: Launch Timeline */}
      <section style={card}>
        <h2 style={sectionTitle}>Launch Day Timeline</h2>
        <div
          style={{
            overflowX: "auto",
            paddingBottom: 8,
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 0,
              minWidth: 720,
              position: "relative",
              paddingTop: 24,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 32,
                left: 24,
                right: 24,
                height: 2,
                background: "rgba(255,255,255,0.08)",
                zIndex: 0,
              }}
            />
            {LAUNCH_TIMELINE.map((step) => {
              const dotColor =
                step.status === "launch"
                  ? "#B4FF00"
                  : step.status === "active"
                    ? "#06b6d4"
                    : "rgba(255,255,255,0.65)";
              const glow =
                step.status === "launch"
                  ? "0 0 12px rgba(180,255,0,0.5)"
                  : "none";
              return (
                <div
                  key={step.id}
                  style={{
                    flex: "1 1 0",
                    minWidth: 110,
                    padding: "0 8px",
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: dotColor,
                      margin: "0 auto 12px",
                      boxShadow: glow,
                      border:
                        step.status === "launch"
                          ? "2px solid #060608"
                          : "2px solid transparent",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#B4FF00",
                      margin: "0 0 4px",
                    }}
                  >
                    {step.phase}
                  </p>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#F0EFE8",
                      margin: "0 0 6px",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.65)",
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
