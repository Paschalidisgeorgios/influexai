"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { fal } from "@fal-ai/client";
import {
  FAL_FLASHHEAD_MODEL,
  LIVE_CREATOR_CREDITS_PER_MINUTE,
  LIVE_CREATOR_FALLBACK_INTERVAL_MS,
  LIVE_CREATOR_FRAME_INTERVAL_MS,
  LIVE_CREATOR_HEARTBEAT_MS,
  LIVE_CREATOR_LOW_CREDITS_WARNING,
  PREFERRED_LIVE_CHARACTER_KEY,
  type LiveCreatorCharacter,
} from "@/lib/live-creator-config";
import {
  captureVideoFrame,
  extractRealtimeFrameUrl,
  loadImageAsDataUrl,
  readFileAsDataUrl,
  type FlashheadRealtimeResult,
} from "@/lib/live-creator-webcam";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

type StudioPhase = "setup" | "connecting" | "live" | "ended";
type StreamMode = "realtime" | "fallback";

type FlashheadSendPayload = {
  source_image: string;
  driving_frame: string;
  image_url: string;
};

export function LiveCreatorStudioInner() {
  const t = useTranslations("liveCreatorStudio");

  const [phase, setPhase] = useState<StudioPhase>("setup");
  const [characters, setCharacters] = useState<LiveCreatorCharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lowCredits, setLowCredits] = useState(false);
  const [streamMode, setStreamMode] = useState<StreamMode>("realtime");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const outputVideoRef = useRef<HTMLVideoElement>(null);
  const outputImageRef = useRef<HTMLImageElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const characterDataUrlRef = useRef<string>("");
  const connectionRef = useRef<ReturnType<typeof fal.realtime.connect> | null>(
    null
  );
  const frameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fallbackLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const fallbackBusyRef = useRef(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const stopFrameLoops = () => {
    if (frameLoopRef.current) {
      clearInterval(frameLoopRef.current);
      frameLoopRef.current = null;
    }
    if (fallbackLoopRef.current) {
      clearInterval(fallbackLoopRef.current);
      fallbackLoopRef.current = null;
    }
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const stopWebcam = () => {
    stopFrameLoops();
    recorderRef.current?.stop();
    recorderRef.current = null;
    recorderChunksRef.current = [];

    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
    webcamStreamRef.current = null;

    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }
  };

  const closeRealtime = () => {
    connectionRef.current?.close();
    connectionRef.current = null;
  };

  const cleanupSession = useCallback(async () => {
    stopHeartbeat();
    stopWebcam();
    closeRealtime();
  }, []);

  const displayFrame = useCallback((url: string, isVideo = false) => {
    setOutputUrl(url);
    if (isVideo && outputVideoRef.current) {
      outputVideoRef.current.src = url;
      void outputVideoRef.current.play().catch(() => {});
      return;
    }
    if (outputImageRef.current) {
      outputImageRef.current.src = url;
    }
  }, []);

  const runHeartbeat = async () => {
    const res = await fetch("/api/live-creator/studio/heartbeat", {
      method: "POST",
    });
    const data = await res.json();
    if (typeof data.creditsLeft === "number") {
      setCredits(data.creditsLeft);
      window.dispatchEvent(new Event("credits-updated"));
    }
    if (typeof data.creditsUsed === "number" && data.creditsUsed > 0) {
      setCreditsUsed((prev) => prev + data.creditsUsed);
    }
    if (data.lowCredits) setLowCredits(true);
    if (data.endSession || !data.success) {
      setError(sanitizeUserMessage(data.error ?? t("no_credits_end")));
      await endSession();
    }
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      void runHeartbeat();
    }, LIVE_CREATOR_HEARTBEAT_MS);
    void runHeartbeat();
  };

  const loadStudio = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/live-creator/studio");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_load"));

      const list: LiveCreatorCharacter[] = data.characters ?? [];
      setCharacters(list);
      setCredits(data.credits ?? 0);

      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(PREFERRED_LIVE_CHARACTER_KEY)
          : null;
      const preferred =
        (stored && list.some((c) => c.id === stored)
          ? stored
          : data.preferredCharacterId) ||
        list[0]?.id ||
        "";

      if (preferred) setSelectedCharacterId(preferred);

      if ((data.credits ?? 0) < LIVE_CREATOR_LOW_CREDITS_WARNING) {
        setLowCredits(true);
      }
    } catch (err) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_load")
        )
      );
    }
  }, [t]);

  useEffect(() => {
    void loadStudio();
  }, [loadStudio]);

  useEffect(() => {
    return () => {
      void cleanupSession();
    };
  }, [cleanupSession]);

  const resolveCharacter = (): LiveCreatorCharacter | undefined => {
    if (uploadPreview && selectedCharacterId === "upload") {
      return {
        id: "upload",
        name: t("upload_character"),
        imageUrl: uploadPreview,
        kind: "upload",
      };
    }
    return characters.find((c) => c.id === selectedCharacterId);
  };

  const pickCharacter = (id: string) => {
    setSelectedCharacterId(id);
    localStorage.setItem(PREFERRED_LIVE_CHARACTER_KEY, id);
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await readFileAsDataUrl(file);
    setUploadPreview(dataUrl);
    setSelectedCharacterId("upload");
    localStorage.setItem(PREFERRED_LIVE_CHARACTER_KEY, "upload");
  };

  const startWebcam = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 640 },
        facingMode: "user",
      },
      audio: false,
    });

    webcamStreamRef.current = stream;
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = stream;
      await webcamVideoRef.current.play();
    }

    if (typeof MediaRecorder !== "undefined") {
      try {
        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
            ? "video/webm;codecs=vp8"
            : "video/webm",
        });
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recorderChunksRef.current.push(event.data);
            if (recorderChunksRef.current.length > 4) {
              recorderChunksRef.current.shift();
            }
          }
        };
        recorder.start(500);
        recorderRef.current = recorder;
      } catch {
        /* fallback uses JPEG frames */
      }
    }
  };

  const getDrivingVideoDataUrl = async (): Promise<string | undefined> => {
    const chunks = recorderChunksRef.current;
    if (!chunks.length) return undefined;
    const blob = new Blob(chunks, { type: "video/webm" });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  };

  const sendRealtimeFrame = () => {
    const video = webcamVideoRef.current;
    const connection = connectionRef.current;
    if (!video || !connection || !characterDataUrlRef.current) return;

    const drivingFrame = captureVideoFrame(video);
    if (!drivingFrame) return;

    connection.send({
      source_image: characterDataUrlRef.current,
      driving_frame: drivingFrame,
      image_url: characterDataUrlRef.current,
    } as FlashheadSendPayload & { request_id?: string });
  };

  const pollFallbackFrame = async () => {
    if (fallbackBusyRef.current) return;
    const video = webcamVideoRef.current;
    if (!video || !characterDataUrlRef.current) return;

    const drivingFrame = captureVideoFrame(video);
    if (!drivingFrame) return;

    fallbackBusyRef.current = true;
    try {
      const drivingVideoDataUrl = await getDrivingVideoDataUrl();
      const res = await fetch("/api/live-creator/portrait-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImage: characterDataUrlRef.current,
          drivingFrame,
          drivingVideoDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_session"));

      if (typeof data.imageUrl === "string") {
        const isVideo = /\.(mp4|webm)(\?|$)/i.test(data.imageUrl);
        displayFrame(data.imageUrl, isVideo);
      }
    } catch (err) {
      console.error("[live-creator fallback]", err);
    } finally {
      fallbackBusyRef.current = false;
    }
  };

  const activateFallback = () => {
    if (streamMode === "fallback") return;
    setStreamMode("fallback");
    closeRealtime();
    stopFrameLoops();
    fallbackLoopRef.current = setInterval(() => {
      void pollFallbackFrame();
    }, LIVE_CREATOR_FALLBACK_INTERVAL_MS);
    void pollFallbackFrame();
  };

  const connectRealtime = () => {
    const connection = fal.realtime.connect(FAL_FLASHHEAD_MODEL, {
      clientOnly: true,
      throttleInterval: LIVE_CREATOR_FRAME_INTERVAL_MS,
      maxBuffering: 2,
      tokenProvider: async (app) => {
        const res = await fetch("/api/fal/realtime-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app }),
        });
        if (!res.ok) {
          throw new Error("Realtime-Token fehlgeschlagen");
        }
        return res.text();
      },
      tokenExpirationSeconds: 100,
      onResult: (result: FlashheadRealtimeResult) => {
        const url = extractRealtimeFrameUrl(result);
        if (!url) return;
        const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
        displayFrame(url, isVideo);
      },
      onError: () => {
        activateFallback();
      },
    });

    connectionRef.current = connection;
    setStreamMode("realtime");

    frameLoopRef.current = setInterval(() => {
      sendRealtimeFrame();
    }, LIVE_CREATOR_FRAME_INTERVAL_MS);
  };

  const startSession = async () => {
    const character = resolveCharacter();
    if (!character) return;

    setError(null);
    setPhase("connecting");
    setCreditsUsed(0);
    setStreamMode("realtime");
    setOutputUrl(null);

    try {
      const startRes = await fetch("/api/live-creator/studio", {
        method: "POST",
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || t("error_session"));
      }
      if (typeof startData.credits === "number") {
        setCredits(startData.credits);
      }

      characterDataUrlRef.current = await loadImageAsDataUrl(character.imageUrl);
      await startWebcam();

      try {
        connectRealtime();
      } catch {
        activateFallback();
      }

      setPhase("live");
      startHeartbeat();
    } catch (err) {
      await cleanupSession();
      setPhase("setup");
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_session")
        )
      );
    }
  };

  const endSession = async () => {
    setPhase("ended");
    await cleanupSession();
    setPhase("setup");
    setStreamMode("realtime");
    setOutputUrl(null);
  };

  const canStart =
    (selectedCharacterId === "upload" ? !!uploadPreview : !!selectedCharacterId) &&
    (credits === null || credits >= LIVE_CREATOR_CREDITS_PER_MINUTE);

  const selectedCharacter = resolveCharacter();

  return (
    <div className="mx-auto w-full max-w-2xl pb-24">
      {(lowCredits ||
        (credits !== null && credits < LIVE_CREATOR_LOW_CREDITS_WARNING)) && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t("low_credits", { count: credits ?? 0 })}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {streamMode === "fallback" && phase === "live" && (
        <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
          {t("fallback_mode")}
        </div>
      )}

      <div
        className="relative mx-auto overflow-hidden rounded-2xl border border-[#B4FF00]/20 bg-[#060608]"
        style={{ height: "min(78vh, 720px)" }}
      >
        {phase === "live" && (
          <span className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white" />
            {t("live_badge")}
          </span>
        )}

        <div
          className="relative w-full bg-[#060608]"
          style={{ height: "65%" }}
        >
          {outputUrl ? (
            /\.(mp4|webm)(\?|$)/i.test(outputUrl) ? (
              <video
                ref={outputVideoRef}
                src={outputUrl}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                playsInline
                loop
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={outputImageRef}
                src={outputUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )
          ) : selectedCharacter ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedCharacter.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/25 text-sm">
              {t("output_placeholder")}
            </div>
          )}

          <video
            ref={webcamVideoRef}
            className={
              phase === "live"
                ? "absolute bottom-3 right-3 z-30 h-[200px] w-[200px] rounded-full border-2 border-[#B4FF00]/50 object-cover shadow-lg shadow-black/60 bg-black scale-x-[-1]"
                : "pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
            }
            muted
            playsInline
          />
        </div>

        <div
          className="relative flex flex-col border-t border-white/10 bg-[#060608]/95"
          style={{ height: "35%" }}
        >
          {phase === "setup" && (
            <div className="flex h-full flex-col overflow-y-auto p-4">
              <p className="text-white/80 text-sm mb-3">{t("pick_character")}</p>
              <div className="grid grid-cols-3 gap-2 flex-1 min-h-0 overflow-y-auto mb-3">
                {characters.map((c) => {
                  const selected = selectedCharacterId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickCharacter(c.id)}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                        selected
                          ? "border-[#B4FF00] ring-2 ring-[#B4FF00]/30"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 px-1.5 py-1 text-[0.6rem] font-medium text-white truncate">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed transition-all ${
                    selectedCharacterId === "upload"
                      ? "border-[#B4FF00] bg-[#B4FF00]/5"
                      : "border-white/15 hover:border-white/30"
                  }`}
                >
                  {uploadPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={uploadPreview}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/75 text-[0.65rem] px-2 text-center">
                      <span className="text-xl">+</span>
                      {t("upload_character")}
                    </div>
                  )}
                </button>
              </div>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              <button
                type="button"
                disabled={!canStart}
                onClick={() => void startSession()}
                className="w-full shrink-0 rounded-xl bg-[#B4FF00] py-3 text-sm font-semibold text-[#060608] disabled:opacity-40"
              >
                {t("start_session")}
              </button>
              <p className="text-white/65 text-xs text-center mt-2">
                {t("credits_hint", { cost: LIVE_CREATOR_CREDITS_PER_MINUTE })}
              </p>
            </div>
          )}

          {phase === "connecting" && (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[#B4FF00] text-sm font-medium animate-pulse">
                {t("connecting")}
              </p>
            </div>
          )}

          {phase === "live" && (
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-white/80">
                <span>{selectedCharacter?.name}</span>
                <span>
                  {t("credits_used", { count: creditsUsed })}
                  {credits !== null ? ` · ${credits} ${t("credits_left")}` : ""}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void endSession()}
                  className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white"
                >
                  {t("stop_session")}
                </button>
              </div>
              <p className="text-center text-white/65 text-[0.65rem]">
                {t("billing_active", {
                  credits: credits ?? 0,
                  cost: LIVE_CREATOR_CREDITS_PER_MINUTE,
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
