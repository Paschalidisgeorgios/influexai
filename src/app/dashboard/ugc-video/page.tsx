"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Video } from "lucide-react";
import { getElevenLabsVoices } from "@/app/actions/get-elevenlabs-voices";
import type { ElevenLabsVoice } from "@/lib/elevenlabs-voice-types";
import { getDefaultVoiceIdForLocale } from "@/lib/elevenlabs-tts";
import { handleApiInsufficientCredits, handleInsufficientCredits } from "@/lib/client-credits-ui";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { getSafeSearchParam } from "@/lib/safe-url-param";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { GuardModal } from "@/components/dashboard/GuardModal";
import { useUserCredits } from "@/hooks/use-user-credits";
import { createClient } from "@/lib/supabase/client";

const CREDIT_COST = 5;
const MAX_SCRIPT = 500;
const CUSTOM_AVATAR_ID = "custom";
const CUSTOM_BASE_AVATAR_ID = "sonya_01";

type UgcAvatar = {
  avatar_id: string;
  name: string;
  thumbnail?: string;
  gender?: string;
  voice_id?: string;
};

type AkoolVoice = {
  voice_id: string;
  name: string;
  gender?: string;
  language?: string;
  preview?: string;
};

type FlowStep = "input" | "generating" | "result";
type VoiceSource = "akool" | "elevenlabs";

const LANGUAGES = [
  "Deutsch",
  "Englisch",
  "Französisch",
  "Spanisch",
  "Italienisch",
  "Portugiesisch",
  "Türkisch",
  "Arabisch",
];

const POLLING_TIPS = [
  "Avatar wird vorbereitet…",
  "Stimme wird synchronisiert…",
  "UGC-Video wird gerendert…",
  "Fast fertig…",
];

function fieldStyle() {
  return {
    width: "100%",
    padding: "14px 16px",
    minHeight: 48,
    borderRadius: 10,
    background: "#18181d",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "#ffffff",
    fontSize: "16px",
    outline: "none",
    fontFamily: "var(--font-dm), sans-serif",
  } as const;
}

