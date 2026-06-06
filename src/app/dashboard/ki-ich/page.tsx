"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImageGenerationLoading } from "@/components/image-generation-loading";
import { ProtectedGeneratedImage } from "@/components/generated/ProtectedGeneratedImage";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { FAL_CREDITS } from "@/lib/fal-credits";

type Step = "upload" | "describe" | "loading" | "preview" | "result";

const SCENE_PRESETS = [
  {
    label: "🏖️ Strand Miami",
    value: "at a beautiful beach in Miami, golden hour, professional photo",
  },
  {
    label: "☕ Café Paris",
    value: "sitting in a cozy café in Paris, warm lighting, lifestyle photo",
  },
  {
    label: "🏙️ NYC Skyline",
    value: "in front of New York City skyline at sunset, cinematic",
  },
  {
    label: "🌿 Natur",
    value: "in a beautiful green forest, natural light, portrait photography",
  },
  {
    label: "💼 Business",
    value: "in a modern office, professional business portrait, confident",
  },
  {
    label: "🎬 Studio",
    value:
      "in a professional photo studio, dramatic lighting, fashion photography",
  },
  {
    label: "🗼 Tokyo",
    value:
      "in Tokyo Japan at dusk, soft ambient city lights, street photography, natural skin tones",
  },
  {
    label: "🏔️ Berge",
    value: "on top of a mountain, epic landscape, adventure photography",
  },
];

