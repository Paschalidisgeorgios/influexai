"use client";

import { useState } from "react";

type Platform = "tiktok" | "instagram" | "youtube" | "linkedin";
type Step = "input" | "loading" | "result";

interface Result {
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  cta: string;
}

const PLATFORMS = [
  { id: "tiktok",     label: "TikTok",     icon: "♪", color: "#ff0050", format: "9:16 · 15-60 Sek." },
  { id: "instagram",  label: "Instagram",  icon: "◉", color: "#e1306c", format: "9:16 / 1:1 · Reel" },
  { id: "youtube",    label: "YouTube",    icon: "▶", color: "#ff0000", format: "16:9 · Shorts" },
  { id: "linkedin",   label: "LinkedIn",   icon: "in", color: "#0a66c2", format: "1:1 / 16:9 · Post" },
];

export default function ProduktWerbungPage() {
  const [step, setStep] = useState<Step>("input");
  const [product, setProduct] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState("");

  const handleGenerate = async () => {
    if (!product.trim()) return;
    setStep("loading");

    try {
      const res = await fetch("/api/produkt-werbung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, platform }),
      });
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch {
      setStep("input");
      alert("Fehler beim Generieren. Bitte versuche es erneut.");
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const sel = PLATFORMS.find(p => p.id === platform)!;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          letterSpacing: "0.02em",
          color: "#F0EFE8", marginBottom: 6,
        }}>
          🛍️ Produkt-Werbung
        </h1>
        <p style={{ color: "#505055", fontSize: "0.9rem" }}>
          Produkt beschreiben → InfluexAI Brain erstellt deinen Werbespot
        </p>
      </div>

      {/* STEP: INPUT */}
      {step === "input" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Product input */}
          <div style={{
            padding: 24, borderRadius: 16,
            background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <label style={{
              fontSize: "0.78rem", fontWeight: 700,
              color: "#505055", display: "block",
              marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Dein Produkt oder Dienstleistung
            </label>
            <textarea
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Beschreibe dein Produkt... z.B. 'Vegane Lippenstifte in 12 Farben, langanhaltend, für 15€. Zielgruppe: Frauen 20-35 die natürliche Kosmetik lieben.'"
              rows={5}
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: 10, background: "#18181d",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#F0EFE8", fontSize: "0.95rem",
                outline: "none", resize: "vertical",
                fontFamily: "var(--font-dm), sans-serif",
                lineHeight: 1.6,
              }}
              onFocus={(e) => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(180,255,0,0.4)"}
              onBlur={(e) => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.09)"}
            />
            <p style={{ fontSize: "0.75rem", color: "#505055", marginTop: 8 }}>
              💡 Tipp: Je mehr Details du angibst, desto besser das Ergebnis.
            </p>
          </div>

          {/* Platform selection */}
          <div style={{
            padding: 24, borderRadius: 16,
            background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <label style={{
              fontSize: "0.78rem", fontWeight: 700,
              color: "#505055", display: "block",
              marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Ziel-Plattform
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {PLATFORMS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPlatform(p.id as Platform)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                    background: platform === p.id ? `${p.color}18` : "#18181d",
                    border: `1px solid ${platform === p.id ? p.color + "55" : "rgba(255,255,255,0.07)"}`,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: platform === p.id ? `${p.color}25` : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.85rem", fontWeight: 800,
                    color: platform === p.id ? p.color : "#505055",
                  }}>{p.icon}</div>
                  <div>
                    <div style={{
                      fontSize: "0.875rem", fontWeight: 700,
                      color: platform === p.id ? "#F0EFE8" : "#505055",
                    }}>{p.label}</div>
                    <div style={{ fontSize: "0.7rem", color: "#505055" }}>{p.format}</div>
                  </div>
                  {platform === p.id && (
                    <div style={{
                      marginLeft: "auto", width: 18, height: 18,
                      borderRadius: "50%", background: p.color,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "0.65rem", color: "#fff", fontWeight: 800,
                    }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!product.trim()}
            style={{
              width: "100%", padding: "15px",
              borderRadius: 12, border: "none",
              background: product.trim() ? "#B4FF00" : "#2a2a2a",
              color: product.trim() ? "#060608" : "#505055",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.3rem", letterSpacing: "0.04em",
              cursor: product.trim() ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            WERBESPOT GENERIEREN →
          </button>
        </div>
      )}

      {/* STEP: LOADING */}
      {step === "loading" && (
        <div style={{
          textAlign: "center", padding: "80px 20px",
          background: "#0f0f12", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            border: "3px solid #B4FF00",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 24px",
          }} />
          <h2 style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "1.8rem", letterSpacing: "0.02em",
            color: "#F0EFE8", marginBottom: 10,
          }}>InfluexAI Brain analysiert...</h2>
          <p style={{ color: "#505055", fontSize: "0.9rem" }}>
            Script, Hook und Hashtags werden generiert für {sel.label}
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* STEP: RESULT */}
      {step === "result" && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Back button */}
          <button
            onClick={() => { setStep("input"); setResult(null); }}
            style={{
              alignSelf: "flex-start", padding: "8px 16px",
              borderRadius: 8, background: "transparent",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "#505055", cursor: "pointer",
              fontSize: "0.82rem",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            ← Neu generieren
          </button>

          {/* Hook */}
          <ResultCard
            title="🎯 Hook (erste 3 Sekunden)"
            content={result.hook}
            onCopy={() => copyText(result.hook, "hook")}
            copied={copied === "hook"}
            accent="#B4FF00"
          />

          {/* Script */}
          <ResultCard
            title="📝 Video-Script"
            content={result.script}
            onCopy={() => copyText(result.script, "script")}
            copied={copied === "script"}
            accent="#06b6d4"
            large
          />

          {/* Caption */}
          <ResultCard
            title="✍️ Caption"
            content={result.caption}
            onCopy={() => copyText(result.caption, "caption")}
            copied={copied === "caption"}
            accent="#10b981"
          />

          {/* Hashtags */}
          <div style={{
            padding: 20, borderRadius: 16,
            background: "#0f0f12", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F0EFE8" }}>🏷️ Hashtags</div>
              <button
                onClick={() => copyText(result.hashtags.join(" "), "hashtags")}
                style={{
                  padding: "5px 12px", borderRadius: 7,
                  background: copied === "hashtags" ? "rgba(180,255,0,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${copied === "hashtags" ? "rgba(180,255,0,0.3)" : "rgba(255,255,255,0.09)"}`,
                  color: copied === "hashtags" ? "#B4FF00" : "#505055",
                  cursor: "pointer", fontSize: "0.75rem",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                {copied === "hashtags" ? "✓ Kopiert!" : "Alle kopieren"}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {result.hashtags.map((tag) => (
                <span key={tag} style={{
                  padding: "4px 10px", borderRadius: 99,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#B4FF00", fontSize: "0.78rem", fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => copyText(tag, tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <ResultCard
            title="📣 Call-to-Action"
            content={result.cta}
            onCopy={() => copyText(result.cta, "cta")}
            copied={copied === "cta"}
            accent="#f59e0b"
          />
        </div>
      )}
    </div>
  );
}

function ResultCard({
  title, content, onCopy, copied, accent, large = false,
}: {
  title: string;
  content: string;
  onCopy: () => void;
  copied: boolean;
  accent: string;
  large?: boolean;
}) {
  return (
    <div style={{
      padding: 20, borderRadius: 16,
      background: "#0f0f12",
      border: `1px solid ${copied ? accent + "44" : "rgba(255,255,255,0.07)"}`,
      transition: "border-color 0.3s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F0EFE8" }}>{title}</div>
        <button
          onClick={onCopy}
          style={{
            padding: "5px 12px", borderRadius: 7,
            background: copied ? `${accent}18` : "rgba(255,255,255,0.05)",
            border: `1px solid ${copied ? accent + "44" : "rgba(255,255,255,0.09)"}`,
            color: copied ? accent : "#505055",
            cursor: "pointer", fontSize: "0.75rem",
            fontFamily: "var(--font-dm), sans-serif",
            transition: "all 0.2s",
          }}
        >
          {copied ? "✓ Kopiert!" : "Kopieren"}
        </button>
      </div>
      <p style={{
        color: "rgba(240,239,232,0.8)", fontSize: "0.9rem",
        lineHeight: 1.75, whiteSpace: "pre-wrap",
        maxHeight: large ? "none" : "auto",
      }}>
        {content}
      </p>
    </div>
  );
}
