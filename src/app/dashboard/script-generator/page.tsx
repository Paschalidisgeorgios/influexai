"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import {
  generateScript,
  regenerateScript,
  saveScript,
  getSavedScript,
  type GeneratedScript,
  type GenerateScriptInput,
  type ScriptSettings,
} from "@/app/actions/generate-script";
import { onGenerationActionResult } from "@/lib/handle-generation-result";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { ScriptSkeleton } from "@/components/skeletons/script-skeleton";

const GENERATE_COST = 2;
const REGENERATE_COST = 1;
import {
  countWords,
  parseScriptBlocks,
  replaceHookInScript,
  scriptToPlainText,
  isBRollLine,
} from "@/lib/script-format";

type Step = "input" | "loading" | "results";

const LOADING_MESSAGES = [
  "Entwickle den perfekten Hook...",
  "Schreibe das Script...",
  "Optimiere für Retention...",
];

const DURATIONS = ["15 Sek", "30 Sek", "60 Sek", "3 Min"];

const TONES = [
  "Energetisch & Motivierend",
  "Informativ & Sachlich",
  "Unterhaltsam & Witzig",
  "Dramatisch & Emotional",
  "Kontrovers & Provokant",
  "Story-basiert & Persönlich",
];

const LANGUAGES = ["Deutsch", "Englisch", "Deutsch + Englisch (bilingual)"];

function blockStyle(tag: "hook" | "main" | "cta" | null) {
  if (tag === "hook") {
    return {
      background: "rgba(180,255,0,0.08)",
      borderLeft: "3px solid #B4FF00",
    };
  }
  if (tag === "cta") {
    return {
      background: "rgba(139,92,246,0.1)",
      borderLeft: "3px solid #8b5cf6",
    };
  }
  return {
    background: "transparent",
    borderLeft: "3px solid transparent",
  };
}