export default function KiIchPage() {
  const [step, setStep] = useState<Step>("upload");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [scene, setScene] = useState("");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"preview" | "final">(
    "preview"
  );
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
      setStep("describe");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const callKiIch = async (mode: "preview" | "final") => {
    const res = await fetch("/api/ki-ich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: photo,
        scene,
        mode,
        generationId: mode === "final" ? generationId : undefined,
      }),
    });
    const data = await res.json();
    if (
      handleApiInsufficientCredits(
        res.status,
        data as { error?: string; credits?: number },
        FAL_CREDITS.fluxPulid
      )
    ) {
      throw new Error("__CREDITS_HANDLED__");
    }
    if (!res.ok || !data.imageUrl || !data.generationId) {
      throw new Error(data.error || "Fehler beim Generieren");
    }
    return data as {
      imageUrl: string;
      generationId: string;
    };
  };

  const handleGenerate = async () => {
    if (!photo || !scene) return;
    setError(null);
    setLoadingMode("preview");
    setStep("loading");
    setPreviewUrl(null);
    setResultUrl(null);
    setGenerationId(null);

    try {
      const data = await callKiIch("preview");
      setGenerationId(data.generationId);
      setPreviewUrl(data.imageUrl);
      setStep("preview");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "__CREDITS_HANDLED__") {
        setStep("describe");
        return;
      }
      setError(
        sanitizeUserMessage(
          err instanceof Error
            ? err.message
            : "Fehler beim Generieren. Bitte versuche es erneut."
        )
      );
      setStep("describe");
    }
  };

  const handleGenerateHQ = async () => {
    if (!photo || !scene || !generationId) return;
    setError(null);
    setUnlockLoading(true);
    setLoadingMode("final");
    setStep("loading");

    try {
      const data = await callKiIch("final");
      setGenerationId(data.generationId);
      setResultUrl(data.imageUrl);
      setStep("result");
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "__CREDITS_HANDLED__") {
        setStep("preview");
        return;
      }
      setError(
        sanitizeUserMessage(
          err instanceof Error
            ? err.message
            : "Hochauflösende Generierung fehlgeschlagen."
        )
      );
      setStep("preview");
    } finally {
      setUnlockLoading(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setPhoto(null);
    setPhotoFile(null);
    setScene("");
    setPreviewUrl(null);
    setResultUrl(null);
    setGenerationId(null);
    setError(null);
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "0.02em",
            color: "#F0EFE8",
            marginBottom: 6,
          }}
        >
          📸 Mein KI-Ich
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem" }}>
          Foto hochladen → Szene wählen → InfluexAI Vision setzt dich hinein
        </p>
      </div>

      {/* Progress */}
      {step !== "upload" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            { key: "upload", label: "1. Foto" },
            { key: "describe", label: "2. Szene" },
            { key: "result", label: "3. Ergebnis" },
          ].map((s, i) => {
            const steps = ["upload", "describe", "loading", "result"];
            const current = steps.indexOf(step);
            const sIndex = steps.indexOf(s.key);
            const done = current > sIndex;
            const active =
              current === sIndex ||
              (s.key === "describe" &&
                (step === "loading" || step === "preview")) ||
              (s.key === "result" && (step === "result" || step === "preview"));
            return (
              <div
                key={s.key}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    padding: "5px 14px",
                    borderRadius: 99,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    background: done
                      ? "rgba(180,255,0,0.15)"
                      : active
                        ? "rgba(180,255,0,0.08)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${done ? "rgba(180,255,0,0.4)" : active ? "rgba(180,255,0,0.25)" : "rgba(255,255,255,0.07)"}`,
                    color: done || active ? "#B4FF00" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {done ? "✓ " : ""}
                  {s.label}
                </div>
                {i < 2 && <span style={{ color: "#333" }}>→</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#B4FF00" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 20,
            padding: "60px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "rgba(180,255,0,0.04)" : "#0f0f12",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>📷</div>
          <h2
            style={{
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              letterSpacing: "0.02em",
              color: "#F0EFE8",
              marginBottom: 8,
            }}
          >
            Foto hierher ziehen
          </h2>
          <p
            style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", marginBottom: 20 }}
          >
            oder klicken um eine Datei auszuwählen
          </p>
          <div
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: 10,
              background: "#B4FF00",
              color: "#060608",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            Foto auswählen →
          </div>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", marginTop: 16 }}>
            JPG, PNG, WEBP · Max. 10MB · Kostet 2 Credits
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {/* STEP 2: Describe */}
      {step === "describe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Photo preview + change */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {photo && (
              <Image
                src={photo}
                alt="Vorschau"
                width={64}
                height={64}
                unoptimized
                style={{
                  borderRadius: 10,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#F0EFE8",
                  marginBottom: 2,
                }}
              >
                {photoFile?.name ?? "Foto"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>
                Bereit zur Verarbeitung
              </div>
            </div>
            <button
              onClick={reset}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.65)",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontFamily: "var(--font-dm), sans-serif",
              }}
            >
              Ändern
            </button>
          </div>

          {/* Scene presets */}
          <div
            style={{
              padding: 20,
              borderRadius: 14,
              background: "#0f0f12",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.65)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 14,
              }}
            >
              Schnellauswahl
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {SCENE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setScene(p.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 9,
                    background:
                      scene === p.value
                        ? "rgba(180,255,0,0.1)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${scene === p.value ? "rgba(180,255,0,0.35)" : "rgba(255,255,255,0.07)"}`,
                    color:
                      scene === p.value ? "#B4FF00" : "rgba(255,255,255,0.8)",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-dm), sans-serif",
                    transition: "all 0.15s",
                    textAlign: "center",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.65)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}
            >
              Oder eigene Szene beschreiben
            </div>
            <textarea
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              placeholder="z.B. at a rooftop party in Los Angeles, sunset, cinematic lighting..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                background: "#18181d",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#F0EFE8",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "var(--font-dm), sans-serif",
                lineHeight: 1.6,
              }}
              onFocus={(e) =>
                ((e.target as HTMLTextAreaElement).style.borderColor =
                  "rgba(180,255,0,0.4)")
              }
              onBlur={(e) =>
                ((e.target as HTMLTextAreaElement).style.borderColor =
                  "rgba(255,255,255,0.09)")
              }
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!scene.trim()}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: scene.trim() ? "#B4FF00" : "#2a2a2a",
              color: scene.trim() ? "#060608" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              letterSpacing: "0.04em",
              cursor: scene.trim() ? "pointer" : "default",
            }}
          >
            VORSCHAU GENERIEREN → (kostenlos)
          </button>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem", marginTop: 8 }}>
            Schnelle Vorschau, danach optional hochauflösend (2 Credits).
          </p>
          {error && (
            <p style={{ color: "#ff6b7a", fontSize: "0.85rem", marginTop: 8 }}>
              {error}
            </p>
          )}
        </div>
      )}

      {step === "loading" && (
        <ImageGenerationLoading
          title={
            loadingMode === "preview"
              ? "Vorschau wird erstellt..."
              : "Hochauflösende Version..."
          }
          subtitle={
            loadingMode === "preview"
              ? "KI-Vorschau wird erstellt (~15 Sek.)"
              : "Finale KI-Qualität (~25–40 Sek.)"
          }
        />
      )}

      {step === "preview" && previewUrl && generationId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem" }}>
            Vorschau bereit — für beste Qualität ohne Farbartefakte auf der Haut
            jetzt hochauflösend generieren.
          </p>
          <ProtectedGeneratedImage
            src={previewUrl}
            alt="Vorschau"
            locked
            generationId={generationId}
            unlockHint="Hochauflösend freischalten — 2 Credits"
            unlockLabel="Jetzt freischalten"
            onUnlock={handleGenerateHQ}
            unlockLoading={unlockLoading}
          />
          <button
            type="button"
            onClick={() => setStep("describe")}
            style={{
              padding: "10px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.65)",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Szene anpassen
          </button>
          {error && (
            <p style={{ color: "#ff6b7a", fontSize: "0.85rem" }}>{error}</p>
          )}
        </div>
      )}

      {step === "result" && resultUrl && generationId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <button
            onClick={reset}
            style={{
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.65)",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontFamily: "var(--font-dm), sans-serif",
            }}
          >
            ← Neues Bild
          </button>

          <ProtectedGeneratedImage
            src={resultUrl}
            alt="KI-generiertes Bild"
            locked={false}
            generationId={generationId}
            showDownload
            downloadLabel="Herunterladen"
            className="generated-image-wrapper--unlocked"
          />

        </div>
      )}
    </div>
  );
}
