"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  estimateAvatarCredits,
  getCreditBreakdown,
} from "@/lib/avatar/pricing";
import type {
  AvatarAspectRatio,
  AvatarDuration,
  AvatarRenderOptions,
  AvatarResolution,
} from "@/lib/avatar/types";

type Phase = "upload" | "options" | "consent" | "render";

async function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video konnte nicht gelesen werden."));
    };
    video.src = url;
  });
}

function optionBtnStyle(active: boolean): CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 6,
    border: active ? "1px solid #B4FF00" : "1px solid rgba(255,255,255,0.15)",
    background: active ? "#B4FF00" : "transparent",
    color: active ? "#060608" : "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

function toggleBtnStyle(active: boolean): CSSProperties {
  return {
    padding: "4px 12px",
    borderRadius: 4,
    border: active ? "1px solid #B4FF00" : "1px solid rgba(255,255,255,0.15)",
    background: active ? "#B4FF00" : "transparent",
    color: active ? "#060608" : "rgba(255,255,255,0.5)",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

export default function AvatarStudioPage() {
  const [phase, setPhase] = useState<Phase>("upload");

  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [drivingVideo, setDrivingVideo] = useState<string | null>(null);
  const [drivingVideoFile, setDrivingVideoFile] = useState<File | null>(null);
  const [videoMode, setVideoMode] = useState<"upload" | "webcam">("upload");
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [options, setOptions] = useState<AvatarRenderOptions>({
    durationSeconds: 30,
    resolution: "720p",
    aspectRatio: "9:16",
    subtitles: false,
    branding: false,
    voiceover: false,
  });

  const [consentGiven, setConsentGiven] = useState(false);

  const [jobStatus, setJobStatus] = useState<string>("queued");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const drivingVideoUrlRef = useRef<string | null>(null);

  const mediaBoxHeight = "h-[160px] sm:h-[200px]";

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
    if (webcamRef.current) webcamRef.current.srcObject = null;
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

  async function uploadFile(
    file: File,
    path: string
  ): Promise<{ key: string; url: string }> {
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("avatar-assets")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from("avatar-assets").getPublicUrl(path);
    return { key: path, url: data.publicUrl };
  }

  const handleVideoFile = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setError("Video zu groß. Max. 50MB.");
      return;
    }
    try {
      const duration = await getVideoDurationSeconds(file);
      if (duration > 30) {
        setError("Video zu lang. Maximal 30 Sekunden.");
        return;
      }
    } catch {
      setError("Video konnte nicht geprüft werden.");
      return;
    }
    setDrivingVideoFile(file);
    setDrivingVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleStartRender = async () => {
    if (!sourceImageFile || !drivingVideoFile || !consentGiven) return;

    setError(null);
    setRendering(true);
    setPhase("render");
    setJobStatus("uploading");
    setResultUrl(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt.");

      const ts = Date.now();
      const imageExt = sourceImageFile.name.split(".").pop() ?? "jpg";
      const videoExt = drivingVideoFile.name.split(".").pop() ?? "mp4";

      const [imageUpload, videoUpload] = await Promise.all([
        uploadFile(
          sourceImageFile,
          `${user.id}/avatar-studio/${ts}-source.${imageExt}`
        ),
        uploadFile(
          drivingVideoFile,
          `${user.id}/avatar-studio/${ts}-driving.${videoExt}`
        ),
      ]);

      setJobStatus("queued");

      const createRes = await fetch("/api/avatar/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageKey: imageUpload.key,
          sourceImageUrl: imageUpload.url,
          drivingVideoKey: videoUpload.key,
          drivingVideoUrl: videoUpload.url,
          options,
          consentGiven: true,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error ?? "Job konnte nicht erstellt werden.");
      }

      const newJobId = createData.job.id as string;
      setJobStatus("running");

      const startRes = await fetch("/api/avatar/start-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newJobId }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error ?? "Render fehlgeschlagen.");
      }

      if (startData.videoUrl) {
        setResultUrl(startData.videoUrl as string);
      }
      setJobStatus("completed");
      window.dispatchEvent(new Event("credits-updated"));
    } catch (err) {
      setJobStatus("failed");
      setError(
        err instanceof Error ? err.message : "Unbekannter Fehler. Bitte erneut versuchen."
      );
    } finally {
      setRendering(false);
    }
  };

  const resetAll = () => {
    stopWebcam();
    setPhase("upload");
    setSourceImage(null);
    setSourceImageFile(null);
    setDrivingVideoFile(null);
    setDrivingVideoPreview(null);
    setVideoMode("upload");
    setConsentGiven(false);
    setJobStatus("queued");
    setResultUrl(null);
    setError(null);
    setRendering(false);
  };

  const canContinueUpload = !!sourceImageFile && !!drivingVideoFile;

  const primaryBtn = (enabled: boolean): CSSProperties => ({
    padding: "14px 24px",
    borderRadius: 6,
    border: "none",
    background: enabled ? "#B4FF00" : "rgba(180,255,0,0.3)",
    color: "#060608",
    opacity: 1,
    fontSize: 14,
    fontWeight: 800,
    cursor: enabled ? "pointer" : "not-allowed",
    letterSpacing: "0.04em",
    textTransform: "none",
    fontFamily: "inherit",
  });

  const ghostBtn: CSSProperties = {
    padding: "14px 24px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        padding: "32px 24px",
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <style>{`
        @keyframes avatar-studio-rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>

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
          AVATAR STUDIO
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          Hochwertiger Live-Avatar-Export — Bild + Bewegungsvideo, Optionen wählen,
          rendern.
        </p>
      </div>

      {error && phase !== "render" && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            border: "1px solid rgba(255,80,80,0.3)",
            background: "rgba(255,80,80,0.06)",
            color: "rgba(255,120,120,0.9)",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {phase === "upload" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                Avatar-Bild
              </div>
              <div
                onClick={() => imageRef.current?.click()}
                className={`relative ${mediaBoxHeight}`}
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
                  <Image
                    src={sourceImage}
                    alt="Avatar"
                    fill
                    unoptimized
                    className="object-cover"
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
                Driving Video
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
                        <div
                          style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}
                        >
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
                          MP4 · Max. 50MB · Max. 30 Sek.
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
                      if (file) void handleVideoFile(file);
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
                      onClick={() => {
                        setDrivingVideoFile(null);
                        setDrivingVideoPreview(null);
                      }}
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
                          animation: "avatar-studio-rec-pulse 1s infinite",
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

          <button
            type="button"
            disabled={!canContinueUpload}
            className="disabled:opacity-100 w-full sm:w-auto"
            style={primaryBtn(canContinueUpload)}
            onClick={() => setPhase("options")}
          >
            Weiter
          </button>
        </>
      )}

      {phase === "options" && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8">
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(180,255,0,0.6)",
                  letterSpacing: "0.12em",
                  textTransform: "none",
                  marginBottom: 10,
                }}
              >
                Dauer
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {([15, 30, 60] as AvatarDuration[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    style={optionBtnStyle(options.durationSeconds === d)}
                    onClick={() =>
                      setOptions((o) => ({ ...o, durationSeconds: d }))
                    }
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(180,255,0,0.6)",
                  letterSpacing: "0.12em",
                  textTransform: "none",
                  marginBottom: 10,
                }}
              >
                Auflösung
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["720p", "1080p"] as AvatarResolution[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    style={optionBtnStyle(options.resolution === r)}
                    onClick={() => setOptions((o) => ({ ...o, resolution: r }))}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(180,255,0,0.6)",
                  letterSpacing: "0.12em",
                  textTransform: "none",
                  marginBottom: 10,
                }}
              >
                Format
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["9:16", "1:1", "16:9"] as AvatarAspectRatio[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    style={optionBtnStyle(options.aspectRatio === a)}
                    onClick={() => setOptions((o) => ({ ...o, aspectRatio: a }))}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(180,255,0,0.6)",
                  letterSpacing: "0.12em",
                  textTransform: "none",
                  marginBottom: 10,
                }}
              >
                Extras
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(
                  [
                    {
                      key: "subtitles" as const,
                      label: "Untertitel (+1 Credit)",
                    },
                    {
                      key: "branding" as const,
                      label: "Branding Overlay (+1 Credit)",
                    },
                    {
                      key: "voiceover" as const,
                      label: "KI-Voiceover (+2 Credits)",
                    },
                  ] as const
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={options[key]}
                      onChange={(e) =>
                        setOptions((o) => ({ ...o, [key]: e.target.checked }))
                      }
                      style={{ accentColor: "#B4FF00", width: 16, height: 16 }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(180,255,0,0.2)",
              borderRadius: 8,
              padding: 20,
              background: "rgba(180,255,0,0.04)",
              height: "fit-content",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#B4FF00",
                letterSpacing: "0.1em",
                textTransform: "none",
                marginBottom: 16,
              }}
            >
              Credit Breakdown
            </div>
            {getCreditBreakdown(options).map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.7)",
                  padding: "4px 0",
                }}
              >
                <span>{item.label}</span>
                <span style={{ color: "#B4FF00" }}>{item.credits} Credits</span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 8,
                marginTop: 8,
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#fff" }}>Gesamt</span>
              <span style={{ color: "#B4FF00" }}>
                {estimateAvatarCredits(options)} Credits
              </span>
            </div>
            <p
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.5,
              }}
            >
              Credits werden erst nach erfolgreichem Render abgebucht.
            </p>
          </div>

          <div
            className="md:col-span-2"
            style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <button type="button" style={ghostBtn} onClick={() => setPhase("upload")}>
              Zurück
            </button>
            <button
              type="button"
              style={primaryBtn(true)}
              onClick={() => setPhase("consent")}
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {phase === "consent" && (
        <>
          <div
            style={{
              border: "1px solid rgba(180,255,0,0.25)",
              borderRadius: 8,
              padding: 24,
              background: "rgba(180,255,0,0.04)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Einwilligung erforderlich
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              Ich bestätige, dass ich die Rechte an dem verwendeten Bild und Video
              besitze und die gezeigte Person mit der KI-Nutzung einverstanden ist.
              Ich verwende ausschließlich eigenes oder lizenziertes Material. Die
              Nutzung fremder Personen ohne Zustimmung ist nicht erlaubt.
            </p>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
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
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.5,
                }}
              >
                Ich stimme zu und bestätige die Einwilligung.
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" style={ghostBtn} onClick={() => setPhase("options")}>
              Zurück
            </button>
            <button
              type="button"
              disabled={!consentGiven || rendering}
              className="disabled:opacity-100 flex-1 sm:flex-none"
              style={primaryBtn(consentGiven && !rendering)}
              onClick={() => void handleStartRender()}
            >
              Avatar rendern — {estimateAvatarCredits(options)} Credits
            </button>
          </div>
        </>
      )}

      {phase === "render" && (
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          {jobStatus === "failed" ? (
            <div
              style={{
                border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: 8,
                padding: 24,
                background: "rgba(255,80,80,0.06)",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#ff8a9a",
                  marginBottom: 8,
                }}
              >
                ✗ Render fehlgeschlagen — keine Credits abgebucht.
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
                {error ?? "Ein unbekannter Fehler ist aufgetreten."}
              </p>
              <button type="button" style={primaryBtn(true)} onClick={resetAll}>
                Erneut versuchen
              </button>
            </div>
          ) : jobStatus === "completed" ? (
            <div
              style={{
                border: "1px solid rgba(180,255,0,0.25)",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#B4FF00",
                  letterSpacing: "0.08em",
                  textTransform: "none",
                }}
              >
                ✓ Avatar fertig — {estimateAvatarCredits(options)} Credits abgebucht.
              </div>
              {resultUrl ? (
                <video
                  src={resultUrl}
                  controls
                  style={{ width: "100%", display: "block", background: "#000" }}
                />
              ) : null}
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {resultUrl && (
                  <a
                    href={resultUrl}
                    download="avatar-studio.mp4"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 4,
                      background: "#B4FF00",
                      color: "#060608",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Herunterladen
                  </a>
                )}
                <button type="button" style={ghostBtn} onClick={resetAll}>
                  Nochmal rendern
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                border: "1px solid rgba(180,255,0,0.2)",
                borderRadius: 8,
                padding: 32,
                textAlign: "center",
                background: "rgba(180,255,0,0.04)",
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                ⏳ Avatar wird generiert...
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                Bitte warten (30–90 Sek.). Seite nicht schließen.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
