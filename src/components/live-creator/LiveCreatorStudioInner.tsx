"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import AgoraRTC from "agora-rtc-sdk-ng";
import type { AkoolAgoraCredentials } from "@/lib/akool-live-avatar";
import {
  LIVE_AVATAR_CREDITS_PER_MINUTE,
  LIVE_AVATAR_LOW_CREDITS_WARNING,
} from "@/lib/akool-live-avatar";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

type StudioPhase = "setup" | "connecting" | "live" | "ended";

type AvatarOption = {
  avatar_id: string;
  name: string;
  thumbnail?: string;
};

const HEARTBEAT_MS = 60_000;
const PREFERRED_AVATAR_KEY = "influexai_preferred_live_avatar_id";

function parseAgoraCredentials(data: Record<string, unknown>): AkoolAgoraCredentials {
  const cred = (data.credentials ?? data) as Record<string, unknown>;
  return {
    agora_app_id: String(cred.agora_app_id ?? ""),
    agora_channel: String(cred.agora_channel ?? ""),
    agora_token: String(cred.agora_token ?? ""),
    agora_uid: Number(cred.agora_uid ?? 0),
  };
}

export function LiveCreatorStudioInner() {
  const t = useTranslations("liveCreatorStudio");
  const locale = useLocale();

  const [phase, setPhase] = useState<StudioPhase>("setup");
  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [lowCredits, setLowCredits] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const pipContainerRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const loadAvatars = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/live-avatar/session");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_load"));
      const list: AvatarOption[] = data.avatars ?? [];
      setAvatars(list);
      setCredits(data.credits ?? 0);

      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(PREFERRED_AVATAR_KEY)
          : null;
      const preferred =
        (stored && list.some((a) => a.avatar_id === stored)
          ? stored
          : data.preferredAvatarId) ||
        list[0]?.avatar_id ||
        "";

      if (preferred) setSelectedAvatarId(preferred);

      if ((data.credits ?? 0) < LIVE_AVATAR_LOW_CREDITS_WARNING) {
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
    void loadAvatars();
  }, [loadAvatars]);

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const runHeartbeat = async () => {
    const res = await fetch("/api/live-avatar/heartbeat", { method: "POST" });
    const data = await res.json();
    if (typeof data.creditsLeft === "number") {
      setCredits(data.creditsLeft);
      window.dispatchEvent(new Event("credits-updated"));
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
    }, HEARTBEAT_MS);
    void runHeartbeat();
  };

  const cleanupAgora = async () => {
    stopHeartbeat();
    audioTrackRef.current?.stop();
    audioTrackRef.current?.close();
    audioTrackRef.current = null;
    videoTrackRef.current?.stop();
    videoTrackRef.current?.close();
    videoTrackRef.current = null;

    const client = clientRef.current;
    if (client) {
      client.removeAllListeners();
      await client.leave().catch(() => {});
      clientRef.current = null;
    }
  };

  const subscribeAvatar = (client: IAgoraRTCClient) => {
    client.on(
      "user-published",
      async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && avatarContainerRef.current) {
          user.videoTrack?.play(avatarContainerRef.current, { fit: "cover" });
        }
        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      }
    );

    client.on("user-unpublished", async (user, mediaType) => {
      await client.unsubscribe(user, mediaType);
    });
  };

  const joinAgora = async (credentials: AkoolAgoraCredentials) => {
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    clientRef.current = client;
    subscribeAvatar(client);

    await client.join(
      credentials.agora_app_id,
      credentials.agora_channel,
      credentials.agora_token,
      credentials.agora_uid
    );
    await client.setClientRole("host");

    const [audioTrack, videoTrack] = await Promise.all([
      AgoraRTC.createMicrophoneAudioTrack(),
      AgoraRTC.createCameraVideoTrack({
        encoderConfig: { width: 640, height: 480, frameRate: 15 },
      }),
    ]);

    audioTrackRef.current = audioTrack;
    videoTrackRef.current = videoTrack;

    if (pipContainerRef.current && camOn) {
      videoTrack.play(pipContainerRef.current, { fit: "cover", mirror: true });
    }

    await client.publish([audioTrack, videoTrack]);
  };

  const pickAvatar = (id: string) => {
    setSelectedAvatarId(id);
    localStorage.setItem(PREFERRED_AVATAR_KEY, id);
  };

  const startSession = async () => {
    if (!selectedAvatarId) return;
    setError(null);
    setPhase("connecting");
    localStorage.setItem(PREFERRED_AVATAR_KEY, selectedAvatarId);

    try {
      const lang = locale.split("-")[0].toLowerCase();
      const res = await fetch("/api/live-avatar/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId: selectedAvatarId,
          language: ["de", "en", "es", "fr", "pt", "tr", "el", "ar"].includes(lang)
            ? lang
            : "en",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("error_session"));
      }

      const credentials = parseAgoraCredentials(data);
      if (
        !credentials.agora_app_id ||
        !credentials.agora_channel ||
        !credentials.agora_token
      ) {
        throw new Error(t("error_session"));
      }

      const sid = String(data.session_id ?? data.sessionId ?? "");
      sessionIdRef.current = sid;
      if (typeof data.credits === "number") setCredits(data.credits);

      await joinAgora(credentials);
      setPhase("live");
      startHeartbeat();
    } catch (err) {
      await cleanupAgora();
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
    const sid = sessionIdRef.current;
    await cleanupAgora();
    if (sid) {
      await fetch(
        `/api/live-avatar/session?sessionId=${encodeURIComponent(sid)}`,
        { method: "DELETE" }
      ).catch(() => {});
    }
    sessionIdRef.current = null;
    setPhase("setup");
  };

  useEffect(() => {
    return () => {
      void cleanupAgora();
      const sid = sessionIdRef.current;
      if (sid) {
        fetch(
          `/api/live-avatar/session?sessionId=${encodeURIComponent(sid)}`,
          { method: "DELETE" }
        ).catch(() => {});
      }
    };
  }, []);

  const toggleMic = async () => {
    const track = audioTrackRef.current;
    if (!track) return;
    const next = !micOn;
    await track.setEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    const track = videoTrackRef.current;
    if (!track) return;
    const next = !camOn;
    await track.setEnabled(next);
    setCamOn(next);
    if (pipContainerRef.current && next) {
      track.play(pipContainerRef.current, { fit: "cover", mirror: true });
    }
  };

  const canStart =
    selectedAvatarId &&
    (credits === null || credits >= LIVE_AVATAR_CREDITS_PER_MINUTE);

  return (
    <div className="mx-auto w-full max-w-[420px] pb-24">
      {(lowCredits ||
        (credits !== null && credits < LIVE_AVATAR_LOW_CREDITS_WARNING)) && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t("low_credits", { count: credits ?? 0 })}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div
        className="relative mx-auto overflow-hidden rounded-2xl border border-[#B4FF00]/20 bg-[#060608]"
        style={{
          width: "100%",
          maxWidth: 420,
          aspectRatio: "9/16",
          maxHeight: "min(70vh, 740px)",
        }}
      >
        {phase === "live" && (
          <span className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white" />
            {t("live_badge")}
          </span>
        )}

        <div
          ref={avatarContainerRef}
          className="absolute inset-0 z-0 bg-[#060608]"
          style={{ height: "100%" }}
        />

        {phase === "setup" && (
          <div className="absolute inset-0 z-10 flex flex-col overflow-y-auto bg-[#060608]/95 p-4">
            <p className="text-white/60 text-sm mb-3 text-center">
              {t("pick_avatar")}
            </p>
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-y-auto mb-4">
              {avatars.map((a) => {
                const selected = selectedAvatarId === a.avatar_id;
                return (
                  <button
                    key={a.avatar_id}
                    type="button"
                    onClick={() => pickAvatar(a.avatar_id)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                      selected
                        ? "border-[#B4FF00] ring-2 ring-[#B4FF00]/30"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    {a.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.thumbnail}
                        alt={a.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-3xl">
                        🎭
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1.5 text-[0.65rem] font-medium text-white truncate">
                      {a.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {avatars.length === 0 && (
              <p className="text-white/40 text-xs text-center mb-4">
                {t("no_avatars")}
              </p>
            )}
            <button
              type="button"
              disabled={!canStart}
              onClick={() => void startSession()}
              className="w-full shrink-0 rounded-xl bg-[#B4FF00] py-3 text-sm font-semibold text-[#060608] disabled:opacity-40"
            >
              {t("start_session")}
            </button>
            <p className="text-white/35 text-xs text-center mt-2">
              {t("credits_hint", { cost: LIVE_AVATAR_CREDITS_PER_MINUTE })}
            </p>
          </div>
        )}

        {phase === "connecting" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#060608]/80">
            <p className="text-[#B4FF00] text-sm font-medium animate-pulse">
              {t("connecting")}
            </p>
          </div>
        )}

        {phase === "live" && (
          <>
            {camOn ? (
              <div
                ref={pipContainerRef}
                className="absolute bottom-20 right-3 z-20 h-[200px] w-[200px] overflow-hidden rounded-full border-2 border-[#B4FF00]/50 shadow-lg shadow-black/60 bg-black"
              />
            ) : (
              <div className="absolute bottom-20 right-3 z-20 flex h-[200px] w-[200px] items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/40 text-xs text-center px-4">
                {t("cam_off_label")}
              </div>
            )}

            <div className="absolute bottom-0 inset-x-0 z-30 flex items-center justify-center gap-2 bg-gradient-to-t from-[#060608] via-[#060608]/90 to-transparent px-3 py-4">
              <button
                type="button"
                onClick={() => void toggleMic()}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold ${
                  micOn
                    ? "bg-white/10 text-white border border-white/15"
                    : "bg-red-500/20 text-red-300 border border-red-400/30"
                }`}
              >
                {micOn ? t("mic_on") : t("mic_off")}
              </button>
              <button
                type="button"
                onClick={() => void toggleCam()}
                className={`rounded-xl px-3 py-2.5 text-xs font-semibold ${
                  camOn
                    ? "bg-white/10 text-white border border-white/15"
                    : "bg-red-500/20 text-red-300 border border-red-400/30"
                }`}
              >
                {camOn ? t("cam_on") : t("cam_off")}
              </button>
              <button
                type="button"
                onClick={() => void endSession()}
                className="rounded-xl bg-red-600 px-3 py-2.5 text-xs font-semibold text-white"
              >
                {t("end_session")}
              </button>
            </div>
          </>
        )}
      </div>

      {credits !== null && phase === "live" && (
        <p className="text-center text-white/35 text-xs mt-3">
          {t("billing_active", {
            credits,
            cost: LIVE_AVATAR_CREDITS_PER_MINUTE,
          })}
        </p>
      )}
    </div>
  );
}
