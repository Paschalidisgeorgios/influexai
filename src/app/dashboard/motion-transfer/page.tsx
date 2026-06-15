"use client";

import { useRef, useState } from "react";
import {
  handleApiInsufficientCredits,
  handleInsufficientCredits,
} from "@/lib/client-credits-ui";
import { useUserCredits } from "@/hooks/use-user-credits";
import { MOTION_TRANSFER_CREDIT_COST } from "@/lib/motion-transfer-config";

export default function MotionTransferPage() {
  const { credits, reload: reloadCredits } = useUserCredits();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<"image" | "video">("image");
  const [sourceVideo, setSourceVideo] = useState<string | null>(null);
  const [sourceVideoFile, setSourceVideoFile] = useState<File | null>(null);
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [referenceVideoFile, setReferenceVideoFile] = useState<File | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);

  const imageRef = useRef<HTMLInputElement>(null);
  const sourceVideoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    setSourceImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setSourceImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSourceVideoUpload = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      setError("Video zu groß. Maximale Größe: 100MB.");
      return;
    }
    if (!["video/mp4", "video/quicktime"].includes(file.type)) {
      setError("Bitte MP4-Video verwenden.");
      return;
    }
    setSourceVideoFile(file);
    setSourceVideo(URL.createObjectURL(file));
    setError(null);
  };

  const handleVideoUpload = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      setError("Video zu groß. Maximale Größe: 100MB.");
      return;
    }
    if (!["video/mp4", "video/quicktime"].includes(file.type)) {
      setError("Bitte MP4-Video verwenden.");
      return;
    }
    setReferenceVideoFile(file);
    setReferenceVideo(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async () => {
    const hasSource =
      sourceType === "image" ? !!sourceImageFile : !!sourceVideoFile;

    if (!hasSource || !referenceVideoFile) {
      setError("Bitte Quelle und Referenz-Video hochladen.");
      return;
    }

    if (credits !== null && credits < MOTION_TRANSFER_CREDIT_COST) {
      handleInsufficientCredits(credits, MOTION_TRANSFER_CREDIT_COST);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const imageBase64 =
        sourceType === "image"
          ? await toBase64(sourceImageFile!)
          : await toBase64(sourceVideoFile!);
      const videoBase64 = await toBase64(referenceVideoFile);

      const res = await fetch("/api/motion-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImage: imageBase64,
          referenceVideo: videoBase64,
          sourceIsVideo: sourceType === "video",
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        credits?: number;
        videoUrl?: string;
        creditsLeft?: number;
      };

      if (
        handleApiInsufficientCredits(
          res.status,
          data,
          MOTION_TRANSFER_CREDIT_COST
        )
      ) {
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Fehler beim Generieren.");
        return;
      }

      setResult(data.videoUrl ?? null);
      setCreditsLeft(data.creditsLeft ?? null);
      reloadCredits();
      window.dispatchEvent(new CustomEvent("credits-updated"));
    } catch {
      setError("Unbekannter Fehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "32px 24px",
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "var(--font-dm), DM Sans, sans-serif",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 10,
            color: "#B4FF00",
            letterSpacing: "0.14em",
            textTransform: "none",
            marginBottom: 8,
          }}
        >
          Creator Studio
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.04em",
            textTransform: "none",
            marginBottom: 8,
          }}
        >
          MOTION TRANSFER
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
          }}
        >
          Übertrage Bewegung, Mimik und Lip-Sync von einem Video auf dein Foto
          oder KI-Bild.
        </p>
      </div>

      <div className="dashboard-grid-2 mb-4">
        <div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(180,255,0,0.6)",
              letterSpacing: "0.12em",
              textTransform: "none",
              marginBottom: 8,
            }}
          >
            SCHRITT 1 · QUELLE
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setSourceType("image")}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.15)",
                background: sourceType === "image" ? "#B4FF00" : "transparent",
                color:
                  sourceType === "image" ? "#060608" : "rgba(255,255,255,0.5)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Bild
            </button>
            <button
              type="button"
              onClick={() => setSourceType("video")}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.15)",
                background: sourceType === "video" ? "#B4FF00" : "transparent",
                color:
                  sourceType === "video" ? "#060608" : "rgba(255,255,255,0.5)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Eigenes Video
            </button>
          </div>
          {sourceType === "image" ? (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => imageRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    imageRef.current?.click();
                  }
                }}
                style={{
                  border: sourceImage
                    ? "1px solid rgba(180,255,0,0.4)"
                    : "1px dashed rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  height: 260,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.02)",
                  position: "relative",
                }}
              >
                {sourceImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sourceImage}
                    alt="Quell-Bild"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        padding: "0 16px",
                      }}
                    >
                      Foto oder KI-Bild hochladen
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        marginTop: 6,
                      }}
                    >
                      JPG, PNG, WebP
                    </div>
                  </>
                )}
              </div>
              <input
                ref={imageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </>
          ) : (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => sourceVideoRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    sourceVideoRef.current?.click();
                  }
                }}
                style={{
                  border: sourceVideo
                    ? "1px solid rgba(180,255,0,0.4)"
                    : "1px dashed rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  height: 260,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {sourceVideo ? (
                  <video
                    src={sourceVideo}
                    controls
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎥</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        padding: "0 16px",
                      }}
                    >
                      Eigenes Video hochladen
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        marginTop: 6,
                      }}
                    >
                      MP4 · Dein Gesicht frontal sichtbar
                    </div>
                  </>
                )}
              </div>
              <input
                ref={sourceVideoRef}
                type="file"
                accept="video/mp4,video/quicktime"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSourceVideoUpload(file);
                }}
              />
            </>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(180,255,0,0.6)",
              letterSpacing: "0.12em",
              textTransform: "none",
              marginBottom: 8,
            }}
          >
            SCHRITT 2 · REFERENZ-VIDEO
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => videoRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                videoRef.current?.click();
              }
            }}
            style={{
              border: referenceVideo
                ? "1px solid rgba(180,255,0,0.4)"
                : "1px dashed rgba(255,255,255,0.2)",
              borderRadius: 8,
              height: 260,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {referenceVideo ? (
              <video
                src={referenceVideo}
                controls
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.5)",
                    textAlign: "center",
                    padding: "0 16px",
                  }}
                >
                  Video mit Bewegung hochladen
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.25)",
                    marginTop: 6,
                  }}
                >
                  MP4 · Max. 100MB · Max. 60 Sek.
                </div>
              </>
            )}
          </div>
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/quicktime"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleVideoUpload(file);
            }}
          />
        </div>
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderRadius: 6,
          border: "1px solid rgba(180,255,0,0.15)",
          background: "rgba(180,255,0,0.04)",
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        💡 Beste Ergebnisse: Frontales Gesicht im Bild · Klares Gesicht im
        Video · Gute Beleuchtung · Bewegungsreiche Szene (Sprechen, Tanzen)
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            border: "1px solid rgba(255,80,80,0.3)",
            background: "rgba(255,80,80,0.06)",
            color: "rgba(255,120,120,0.9)",
            fontSize: 13,
            marginBottom: 16,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={
          loading ||
          (sourceType === "image" ? !sourceImageFile : !sourceVideoFile) ||
          !referenceVideoFile
        }
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 6,
          border: "none",
          background:
            loading ||
            (sourceType === "image" ? !sourceImageFile : !sourceVideoFile) ||
            !referenceVideoFile
              ? "rgba(180,255,0,0.3)"
              : "#B4FF00",
          color: "#060608",
          fontSize: 14,
          fontWeight: 800,
          cursor:
            loading ||
            (sourceType === "image" ? !sourceImageFile : !sourceVideoFile) ||
            !referenceVideoFile
              ? "default"
              : "pointer",
          letterSpacing: "0.04em",
          textTransform: "none",
          transition: "background 0.2s",
        }}
      >
        {loading
          ? "⏳ Motion Transfer läuft..."
          : `Motion Transfer starten — ${MOTION_TRANSFER_CREDIT_COST} Credits`}
      </button>

      {loading && (
        <div
          style={{
            marginTop: 16,
            padding: "16px",
            borderRadius: 6,
            border: "1px solid rgba(180,255,0,0.2)",
            background: "rgba(180,255,0,0.04)",
            fontSize: 13,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          <div style={{ color: "#B4FF00", fontWeight: 700, marginBottom: 4 }}>
            KI analysiert Bewegungsdaten...
          </div>
          Das kann 1–3 Minuten dauern. Bitte die Seite nicht schließen.
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 24,
            border: "1px solid rgba(180,255,0,0.25)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#B4FF00",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "none",
              }}
            >
              ✓ Motion Transfer bereit
            </span>
            {(creditsLeft ?? credits) !== null && (
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {creditsLeft ?? credits} Credits übrig
              </span>
            )}
          </div>
          <video
            src={result}
            controls
            playsInline
            style={{ width: "100%", display: "block" }}
          />
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              gap: 8,
            }}
          >
            <a
              href={result}
              download="motion-transfer.mp4"
              style={{
                padding: "6px 16px",
                borderRadius: 4,
                border: "none",
                background: "#B4FF00",
                color: "#060608",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Video herunterladen
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
