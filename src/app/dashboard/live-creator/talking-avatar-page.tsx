"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LiveCreatorVoicePicker } from "@/components/live-creator-voice-picker";
import type { ElevenLabsVoice } from "@/lib/elevenlabs-voice-types";
import { getDefaultVoiceIdForLocale } from "@/lib/elevenlabs-tts";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";

async function uploadCustomAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/live-creator/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("avatar-assets")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("avatar-assets").getPublicUrl(path);
  return data.publicUrl;
}

type FlowStep = "input" | "generating" | "result";
type VideoStatus = "idle" | "processing" | "completed" | "failed";
type AudioSource = "elevenlabs" | "own";

const CREDIT_COST = 10;

const POLLING_TIPS = [
  "Gesicht wird analysiert…",
  "Lippensynchronisation wird berechnet…",
  "Video wird generiert…",
  "Fast fertig…",
];

const WAVE_HEIGHTS = [12, 20, 16, 24, 14];

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function StepIndicator({
  photoReady,
  audioReady,
  isGenerating,
  isResult,
}: {
  photoReady: boolean;
  audioReady: boolean;
  isGenerating: boolean;
  isResult: boolean;
}) {
  const steps = [
    { n: 1, label: "Foto", done: photoReady },
    { n: 2, label: "Audio", done: audioReady },
    { n: 3, label: "Generieren", done: isResult },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2 max-w-md">
        {steps.map((s, i) => {
          const active =
            isGenerating || isResult
              ? s.n === 3
              : s.done || (s.n === 1 && photoReady) || (s.n === 2 && photoReady && !audioReady);
          const complete = s.done || (s.n < 3 && photoReady && audioReady);
          return (
            <div key={s.n} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="flex items-center w-full gap-1">
                {i > 0 && (
                  <div
                    className={`h-0.5 flex-1 rounded transition-colors duration-300 ${
                      complete || active ? "bg-[#B4FF00]" : "bg-white/10"
                    }`}
                  />
                )}
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    complete
                      ? "bg-[#B4FF00] text-[#060608]"
                      : active
                        ? "border-2 border-[#B4FF00] text-[#B4FF00] bg-[#B4FF00]/10"
                        : "border border-white/20 text-white/65 bg-white/5"
                  }`}
                >
                  {complete ? "✓" : s.n}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded transition-colors duration-300 ${
                      steps[i + 1].done || photoReady
                        ? "bg-[#B4FF00]"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs font-semibold tracking-wide truncate ${
                  active || complete ? "text-[#B4FF00]" : "text-white/65"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TalkingAvatarPage({ embedded = false }: { embedded?: boolean }) {
  const locale = useLocale();
  const [flowStep, setFlowStep] = useState<FlowStep>("input");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [script, setScript] = useState("");
  const [audioSource, setAudioSource] = useState<AudioSource>("own");
  const [voiceId, setVoiceId] = useState<string>(() =>
    getDefaultVoiceIdForLocale(locale)
  );
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const photoReady = !!photo;
  const scriptReady = script.trim().length > 0;
  const audioReady =
    audioSource === "own" ? !!recordedBlob : !!voiceId && scriptReady;
  const isGenerating = flowStep === "generating";
  const canGenerate =
    photoReady && scriptReady && audioReady && consentAccepted && !isGenerating;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearRecording = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordedBlob(null);
  }, [recordedUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch {
      setError(
        "Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (flowStep !== "generating") return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % POLLING_TIPS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [flowStep]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const finalizeJob = async (jobId: string) => {
    const res = await fetch(
      `/api/live-creator?jobId=${encodeURIComponent(jobId)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Abschluss fehlgeschlagen");
    if (data.status === "completed" && data.videoUrl) {
      setVideoStatus("completed");
      setVideoUrl(data.videoUrl);
      setProgress(100);
      if (typeof data.creditsLeft === "number") setCreditsLeft(data.creditsLeft);
      window.dispatchEvent(new Event("credits-updated"));
      setFlowStep("result");
      stopPolling();
      return true;
    }
    if (data.status === "failed") {
      setVideoStatus("failed");
      setError("Video-Generierung fehlgeschlagen");
      setFlowStep("input");
      stopPolling();
      return true;
    }
    setProgress(data.progress ?? progress);
    return false;
  };

  const pollOnce = async (jobId: string) => {
    try {
      const statusRes = await fetch(
        `/api/akool?jobId=${encodeURIComponent(jobId)}`
      );
      const statusData = await statusRes.json();
      if (statusData.progress != null) setProgress(statusData.progress);
      if (statusData.status === "failed") {
        setVideoStatus("failed");
        setError(
          sanitizeUserMessage(
            statusData.error || "Video-Generierung fehlgeschlagen"
          )
        );
        setFlowStep("input");
        stopPolling();
        return;
      }
      if (statusData.status === "completed") {
        await finalizeJob(jobId);
      }
    } catch {
      /* keep polling */
    }
  };

  const startPolling = (jobId: string) => {
    stopPolling();
    setVideoStatus("processing");
    setProgress(8);
    void pollOnce(jobId);
    pollIntervalRef.current = setInterval(() => void pollOnce(jobId), 5000);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setError(null);
    setFlowStep("generating");
    setVideoUrl(null);
    setProgress(0);
    stopPolling();

    try {
      let audioDataUrl: string | undefined;
      if (audioSource === "own" && recordedBlob) {
        audioDataUrl = await blobToDataUrl(recordedBlob);
      }

      let customAvatarUrl: string | undefined;
      if (photoFile) {
        try {
          customAvatarUrl = await uploadCustomAvatar(photoFile);
        } catch {
          setError("Bild-Upload fehlgeschlagen. Erneut versuchen.");
          setFlowStep("input");
          return;
        }
      }

      const res = await fetch("/api/live-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoDataUrl: customAvatarUrl ? undefined : photo,
          customAvatarUrl,
          audioSource,
          script: script.trim(),
          voiceId: audioSource === "elevenlabs" ? voiceId : undefined,
          audioDataUrl,
          consentAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Generierung fehlgeschlagen");
      }
      startPolling(data.jobId);
    } catch (err: unknown) {
      setVideoStatus("failed");
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : "Generierung fehlgeschlagen",
          { allowElevenLabs: audioSource === "elevenlabs" }
        )
      );
      setFlowStep("input");
      stopPolling();
    }
  };

  const resetForm = () => {
    stopPolling();
    setFlowStep("input");
    setPhoto(null);
    setPhotoFile(null);
    setScript("");
    clearRecording();
    setVideoUrl(null);
    setVideoStatus("idle");
    setProgress(0);
    setError(null);
    setCreditsLeft(null);
    setAudioSource("own");
    setConsentAccepted(false);
    setVoiceId(getDefaultVoiceIdForLocale(locale));
  };

  const handleVoiceSelect = (voice: ElevenLabsVoice) => {
    setVoiceId(voice.id);
  };

  return (
    <div className="max-w-xl mx-auto pb-16 px-1">
      {!embedded && (
        <header className="mb-6">
          <p className="text-[#B4FF00] text-[0.7rem] font-bold uppercase tracking-[0.14em] mb-2">
            Avatar Video
          </p>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8] leading-tight mb-2">
            AVATAR VIDEO
          </h1>
          <p className="text-white/80 text-sm">
            Lade ein Foto hoch und lass es sprechen — InfluexAI Talking Avatar ·{" "}
            {CREDIT_COST} Credits
          </p>
        </header>
      )}

      {flowStep === "input" && (
        <StepIndicator
          photoReady={photoReady}
          audioReady={audioReady}
          isGenerating={false}
          isResult={false}
        />
      )}

      {error && (
        <div
          className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/30 text-[#ff8a9a] text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0f0f12]/80 overflow-hidden">
        {/* Generating overlay */}
        {flowStep === "generating" && (
          <div className="absolute inset-0 z-20 bg-[#060608]/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 py-10">
            <div className="space-y-6 py-4 text-center w-full max-w-sm">
              {photo && (
                <div className="relative w-32 h-32 mx-auto">
                  <Image
                    src={photo}
                    alt="Avatar"
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-[#B4FF00] border-t-transparent animate-spin"
                    aria-hidden
                  />
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">
                  Dein Avatar wird erstellt…
                </p>
                <p className="text-white/70 text-sm mt-1">
                  Das dauert 1–3 Minuten
                </p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-[#B4FF00] h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(progress, 8)}%` }}
                />
              </div>
              <p className="text-[#B4FF00] text-sm font-medium">
                {Math.round(progress)}%
              </p>
              <p className="text-white/65 text-xs min-h-[1rem]">
                {POLLING_TIPS[tipIndex]}
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {flowStep === "result" && videoUrl && (
          <div className="p-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-[#B4FF00]/25">
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full rounded-2xl bg-black"
              />
              <div className="absolute top-3 right-3 bg-[#B4FF00] text-[#060608] text-xs font-bold px-3 py-1 rounded-full">
                ✓ Fertig!
              </div>
            </div>
            {creditsLeft !== null && (
              <p className="text-white/70 text-sm text-center">
                Verbleibende Credits: {creditsLeft}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={videoUrl}
                download="influexai-avatar.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#B4FF00] text-[#060608] font-semibold py-3 rounded-xl text-center text-sm hover:bg-[#c8ff33] transition-all"
              >
                ⬇ Herunterladen
              </a>
              <button
                type="button"
                onClick={resetForm}
                className="border border-white/20 text-white py-3 rounded-xl text-sm hover:bg-white/5 transition-all"
              >
                ↺ Neu erstellen
              </button>
            </div>
            <AiOutputDisclaimer />
          </div>
        )}

        {/* Input form */}
        {flowStep === "input" && (
          <div className="p-5 md:p-6 space-y-8">
            {/* STEP 1: Photo */}
            <section>
              <h2 className="text-white/80 text-xs uppercase tracking-wider mb-3 font-bold">
                Schritt 1 · Foto
              </h2>
              <div
                className="relative group cursor-pointer"
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
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                {!photo ? (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-10 md:p-12 text-center transition-all duration-300 group-hover:scale-[1.01] ${
                      dragOver
                        ? "border-[#B4FF00]/60 bg-[#B4FF00]/10"
                        : "border-white/20 hover:border-[#B4FF00]/50 hover:bg-[#B4FF00]/5"
                    }`}
                  >
                    <div className="text-6xl mb-4">📸</div>
                    <p className="text-white font-semibold text-lg mb-1">
                      Gesichtsfoto hochladen
                    </p>
                    <p className="text-white/70 text-sm">
                      JPG oder PNG · Klares Gesicht · Frontalaufnahme empfohlen
                    </p>
                    <div className="mt-4 inline-block bg-[#B4FF00] text-[#060608] font-semibold px-6 py-2 rounded-xl text-sm">
                      Foto auswählen
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden aspect-square max-w-xs mx-auto">
                    <Image
                      src={photo}
                      alt="Avatar"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <p className="text-white font-medium">Foto ändern</p>
                    </div>
                    <div className="absolute top-3 right-3 bg-[#B4FF00] text-[#060608] text-xs font-bold px-2 py-1 rounded-full">
                      ✓ Foto bereit
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* STEP 2: Audio */}
            <section className="space-y-4">
              <h2 className="text-white/80 text-xs uppercase tracking-wider font-bold">
                Schritt 2 · Audio
              </h2>
              <p className="text-white/80 text-sm uppercase tracking-wider">
                Audio-Quelle wählen
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAudioSource("own")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    audioSource === "own"
                      ? "border-[#B4FF00] bg-[#B4FF00]/10"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <div className="text-2xl mb-2">🎤</div>
                  <p
                    className={`font-semibold text-sm ${
                      audioSource === "own" ? "text-[#B4FF00]" : "text-white"
                    }`}
                  >
                    Eigene Stimme
                  </p>
                  <p className="text-white/70 text-xs mt-1">
                    Authentischer & persönlicher
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioSource("elevenlabs")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    audioSource === "elevenlabs"
                      ? "border-[#B4FF00] bg-[#B4FF00]/10"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <div className="text-2xl mb-2">🤖</div>
                  <p
                    className={`font-semibold text-sm ${
                      audioSource === "elevenlabs"
                        ? "text-[#B4FF00]"
                        : "text-white"
                    }`}
                  >
                    KI-Stimme
                  </p>
                  <p className="text-white/70 text-xs mt-1">
                    ElevenLabs · Professionell
                  </p>
                </button>
              </div>

              <div>
                <label className="text-white/80 text-xs uppercase tracking-wider mb-2 block font-bold">
                  Dein Script
                </label>
                <textarea
                  value={script}
                  onChange={(e) =>
                    setScript(e.target.value.slice(0, 500))
                  }
                  placeholder="Was soll dein Avatar sagen? z.B. Hey, willkommen auf meinem Kanal…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-[#B4FF00]/50 transition-all"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-white/20 text-xs">
                    Tipp: 50–200 Wörter für beste Ergebnisse
                  </span>
                  <span className="text-white/65 text-xs">
                    {script.length}/500
                  </span>
                </div>
              </div>

              {audioSource === "own" && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white/80 text-xs uppercase tracking-wider mb-3 font-bold">
                    Stimme aufnehmen
                  </p>
                  {!recordedBlob ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <button
                        type="button"
                        onClick={
                          isRecording ? stopRecording : startRecording
                        }
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 ${
                          isRecording
                            ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/30"
                            : "bg-[#B4FF00] hover:bg-[#c8ff33] shadow-lg shadow-[#B4FF00]/20 text-[#060608]"
                        }`}
                      >
                        {isRecording ? "⏹" : "🎤"}
                      </button>
                      <p className="text-white/70 text-sm">
                        {isRecording
                          ? "● Aufnahme läuft…"
                          : "Zum Aufnehmen klicken"}
                      </p>
                      {isRecording && (
                        <div className="flex gap-1 items-end h-6">
                          {WAVE_HEIGHTS.map((h, i) => (
                            <div
                              key={i}
                              className="w-1 bg-[#B4FF00] rounded-full animate-bounce"
                              style={{
                                height: `${h}px`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recordedUrl && (
                        <audio
                          controls
                          src={recordedUrl}
                          className="w-full h-10"
                        />
                      )}
                      <button
                        type="button"
                        onClick={clearRecording}
                        className="text-white/70 text-xs hover:text-white transition-colors"
                      >
                        ↺ Neu aufnehmen
                      </button>
                    </div>
                  )}
                </div>
              )}

              {audioSource === "elevenlabs" && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white/80 text-xs uppercase tracking-wider mb-3 font-bold">
                    Stimme wählen
                  </p>
                  <LiveCreatorVoicePicker
                    selectedVoiceId={voiceId}
                    onVoiceSelect={handleVoiceSelect}
                  />
                </div>
              )}
            </section>

            {/* STEP 3: Generate */}
            <section className="space-y-4 pt-2 border-t border-white/[0.06]">
              <h2 className="text-white/80 text-xs uppercase tracking-wider font-bold">
                Schritt 3 · Generieren
              </h2>
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#B4FF00]"
                />
                <span className="text-sm text-white/75 leading-relaxed">
                  Ich bestätige, dass ich nur eigenes oder lizenziertes
                  Bildmaterial verwende und der Erstellung eines Talking-Avatar-Videos
                  ausdrücklich zustimme.
                </span>
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  canGenerate
                    ? "bg-[#B4FF00] text-[#060608] hover:bg-[#c8ff33] active:scale-[0.98] shadow-lg shadow-[#B4FF00]/15"
                    : "bg-white/10 text-white/65 cursor-not-allowed"
                }`}
              >
                {isGenerating
                  ? "⏳ Wird generiert…"
                  : `🎬 Avatar-Video erstellen · ${CREDIT_COST} Credits`}
              </button>
              <div className="flex gap-6 justify-center text-xs">
                <span
                  className={photoReady ? "text-[#B4FF00]" : "text-white/20"}
                >
                  {photoReady ? "✓" : "○"} Foto
                </span>
                <span
                  className={scriptReady ? "text-[#B4FF00]" : "text-white/20"}
                >
                  {scriptReady ? "✓" : "○"} Script
                </span>
                <span
                  className={
                    audioSource === "own"
                      ? recordedBlob
                        ? "text-[#B4FF00]"
                        : "text-white/20"
                      : voiceId && scriptReady
                        ? "text-[#B4FF00]"
                        : "text-white/20"
                  }
                >
                  {(audioSource === "own" ? recordedBlob : voiceId)
                    ? "✓"
                    : "○"}{" "}
                  Audio
                </span>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