export default function UgcVideoPage() {
  const t = useTranslations("flows.ugcVideo");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { credits, reload: reloadCredits } = useUserCredits();

  const [step, setStep] = useState<FlowStep>("input");
  const [script, setScript] = useState("");
  const [language, setLanguage] = useState("Deutsch");
  const [voiceSource, setVoiceSource] = useState<VoiceSource>("akool");
  const [avatars, setAvatars] = useState<UgcAvatar[]>([]);
  const [akoolVoices, setAkoolVoices] = useState<AkoolVoice[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [customPhotoFile, setCustomPhotoFile] = useState<File | null>(null);
  const [consentGuardOpen, setConsentGuardOpen] = useState(false);
  const [selectedAkoolVoiceId, setSelectedAkoolVoiceId] = useState("");
  const [elevenVoiceId, setElevenVoiceId] = useState(() =>
    getDefaultVoiceIdForLocale(locale)
  );
  const [elevenVoices, setElevenVoices] = useState<ElevenLabsVoice[]>([]);
  const [elevenVoicesLoading, setElevenVoicesLoading] = useState(true);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [hookVariants, setHookVariants] = useState<string[]>([]);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const produkt = getSafeSearchParam(searchParams, "produkt");
    if (produkt) setScript(produkt);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ugc-video/avatars").then((r) => r.json()),
      fetch("/api/ugc-video/voices").then((r) => r.json()),
    ])
      .then(([avatarRes, voiceRes]) => {
        if (avatarRes.error) {
          setError(sanitizeUserMessage(avatarRes.error));
        } else if (avatarRes.avatars?.length) {
          setAvatars(avatarRes.avatars);
          setSelectedAvatarId(avatarRes.avatars[0].avatar_id);
          if (avatarRes.avatars[0].voice_id) {
            setSelectedAkoolVoiceId(avatarRes.avatars[0].voice_id);
          }
        }
        if (voiceRes.voices?.length) {
          setAkoolVoices(voiceRes.voices);
          if (!selectedAkoolVoiceId && voiceRes.voices[0]?.voice_id) {
            setSelectedAkoolVoiceId(voiceRes.voices[0].voice_id);
          }
        }
      })
      .catch(() => setError(t("error_load")))
      .finally(() => setAvatarsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getElevenLabsVoices()
      .then((result) => {
        if (result.voices.length > 0) {
          setElevenVoices(result.voices);
          const current = result.voices.find((v) => v.id === elevenVoiceId);
          if (!current) {
            setElevenVoiceId(result.voices[0].id);
          }
        }
      })
      .finally(() => setElevenVoicesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (step !== "generating") return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % POLLING_TIPS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [step]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const pollJob = useCallback(
    (jobId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/ugc-video?jobId=${encodeURIComponent(jobId)}`
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? t("error_generic"));

          setProgress(data.progress ?? 30);
          if (data.status === "completed" && data.videoUrl) {
            stopPolling();
            setVideoUrl(data.videoUrl);
            setStep("result");
            setSubmitting(false);
            reloadCredits();
            window.dispatchEvent(new CustomEvent("credits-updated"));
          } else if (data.status === "failed") {
            stopPolling();
            setError(t("error_failed"));
            setStep("input");
            setSubmitting(false);
          }
        } catch (err: unknown) {
          stopPolling();
          setError(
            sanitizeUserMessage(
              err instanceof Error ? err.message : t("error_generic")
            )
          );
          setStep("input");
          setSubmitting(false);
        }
      }, 4000);
    },
    [stopPolling, reloadCredits, t]
  );

  const generateHooks = async () => {
    setHooksLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ugc-video/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: script || t("hook_default_topic"),
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("error_hooks"));
      setHookVariants(data.hooks ?? []);
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_hooks")
        )
      );
    } finally {
      setHooksLoading(false);
    }
  };

  const applyHook = (hook: string) => {
    const next = hook.slice(0, MAX_SCRIPT);
    setScript(next);
    setHookVariants([]);
  };

  const onAvatarSelect = (avatar: UgcAvatar) => {
    setSelectedAvatarId(avatar.avatar_id);
    if (avatar.voice_id && voiceSource === "akool") {
      setSelectedAkoolVoiceId(avatar.voice_id);
    }
  };

  async function playVoicePreview(voiceId: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingVoice === voiceId) {
      setPlayingVoice(null);
      return;
    }

    try {
      setPlayingVoice(voiceId);
      const res = await fetch("/api/elevenlabs/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          text: "Hallo, ich bin dein KI-Creator. Lass uns loslegen!",
        }),
      });

      if (!res.ok) throw new Error("Vorschau nicht verfügbar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(url);
      };
    } catch {
      setPlayingVoice(null);
    }
  }

  async function uploadCustomPhoto(file: File): Promise<string> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Nicht eingeloggt");
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/ugc-photos/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("ugc-assets")
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("ugc-assets").getPublicUrl(path);
    return data.publicUrl;
  }

  const runCreateVideo = async () => {
    if (selectedAvatarId === CUSTOM_AVATAR_ID && !customPhotoFile) {
      setError("Bitte lade zuerst dein Foto hoch.");
      return;
    }
    if (!selectedAvatarId) {
      setError(t("error_no_avatar"));
      return;
    }
    if (!script.trim()) {
      setError(t("error_no_script"));
      return;
    }
    if (credits !== null && credits < CREDIT_COST) {
      handleInsufficientCredits(credits, CREDIT_COST);
      return;
    }

    setSubmitting(true);
    setError(null);
    setVideoUrl(null);
    setProgress(10);
    setStep("generating");

    try {
      let photoUrl: string | undefined;

      if (selectedAvatarId === CUSTOM_AVATAR_ID && customPhotoFile) {
        try {
          photoUrl = await uploadCustomPhoto(customPhotoFile);
        } catch {
          setError("Foto-Upload fehlgeschlagen");
          setStep("input");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/ugc-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId:
            selectedAvatarId === CUSTOM_AVATAR_ID
              ? CUSTOM_BASE_AVATAR_ID
              : selectedAvatarId,
          customPhotoUrl: photoUrl,
          script: script.trim(),
          voiceSource,
          voiceId:
            voiceSource === "elevenlabs"
              ? elevenVoiceId
              : selectedAkoolVoiceId,
          language,
          aspectRatio: "9:16",
          ...(photoUrl ? { consentAccepted: true } : {}),
        }),
      });
      const data = await res.json();
      if (
        handleApiInsufficientCredits(
          res.status,
          data as { error?: string; credits?: number },
          CREDIT_COST
        )
      ) {
        setStep("input");
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? t("error_generic"));

      pollJob(data.jobId);
    } catch (err: unknown) {
      setStep("input");
      setSubmitting(false);
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : t("error_generic")
        )
      );
    }
  };

  const createVideo = () => {
    if (selectedAvatarId === CUSTOM_AVATAR_ID) {
      if (!customPhotoFile) {
        setError("Bitte lade zuerst dein Foto hoch.");
        fileRef.current?.click();
        return;
      }
      setConsentGuardOpen(true);
      return;
    }
    void runCreateVideo();
  };

  const reset = () => {
    stopPolling();
    setStep("input");
    setVideoUrl(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 md:py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#B4FF00]/10 flex items-center justify-center">
            <Video size={20} className="text-[#B4FF00]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {t("title")}
          </h1>
        </div>
        <p className="text-white/80 text-sm md:text-base max-w-2xl">
          {t("description")}
        </p>
      </div>

      {error && (
        <div
          className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {step === "generating" && (
        <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-8 text-center mb-8">
          <div className="w-full max-w-md mx-auto h-2 rounded-full bg-white/10 overflow-hidden mb-4">
            <div
              className="h-full bg-[#B4FF00] transition-all duration-500"
              style={{ width: `${Math.max(progress, 12)}%` }}
            />
          </div>
          <p className="text-[#B4FF00] font-semibold mb-1">{t("generating")}</p>
          <p className="text-white/65 text-sm">{POLLING_TIPS[tipIndex]}</p>
        </div>
      )}

      {step === "result" && videoUrl && (
        <div className="rounded-2xl border border-[#B4FF00]/25 bg-[#0f0f12] p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">{t("result_title")}</h2>
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full max-w-[360px] mx-auto rounded-xl border border-white/10"
          />
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            <a
              href={videoUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="btn-acid"
            >
              {t("download")}
            </a>
            <button type="button" onClick={reset} className="btn-ghost">
              {t("new_video")}
            </button>
          </div>
          <AiOutputDisclaimer className="mt-4" />
        </div>
      )}

      {(step === "input" || step === "generating") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                {t("script_label")}
              </label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value.slice(0, MAX_SCRIPT))}
                rows={6}
                placeholder={t("script_placeholder")}
                style={{ ...fieldStyle(), resize: "vertical", minHeight: 140 }}
                disabled={submitting}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/65">
                  {script.length}/{MAX_SCRIPT}
                </span>
                <button
                  type="button"
                  onClick={generateHooks}
                  disabled={hooksLoading || submitting}
                  className="text-xs font-bold text-[#B4FF00] hover:underline disabled:opacity-50"
                >
                  {hooksLoading ? t("hooks_loading") : t("hooks_button")}
                </button>
              </div>
            </div>

            {hookVariants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/65">
                  {t("hooks_title")}
                </p>
                {hookVariants.map((hook) => (
                  <button
                    key={hook}
                    type="button"
                    onClick={() => applyHook(hook)}
                    className="w-full text-left rounded-xl border border-[#B4FF00]/20 bg-[#B4FF00]/5 px-4 py-3 text-sm text-white hover:border-[#B4FF00]/50 transition-colors"
                  >
                    {hook}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                {t("language_label")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={fieldStyle()}
                disabled={submitting}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                {t("voice_label")}
              </label>
              <div className="flex gap-2 mb-3">
                {(["akool", "elevenlabs"] as VoiceSource[]).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setVoiceSource(src)}
                    className="px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
                    style={{
                      background: voiceSource === src ? "#B4FF00" : "transparent",
                      borderColor:
                        voiceSource === src ? "#B4FF00" : "rgba(255,255,255,0.13)",
                      color: voiceSource === src ? "#060608" : "rgba(255,255,255,0.85)",
                    }}
                  >
                    {src === "akool" ? t("voice_akool") : t("voice_elevenlabs")}
                  </button>
                ))}
              </div>

              {voiceSource === "akool" ? (
                <select
                  value={selectedAkoolVoiceId}
                  onChange={(e) => setSelectedAkoolVoiceId(e.target.value)}
                  style={fieldStyle()}
                  disabled={submitting || akoolVoices.length === 0}
                >
                  {akoolVoices.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.name}
                      {v.language ? ` · ${v.language}` : ""}
                    </option>
                  ))}
                </select>
              ) : elevenVoicesLoading ? (
                <p className="text-sm text-white/65 py-2">Stimmen werden geladen…</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {elevenVoices.map((voice) => {
                    const selected = elevenVoiceId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setElevenVoiceId(voice.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setElevenVoiceId(voice.id);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          selected
                            ? "bg-[#B4FF00]/10 border border-[#B4FF00]"
                            : "bg-white/5 border border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              selected ? "text-[#B4FF00]" : "text-white"
                            }`}
                          >
                            {voice.name}
                          </p>
                          <p className="text-white/65 text-xs truncate">
                            {voice.accent ?? voice.category}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void playVoicePreview(voice.id);
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: "1px solid rgba(180,255,0,0.4)",
                            background:
                              playingVoice === voice.id ? "#B4FF00" : "transparent",
                            color:
                              playingVoice === voice.id ? "#060608" : "#B4FF00",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                          aria-label="Vorschau"
                        >
                          {playingVoice === voice.id ? "■" : "▶"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={createVideo}
              disabled={submitting || avatarsLoading}
              className="btn-acid w-full justify-center disabled:opacity-50"
            >
              {submitting
                ? t("generating")
                : t("create_button", { cost: CREDIT_COST })}
            </button>
            {credits !== null && (
              <p className="text-center text-xs text-white/65">
                {t("credits_left", { count: credits })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              {t("avatar_label")}
            </label>
            {avatarsLoading ? (
              <div>
                <p className="text-white/65 text-sm mb-3">{t("avatars_loading")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : avatars.length === 0 ? (
              <p className="text-white/65 text-sm">{t("no_avatars")}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCustomPhotoFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setCustomPhoto(ev.target?.result as string);
                      setSelectedAvatarId(CUSTOM_AVATAR_ID);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (selectedAvatarId !== CUSTOM_AVATAR_ID || !customPhoto) {
                      fileRef.current?.click();
                    } else {
                      setSelectedAvatarId(CUSTOM_AVATAR_ID);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (selectedAvatarId !== CUSTOM_AVATAR_ID || !customPhoto) {
                        fileRef.current?.click();
                      } else {
                        setSelectedAvatarId(CUSTOM_AVATAR_ID);
                      }
                    }
                  }}
                  style={{
                    border:
                      selectedAvatarId === CUSTOM_AVATAR_ID
                        ? "2px solid #B4FF00"
                        : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 180,
                    background: "rgba(180,255,0,0.04)",
                  }}
                >
                  {customPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={customPhoto}
                      alt="Mein Foto"
                      style={{
                        width: "100%",
                        height: 160,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 28,
                          color: "#B4FF00",
                        }}
                      >
                        +
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.6)",
                          textAlign: "center",
                        }}
                      >
                        Mein Foto hochladen
                      </div>
                    </>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color:
                        selectedAvatarId === CUSTOM_AVATAR_ID
                          ? "#B4FF00"
                          : "rgba(255,255,255,0.4)",
                    }}
                  >
                    Eigenes Gesicht
                  </div>
                </div>
                {avatars.map((avatar) => {
                  const selected = selectedAvatarId === avatar.avatar_id;
                  return (
                    <button
                      key={avatar.avatar_id}
                      type="button"
                      onClick={() => onAvatarSelect(avatar)}
                      disabled={submitting}
                      className="text-left rounded-xl overflow-hidden border transition-all"
                      style={{
                        borderColor: selected
                          ? "#B4FF00"
                          : "rgba(255,255,255,0.08)",
                        background: selected
                          ? "rgba(180,255,0,0.06)"
                          : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="relative aspect-[3/4] bg-[#18181d]">
                        {avatar.thumbnail ? (
                          <Image
                            src={avatar.thumbnail}
                            alt={avatar.name}
                            fill
                            className="object-cover"
                            sizes="160px"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
                            {avatar.name}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-white truncate">
                          {avatar.name}
                        </p>
                        {avatar.gender && (
                          <p className="text-[10px] text-white/65 capitalize">
                            {avatar.gender}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <GuardModal
        isOpen={consentGuardOpen}
        title="Einwilligung erforderlich"
        description="Du verwendest dein eigenes Gesicht für einen KI-Avatar. Stelle sicher, dass du die Rechte am Foto hast, keine fremden Personen ohne Zustimmung verwendest und verstehst, dass ein KI-generiertes Video entstehen kann."
        variant="consent"
        confirmLabel="Ich stimme zu — Video erstellen"
        onConfirm={() => {
          setConsentGuardOpen(false);
          void runCreateVideo();
        }}
        onCancel={() => setConsentGuardOpen(false)}
      />
    </div>
  );
}
