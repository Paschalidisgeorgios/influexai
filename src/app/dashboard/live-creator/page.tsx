"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ELEVENLABS_VOICES } from "@/lib/elevenlabs-voices";
import { ImageGenerationLoading } from "@/components/image-generation-loading";

type Step = "input" | "generating" | "result";

const CREDIT_COST = 10;

const LOADING_MESSAGES = [
  "Stimme wird synthetisiert...",
  "Gesicht wird analysiert...",
  "Talking Avatar wird erstellt...",
  "Lippenbewegung wird synchronisiert...",
  "Fast fertig...",
];

export default function LiveCreatorPage() {
  const [step, setStep] = useState<Step>("input");
  const [photo, setPhoto] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState<string>(ELEVENLABS_VOICES[0].id);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!photo || !script.trim()) return;
    setError(null);
    setStep("generating");
    setVideoUrl(null);

    try {
      const res = await fetch("/api/live-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoDataUrl: photo,
          script: script.trim(),
          voiceId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.videoUrl) {
        throw new Error(data.error || "Generierung fehlgeschlagen");
      }
      setVideoUrl(data.videoUrl);
      if (typeof data.creditsLeft === "number") {
        setCreditsLeft(data.creditsLeft);
      }
      setStep("result");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Generierung fehlgeschlagen"
      );
      setStep("input");
    }
  };

  const reset = () => {
    setStep("input");
    setPhoto(null);
    setScript("");
    setVideoUrl(null);
    setError(null);
    setCreditsLeft(null);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 48px" }}>
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#B4FF00",
            marginBottom: 8,
          }}
        >
          Live Creator
        </p>
        <h1
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "2.5rem",
            color: "#F0EFE8",
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          Talking Avatar Video
        </h1>
        <p style={{ color: "rgba(240,239,232,0.55)", fontSize: "0.95rem" }}>
          Lade ein Gesichtsfoto hoch, schreibe dein Script und generiere ein
          sprechendes Avatar-Video mit Akool — {CREDIT_COST} Credits pro Video.
        </p>
      </div>

      {step !== "input" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              { key: "input", label: "1. Input" },
              { key: "generating", label: "2. Generating" },
              { key: "result", label: "3. Result" },
            ] as const
          ).map((s, i) => {
            const steps: Step[] = ["input", "generating", "result"];
            const currentIdx = steps.indexOf(step);
            const stepIdx = steps.indexOf(s.key);
            const active = stepIdx <= currentIdx;
            return (
              <span
                key={s.key}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: active ? "rgba(180,255,0,0.12)" : "#18181d",
                  color: active ? "#B4FF00" : "rgba(240,239,232,0.35)",
                  border: `1px solid ${active ? "rgba(180,255,0,0.35)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                {s.label}
              </span>
            );
          })}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(255,80,100,0.1)",
            border: "1px solid rgba(255,80,100,0.3)",
            color: "#ff8a9a",
            marginBottom: 20,
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {step === "input" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#B4FF00" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 16,
              padding: photo ? 16 : 48,
              textAlign: "center",
              cursor: "pointer",
              background: "#18181d",
              transition: "border-color 0.2s",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {photo ? (
              <div style={{ position: "relative", width: "100%", maxWidth: 280, margin: "0 auto", aspectRatio: "1" }}>
                <Image
                  src={photo}
                  alt="Gesicht"
                  fill
                  style={{ objectFit: "cover", borderRadius: 12 }}
                  unoptimized
                />
              </div>
            ) : (
              <>
                <p style={{ fontSize: "2rem", marginBottom: 8 }}>📸</p>
                <p style={{ color: "#F0EFE8", fontWeight: 600 }}>
                  Gesichtsfoto hochladen
                </p>
                <p
                  style={{
                    color: "rgba(240,239,232,0.45)",
                    fontSize: "0.85rem",
                    marginTop: 6,
                  }}
                >
                  Drag & Drop oder Klick — JPG/PNG, klares Gesicht
                </p>
              </>
            )}
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#505055",
                marginBottom: 8,
              }}
            >
              Script / Text
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              maxLength={500}
              rows={5}
              placeholder="Was soll dein Avatar sagen?"
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F0EFE8",
                fontSize: "0.95rem",
                resize: "vertical",
                outline: "none",
              }}
            />
            <p
              style={{
                textAlign: "right",
                fontSize: "0.75rem",
                color: "#505055",
                marginTop: 4,
              }}
            >
              {script.length}/500
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#505055",
                marginBottom: 8,
              }}
            >
              Stimme (ElevenLabs)
            </label>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F0EFE8",
                fontSize: "0.9rem",
              }}
            >
              {ELEVENLABS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!photo || !script.trim()}
            style={{
              padding: "14px 24px",
              borderRadius: 12,
              background:
                photo && script.trim() ? "#B4FF00" : "rgba(180,255,0,0.25)",
              color: "#060608",
              fontWeight: 700,
              fontSize: "1rem",
              border: "none",
              cursor: photo && script.trim() ? "pointer" : "not-allowed",
            }}
          >
            Video generieren · {CREDIT_COST} Credits
          </button>
        </div>
      )}

      {step === "generating" && (
        <ImageGenerationLoading
          title="Live Creator generiert dein Video..."
          subtitle={LOADING_MESSAGES.join(" · ")}
        />
      )}

      {step === "result" && videoUrl && (
        <div>
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "#18181d",
              border: "1px solid rgba(180,255,0,0.25)",
              marginBottom: 20,
            }}
          >
            <video
              src={videoUrl}
              controls
              playsInline
              style={{ width: "100%", display: "block" }}
            />
          </div>
          {creditsLeft !== null && (
            <p
              style={{
                color: "rgba(240,239,232,0.5)",
                fontSize: "0.85rem",
                marginBottom: 16,
              }}
            >
              Verbleibende Credits: {creditsLeft}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href={videoUrl}
              download="influexai-live-creator.mp4"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "#B4FF00",
                color: "#060608",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Video herunterladen
            </a>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#F0EFE8",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Neues Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