function ScriptDisplay({ script }: { script: string }) {
  const blocks = parseScriptBlocks(script);
  return (
    <div style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "#F0EFE8" }}>
      {blocks.map((block, bi) => (
        <div
          key={bi}
          style={{
            ...blockStyle(block.tag),
            padding: block.tag ? "12px 14px" : "4px 0",
            marginBottom: block.tag ? 12 : 0,
            borderRadius: 8,
          }}
        >
          {block.tag && (
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                color:
                  block.tag === "hook"
                    ? "#B4FF00"
                    : block.tag === "cta"
                      ? "#a78bfa"
                      : "#505055",
                marginBottom: 8,
              }}
            >
              {block.tag === "hook"
                ? "HOOK"
                : block.tag === "main"
                  ? "MAIN CONTENT"
                  : "CTA"}
            </div>
          )}
          {block.lines.map((line, li) => (
            <p
              key={li}
              style={{
                margin: "0 0 6px",
                fontStyle: isBRollLine(line) ? "italic" : "normal",
                color: isBRollLine(line) ? "#505055" : "#F0EFE8",
                whiteSpace: "pre-wrap",
              }}
            >
              {line || "\u00A0"}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

function ScriptGeneratorPageInner() {
  const t = useTranslations("flows.script");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("input");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [tone, setTone] = useState(TONES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [hookVariantsEnabled, setHookVariantsEnabled] = useState(false);
  const [bRollEnabled, setBRollEnabled] = useState(false);
  const [result, setResult] = useState<GeneratedScript | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [selectedHookIdx, setSelectedHookIdx] = useState<number | null>(null);
  const genStarted = useRef(false);
  const { credits } = useUserCredits();
  const { generate } = useOptimisticGeneration();

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#F0EFE8",
    fontSize: "0.95rem",
    outline: "none" as const,
    fontFamily: "var(--font-dm), sans-serif",
  };

  const labelStyle = {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#505055",
    display: "block" as const,
    marginBottom: 6,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  useEffect(() => {
    const t = searchParams.get("topic");
    if (t) setTopic(decodeURIComponent(t));

    const savedId = searchParams.get("saved");
    if (savedId) {
      getSavedScript(savedId).then((row) => {
        if (!row) return;
        setTopic(row.topic);
        setScriptText(row.script);
        const s = row.settings as ScriptSettings;
        if (s?.duration) setDuration(s.duration);
        if (s?.tone) setTone(s.tone);
        if (s?.language) setLanguage(s.language);
        setHookVariantsEnabled(!!s?.hookVariants);
        setBRollEnabled(!!s?.bRoll);
        setResult({
          script: row.script,
          hookVariants: [],
          wordCount: countWords(row.script),
          estimatedSeconds: Math.round(countWords(row.script) / 2.5),
          toneDescription: "",
        });
        setStep("results");
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (step !== "loading") return;
    setLoadingMsg(LOADING_MESSAGES[0]);
    setProgress(8);
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex]);
    }, 1500);
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 9, 92));
    }, 420);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [step]);

  const buildInput = (): GenerateScriptInput => ({
    topic,
    duration,
    tone,
    language,
    hookVariants: hookVariantsEnabled,
    bRoll: bRollEnabled,
  });

  const applyResult = (data: GeneratedScript) => {
    setResult(data);
    setScriptText(data.script);
    setEditing(false);
    setSelectedHookIdx(null);
    setSavedOk(false);
    setStep("results");
  };

  const runGenerate = async () => {
    if (!topic.trim() || genStarted.current || credits === null) return;
    genStarted.current = true;
    setError(null);
    setStep("loading");
    setProgress(5);

    try {
      const res = await generate(
        () => generateScript(buildInput()),
        GENERATE_COST,
        credits
      );
      if (!res.success) {
        onGenerationActionResult(res);
        setError(res.error);
        setStep("input");
        return;
      }
      onGenerationActionResult(res);
      setProgress(100);
      applyResult(res.result);
    } catch {
      setError("Generierung fehlgeschlagen.");
      setStep("input");
    } finally {
      genStarted.current = false;
    }
  };

  const runRegenerate = async () => {
    if (!topic.trim() || genStarted.current || credits === null) return;
    genStarted.current = true;
    setError(null);
    setStep("loading");

    try {
      const res = await generate(
        () => regenerateScript(buildInput()),
        REGENERATE_COST,
        credits
      );
      if (!res.success) {
        onGenerationActionResult(res);
        setError(res.error);
        setStep("results");
        return;
      }
      onGenerationActionResult(res);
      setProgress(100);
      applyResult(res.result);
    } catch {
      setError("Regenerierung fehlgeschlagen.");
      setStep("results");
    } finally {
      genStarted.current = false;
    }
  };

  const selectHook = (idx: number, hook: string) => {
    setSelectedHookIdx(idx);
    const updated = replaceHookInScript(scriptText, hook);
    setScriptText(updated);
    if (result) {
      setResult({ ...result, script: updated, wordCount: countWords(updated) });
    }
  };

  const copyPlain = async () => {
    await navigator.clipboard.writeText(scriptToPlainText(scriptText));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToVideoFlow = () => {
    const params = new URLSearchParams({ script: scriptText });
    router.push(`/dashboard/video-ad?${params.toString()}`);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedOk(false);
    const settings: ScriptSettings = {
      duration,
      tone,
      language,
      hookVariants: hookVariantsEnabled,
      bRoll: bRollEnabled,
    };
    const res = await saveScript(topic, scriptText, settings);
    setSaving(false);
    if (res.success) setSavedOk(true);
    else setError(res.error);
  };

  const wordCount = countWords(scriptText);
  const estSeconds = result?.estimatedSeconds ?? Math.round(wordCount / 2.5);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FileText size={32} color="#B4FF00" strokeWidth={2} />
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  letterSpacing: "0.02em",
                  color: "#F0EFE8",
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                {t("title")}
              </h1>
              <p
                style={{
                  color: "#505055",
                  fontSize: "0.9rem",
                  margin: "6px 0 0",
                }}
              >
                {t("description")}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/script-generator/saved"
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#505055",
              fontSize: "0.82rem",
              textDecoration: "none",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            Gespeicherte Scripts →
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            background: "rgba(255,71,87,0.08)",
            border: "1px solid rgba(255,71,87,0.25)",
            color: "#ff6b7a",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {step === "input" && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "#0f0f12",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 560,
          }}
        >
          <div>
            <label htmlFor="script-topic" style={labelStyle}>
              Thema / Titel
            </label>
            <input
              id="script-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. 5 Fehler beim YouTube Start"
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="script-duration" style={labelStyle}>
              Video-Länge
            </label>
            <select
              id="script-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="script-tone" style={labelStyle}>
              Ton / Stil
            </label>
            <select
              id="script-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="script-language" style={labelStyle}>
              Sprache
            </label>
            <select
              id="script-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontSize: "0.88rem",
              color: "#F0EFE8",
            }}
          >
            <input
              type="checkbox"
              checked={hookVariantsEnabled}
              onChange={(e) => setHookVariantsEnabled(e.target.checked)}
              style={{ accentColor: "#B4FF00", width: 18, height: 18 }}
            />
            Hook-Varianten generieren (3 Alternativen)
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontSize: "0.88rem",
              color: "#F0EFE8",
            }}
          >
            <input
              type="checkbox"
              checked={bRollEnabled}
              onChange={(e) => setBRollEnabled(e.target.checked)}
              style={{ accentColor: "#B4FF00", width: 18, height: 18 }}
            />
            B-Roll Hinweise hinzufügen
          </label>
          <button
            type="button"
            onClick={runGenerate}
            disabled={!topic.trim()}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 11,
              border: "none",
              background: topic.trim() ? "#B4FF00" : "#2a2a2a",
              color: topic.trim() ? "#060608" : "#505055",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              letterSpacing: "0.04em",
              cursor: topic.trim() ? "pointer" : "default",
            }}
          >
            SCRIPT GENERIEREN →
          </button>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: "#505055",
              margin: 0,
            }}
          >
            Kostet 2 Credits
          </p>
        </div>
      )}

      {step === "loading" && (
        <div className="space-y-6 max-w-3xl">
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#F0EFE8",
                marginBottom: 20,
                minHeight: 24,
              }}
            >
              {loadingMsg}
            </p>
            <div
              style={{
                height: 6,
                background: "#222228",
                borderRadius: 99,
                overflow: "hidden",
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#B4FF00",
                  borderRadius: 99,
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>
          <ScriptSkeleton />
        </div>
      )}

      {step === "results" && result && (
        <div>
          {result.toneDescription && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#505055",
                marginBottom: 16,
                fontStyle: "italic",
              }}
            >
              {result.toneDescription}
            </p>
          )}

          <div
            className="flex flex-col lg:flex-row gap-5"
            style={{ alignItems: "flex-start" }}
          >
            <div
              data-testid="generation-result"
              style={{
                flex: 1,
                minWidth: 0,
                padding: 20,
                borderRadius: 16,
                background: "#0f0f12",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {editing ? (
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  rows={22}
                  style={{
                    ...inputStyle,
                    minHeight: 400,
                    resize: "vertical",
                    lineHeight: 1.7,
                    fontFamily: "var(--font-dm), monospace",
                  }}
                />
              ) : (
                <ScriptDisplay script={scriptText} />
              )}
            </div>

            <aside
              style={{
                width: "100%",
                maxWidth: 280,
                flexShrink: 0,
                padding: 18,
                borderRadius: 16,
                background: "#0f0f12",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "#505055" }}>
                <div style={{ marginBottom: 4 }}>
                  <strong style={{ color: "#F0EFE8" }}>{wordCount}</strong>{" "}
                  Wörter
                </div>
                <div>
                  ca.{" "}
                  <strong style={{ color: "#B4FF00" }}>{estSeconds}s</strong>{" "}
                  Sprechzeit
                </div>
              </div>
              <button
                type="button"
                onClick={copyPlain}
                style={{
                  padding: "10px",
                  borderRadius: 9,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: copied
                    ? "rgba(180,255,0,0.12)"
                    : "rgba(255,255,255,0.04)",
                  color: copied ? "#B4FF00" : "#F0EFE8",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                {copied ? tCommon("copied") : t("result_copy")}
              </button>
              <button
                type="button"
                onClick={goToVideoFlow}
                style={{
                  padding: "10px",
                  borderRadius: 9,
                  border: "none",
                  background: "#B4FF00",
                  color: "#060608",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                }}
              >
                In Video-Flow nutzen →
              </button>
            </aside>
          </div>

          {result.hookVariants.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h2
                style={{
                  fontFamily: "var(--font-bebas), sans-serif",
                  fontSize: "1.25rem",
                  color: "#F0EFE8",
                  marginBottom: 12,
                }}
              >
                Alternative Hooks
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                {result.hookVariants.map((hook, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectHook(idx, hook)}
                    style={{
                      textAlign: "left",
                      padding: 14,
                      borderRadius: 12,
                      background:
                        selectedHookIdx === idx
                          ? "rgba(180,255,0,0.1)"
                          : "#0f0f12",
                      border:
                        selectedHookIdx === idx
                          ? "2px solid #B4FF00"
                          : "1px solid rgba(255,255,255,0.07)",
                      cursor: "pointer",
                      color: "#F0EFE8",
                      fontSize: "0.88rem",
                      lineHeight: 1.55,
                      fontFamily: "var(--font-dm), sans-serif",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#B4FF00",
                        fontWeight: 700,
                      }}
                    >
                      Hook {idx + 1}
                    </span>
                    <p style={{ margin: "8px 0 0" }}>{hook}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <button
              type="button"
              onClick={runRegenerate}
              style={{
                padding: "10px 18px",
                borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#F0EFE8",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {t("result_regenerate")} (1 Credit)
            </button>
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              style={{
                padding: "10px 18px",
                borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.1)",
                background: editing ? "rgba(180,255,0,0.1)" : "transparent",
                color: editing ? "#B4FF00" : "#F0EFE8",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {editing ? "Vorschau" : "Script bearbeiten"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 18px",
                borderRadius: 9,
                border: "none",
                background: savedOk ? "rgba(180,255,0,0.2)" : "#B4FF00",
                color: "#060608",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: saving ? "default" : "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              {saving
                ? `${tCommon("save")}…`
                : savedOk
                  ? `✓ ${tCommon("save")}`
                  : t("result_save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setError(null);
              }}
              style={{
                padding: "10px 18px",
                borderRadius: 9,
                border: "none",
                background: "transparent",
                color: "#505055",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              Neues Thema
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScriptGeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10">
          <ScriptSkeleton />
        </div>
      }
    >
      <ScriptGeneratorPageInner />
    </Suspense>
  );
}
