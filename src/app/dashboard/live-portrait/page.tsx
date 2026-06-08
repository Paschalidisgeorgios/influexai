"use client";

import { useState, useRef, useEffect, useCallback, type CSSProperties } from "react";

export default function LivePortraitPage() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [drivingVideo, setDrivingVideo] = useState<string | null>(null);
  const [drivingVideoFile, setDrivingVideoFile] = useState<File | null>(null);
  const [videoMode, setVideoMode] = useState<"upload" | "webcam">("upload");
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const drivingVideoUrlRef = useRef<string | null>(null);

  const setDrivingVideoPreview = useCallback((url: string | null) => {
    if (drivingVideoUrlRef.current) {
      URL.revokeObjectURL(drivingVideoUrlRef.current);
      drivingVideoUrlRef.current = null;
    }
    if (url) drivingVideoUrlRef.current = url;
    setDrivingVideo(url);
  }, []);

  const stopWebcam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (webcamRef.current) {
      webcamRef.current.srcObject = null;
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        await webcamRef.current.play();
      }
    } catch {
      setError("Kamera-Zugriff verweigert. Bitte Kamera erlauben.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) return;

    setCountdown(3);
    await new Promise<void>((resolve) => {
      let c = 3;
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(interval);
          setCountdown(null);
          resolve();
        }
      }, 1000);
    });

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : "video/webm";
    const mr = new MediaRecorder(streamRef.current, { mimeType });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File([blob], "webcam.webm", { type: mimeType });
      setDrivingVideoFile(file);
      setDrivingVideoPreview(URL.createObjectURL(blob));
      setRecording(false);
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);

    setTimeout(() => {
      if (mr.state === "recording") mr.stop();
    }, 10000);
  }, [setDrivingVideoPreview]);

  useEffect(() => {
    return () => {
      stopWebcam();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (drivingVideoUrlRef.current) {
        URL.revokeObjectURL(drivingVideoUrlRef.current);
      }
    };
  }, [stopWebcam]);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!sourceImageFile || !drivingVideoFile) {
      setError("Bitte Foto und Driving-Video hochladen.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageBase64 = await toBase64(sourceImageFile);
      const videoBase64 = await toBase64(drivingVideoFile);

      const res = await fetch("/api/live-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          videoBase64,
          consentAccepted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Generieren.");
        return;
      }

      setResult(data.videoUrl);
      setCreditsLeft(data.creditsLeft);
    } catch {
      setError("Unbekannter Fehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const clearDrivingVideo = () => {
    setDrivingVideoFile(null);
    setDrivingVideoPreview(null);
  };

  const canSubmit =
    !loading && !!sourceImageFile && !!drivingVideoFile && consentAccepted;

  const mediaBoxHeight = "h-[160px] sm:h-[200px]";

  const toggleBtnStyle = (active: boolean): CSSProperties => ({
    padding: "4px 12px",
    borderRadius: 4,
    border: active ? "1px solid #B4FF00" : "1px solid rgba(255,255,255,0.15)",
    background: active ? "#B4FF00" : "transparent",
    color: active ? "#060608" : "rgba(255,255,255,0.5)",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <div
      style={{
        padding: "32px 24px",
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <style>{`
        @keyframes live-portrait-rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 10,
            color: "#B4FF00",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
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
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          LIVE PORTRAIT
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
          }}
        >
          Bringe dein Foto zum Leben — übertrage Mimik, Lippensync und Bewegung
          von einem Video auf dein Bild.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Foto Upload */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(180,255,0,0.6)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            SCHRITT 1 · DEIN FOTO
          </div>
          <div
            onClick={() => imageRef.current?.click()}
            className={mediaBoxHeight}
            style={{
              border: sourceImage
                ? "1px solid rgba(180,255,0,0.4)"
                : "1px dashed rgba(255,255,255,0.2)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {sourceImage ? (
              <img
                src={sourceImage}
                alt="Foto"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>
                  ◻
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.5)",
                    textAlign: "center",
                    padding: "0 16px",
                  }}
                >
                  Dein Foto hochladen
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.25)",
                    marginTop: 6,
                  }}
                >
                  JPG, PNG, WebP · Gesicht frontal
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
              if (!file) return;
              setSourceImageFile(file);
              const reader = new FileReader();
              reader.onload = (ev) =>
                setSourceImage(ev.target?.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </div>

        {/* Driving Video */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(180,255,0,0.6)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            SCHRITT 2 · BEWEGUNGS-VIDEO
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => {
                setVideoMode("upload");
                stopWebcam();
              }}
              style={toggleBtnStyle(videoMode === "upload")}
            >
              Video hochladen
            </button>
            <button
              type="button"
              onClick={() => {
                setVideoMode("webcam");
                void startWebcam();
              }}
              style={toggleBtnStyle(videoMode === "webcam")}
            >
              Webcam aufnehmen
            </button>
          </div>

          {videoMode === "upload" ? (
            <>
              <div
                onClick={() => videoRef.current?.click()}
                className={mediaBoxHeight}
                style={{
                  border: drivingVideo
                    ? "1px solid rgba(180,255,0,0.4)"
                    : "1px dashed rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {drivingVideo ? (
                  <video
                    src={drivingVideo}
                    controls
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>
                      ▶
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        padding: "0 16px",
                      }}
                    >
                      Video mit deiner Bewegung
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        marginTop: 6,
                      }}
                    >
                      MP4 · Kurzes Video · Gesicht sichtbar
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
                  if (!file) return;
                  if (file.size > 50 * 1024 * 1024) {
                    setError("Video zu groß. Max. 50MB.");
                    return;
                  }
                  setDrivingVideoFile(file);
                  setDrivingVideoPreview(URL.createObjectURL(file));
                  setError(null);
                }}
              />
            </>
          ) : drivingVideo ? (
            <div
              className={mediaBoxHeight}
              style={{
                border: "1px solid rgba(180,255,0,0.3)",
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                background: "#000",
              }}
            >
              <video
                src={drivingVideo}
                controls
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <button
                  type="button"
                  onClick={clearDrivingVideo}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(0,0,0,0.7)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ↺ Neu aufnehmen
                </button>
              </div>
            </div>
          ) : (
            <div
              className={mediaBoxHeight}
              style={{
                border: "1px solid rgba(180,255,0,0.3)",
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                background: "#000",
              }}
            >
              <video
                ref={webcamRef}
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />

              {countdown !== null && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.5)",
                    fontSize: 72,
                    fontWeight: 900,
                    color: "#B4FF00",
                  }}
                >
                  {countdown}
                </div>
              )}

              {recording && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(0,0,0,0.7)",
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#ff4444",
                      animation: "live-portrait-rec-pulse 1s infinite",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#fff" }}>REC</span>
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {!recording ? (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 20,
                      border: "2px solid #B4FF00",
                      background: "rgba(180,255,0,0.15)",
                      color: "#B4FF00",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ● Aufnahme starten (max. 10 Sek.)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 20,
                      border: "2px solid #ff4444",
                      background: "rgba(255,68,68,0.15)",
                      color: "#ff4444",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ■ Aufnahme stoppen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hinweis */}
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
        💡 Dein Foto wird zum Leben erweckt — Mimik, Lippenbewegung und
        Kopfbewegung aus dem Video werden auf dein Bild übertragen. Kein
        Deepfake — nur dein eigenes Material verwenden.
      </div>

      {/* Fehler */}
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
          }}
        >
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: 16,
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          style={{
            marginTop: 2,
            accentColor: "#B4FF00",
            width: 16,
            height: 16,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.6,
          }}
        >
          Ich habe die Rechte und Einwilligung für das hochgeladene Foto und
          Video. Ich verwende keine Inhalte anderer Personen ohne deren
          Zustimmung. Ich verstehe, dass daraus ein KI-animiertes Video entstehen
          kann.
        </span>
      </label>

      {/* Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="disabled:opacity-100"
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 6,
          border: "none",
          background: canSubmit ? "#B4FF00" : "rgba(180,255,0,0.3)",
          color: "#060608",
          opacity: 1,
          fontSize: 14,
          fontWeight: 800,
          cursor: canSubmit ? "pointer" : "not-allowed",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {loading
          ? "⏳ Live Portrait wird generiert..."
          : "LIVE PORTRAIT ERSTELLEN — 5 CREDITS"}
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
          <div
            style={{
              color: "#B4FF00",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            KI überträgt Mimik und Bewegung...
          </div>
          Dauert ca. 30–90 Sekunden. Bitte Seite nicht schließen.
        </div>
      )}

      {/* Ergebnis */}
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
                textTransform: "uppercase",
              }}
            >
              ✓ LIVE PORTRAIT BEREIT
            </span>
            {creditsLeft !== null && (
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {creditsLeft} Credits übrig
              </span>
            )}
          </div>
          <video src={result} controls style={{ width: "100%", display: "block" }} />
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <a
              href={result}
              download="live-portrait.mp4"
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
