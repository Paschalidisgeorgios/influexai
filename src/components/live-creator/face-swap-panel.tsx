"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { ProtectedGeneratedImage } from "@/components/generated/ProtectedGeneratedImage";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";

type Mode = "video" | "image";
type FlowStep = "input" | "generating" | "result";

const VIDEO_MAX_MB = 50;
const CREDITS = { video: 10, image: 5 };

const TIPS = [
  "Gesichter werden analysiert…",
  "Face Swap wird berechnet…",
  "Qualität wird optimiert…",
  "Fast fertig…",
];

type FaceSwapUploadBoxProps = {
  hasFile: boolean;
  preview: string | null;
  isVideo: boolean;
  label: string;
  tip: string;
  drag: boolean;
  onDrag: (v: boolean) => void;
  accept: string;
  onFile: (f: File) => void;
  readyBadge?: string;
};

function FaceSwapUploadBox({
  hasFile,
  preview,
  isVideo,
  label,
  tip,
  drag,
  onDrag,
  accept,
  onFile,
  readyBadge,
}: FaceSwapUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-white/80 text-xs uppercase tracking-wider font-bold mb-2">
        {label}
      </p>
      <div
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
          drag
            ? "border-[#B4FF00]/60 bg-[#B4FF00]/10"
            : "border-white/20 hover:border-[#B4FF00]/50 hover:bg-[#B4FF00]/5"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          onDrag(true);
        }}
        onDragLeave={() => onDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDrag(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        {!hasFile ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">{isVideo ? "🎬" : "🖼"}</div>
            <p className="text-white font-semibold mb-1">
              {isVideo ? "Video hochladen" : "Foto hochladen"}
            </p>
            <p className="text-white/70 text-xs">{tip}</p>
          </div>
        ) : (
          <div className="relative aspect-video max-h-64 overflow-hidden rounded-xl m-2">
            {isVideo && preview ? (
              <video
                src={preview}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            ) : preview ? (
              <Image
                src={preview}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              <p className="text-white font-medium text-sm">Ändern</p>
            </div>
            {readyBadge && (
              <div className="absolute top-2 right-2 bg-[#B4FF00] text-[#060608] text-xs font-bold px-2 py-1 rounded-full">
                {readyBadge}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type FaceSwapPanelProps = {
  mode: Mode;
  sourceLabel: string;
  sourceTip: string;
  targetLabel: string;
  targetTip: string;
  acceptSource: string;
  sourceIsVideo?: boolean;
};

export function FaceSwapPanel({
  mode,
  sourceLabel,
  sourceTip,
  targetLabel,
  targetTip,
  acceptSource,
  sourceIsVideo = false,
}: FaceSwapPanelProps) {
  const [step, setStep] = useState<FlowStep>("input");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState(false);
  const [dragTarget, setDragTarget] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const credits = CREDITS[mode];
  const canGenerate =
    !!sourceFile && !!targetFile && consentAccepted && step === "input";

  const revokeSourcePreview = useCallback(() => {
    if (sourcePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(sourcePreview);
    }
  }, [sourcePreview]);

  useEffect(() => {
    return () => {
      revokeSourcePreview();
      if (pollRef.current) clearInterval(pollRef.current);
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [revokeSourcePreview]);

  useEffect(() => {
    if (step !== "generating") return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(id);
  }, [step]);

  const applySourceFile = (file: File) => {
    if (sourceIsVideo && file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setError(`Video darf maximal ${VIDEO_MAX_MB} MB groß sein`);
      return;
    }
    revokeSourcePreview();
    setSourceFile(file);
    setSourcePreview(URL.createObjectURL(file));
    setError(null);
  };

  const setTarget = (file: File) => {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
      !file.name.match(/\.(jpe?g|png|webp)$/i)
    ) {
      setError(
        "Gesichtsfoto: nur JPEG, PNG oder WebP — mit klar sichtbarem Gesicht."
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Gesichtsfoto darf maximal 10 MB groß sein.");
      return;
    }
    setTargetFile(file);
    const reader = new FileReader();
    reader.onload = () => setTargetPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollJob = async (jobId: string, genId: string) => {
    const res = await fetch(
      `/api/faceswap?jobId=${encodeURIComponent(jobId)}&generationId=${encodeURIComponent(genId)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Status fehlgeschlagen");
    if (data.progress != null) setProgress(data.progress);
    if (data.status === "failed") {
      throw new Error(
        data.error ||
          "Face Swap fehlgeschlagen. Bitte Fotos mit klar sichtbarem Gesicht verwenden."
      );
    }
    if (data.status === "completed" && data.resultUrl) {
      setResultUrl(data.resultUrl);
      setProgress(100);
      setStep("result");
      stopPolling();
      window.dispatchEvent(new Event("credits-updated"));
    }
  };

  const handleGenerate = async () => {
    if (!sourceFile || !targetFile || !consentAccepted) return;
    setError(null);
    setStep("generating");
    setProgress(8);
    setResultUrl(null);
    setGenerationId(null);
    stopPolling();

    try {
      const form = new FormData();
      form.append("mode", mode);
      form.append("source", sourceFile);
      form.append("targetFace", targetFile);
      form.append("consentAccepted", "true");

      const res = await fetch("/api/faceswap", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.jobId || !data.generationId) {
        throw new Error(data.error || "Face Swap fehlgeschlagen");
      }

      setGenerationId(data.generationId);
      await pollJob(data.jobId, data.generationId);
      pollRef.current = setInterval(() => {
        void pollJob(data.jobId, data.generationId).catch((e) => {
          setError(
            sanitizeUserMessage(e instanceof Error ? e.message : "Fehler")
          );
          setStep("input");
          stopPolling();
        });
      }, 5000);
    } catch (err: unknown) {
      setError(
        sanitizeUserMessage(
          err instanceof Error ? err.message : "Face Swap fehlgeschlagen"
        )
      );
      setStep("input");
      stopPolling();
    }
  };

  const reset = () => {
    stopPolling();
    setStep("input");
    revokeSourcePreview();
    setSourceFile(null);
    setSourcePreview(null);
    setTargetFile(null);
    setTargetPreview(null);
    setResultUrl(null);
    setGenerationId(null);
    setProgress(0);
    setError(null);
    setConsentAccepted(false);
    closeCamera();
  };

  const closeCamera = () => {
    mediaRecorderRef.current?.stop();
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    setCameraOpen(false);
    setIsRecording(false);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          void videoPreviewRef.current.play();
        }
      }, 50);
    } catch {
      setError("Kamera-Zugriff verweigert");
    }
  };

  const startRecord = () => {
    const stream = cameraStreamRef.current;
    if (!stream) return;
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    recordChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordChunksRef.current, { type: mimeType });
      const file = new File([blob], "aufnahme.webm", { type: mimeType });
      closeCamera();
      applySourceFile(file);
    };
    mediaRecorderRef.current = recorder;
    recorder.start(200);
    setIsRecording(true);
  };

  const stopRecord = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  if (step === "result" && resultUrl && generationId) {
    return (
      <div className="space-y-4">
        {mode === "video" ? (
          <div className="image-wrapper generated-image-wrapper generated-image-wrapper--unlocked">
            <video
              src={resultUrl}
              controls
              autoPlay
              playsInline
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="generated-image w-full rounded-2xl border border-[#B4FF00]/25"
              style={{ userSelect: "none" }}
            />
          </div>
        ) : (
          <ProtectedGeneratedImage
            src={resultUrl}
            alt="Face Swap Ergebnis"
            locked={false}
            generationId={generationId}
            showDownload
            downloadLabel="Herunterladen"
            aspectClassName="aspect-square max-w-md mx-auto"
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          {mode === "video" && (
            <button
              type="button"
              onClick={() => {
                window.location.href = `/api/download/${generationId}`;
              }}
              className="bg-[#B4FF00] text-[#060608] font-semibold py-3 rounded-xl text-center text-sm hover:bg-[#c8ff33] transition-all"
            >
              ⬇ Herunterladen
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className={`border border-white/20 text-white py-3 rounded-xl text-sm hover:bg-white/5 transition-all ${
              mode === "image" ? "col-span-2" : ""
            }`}
          >
            ↺ Neu erstellen
          </button>
        </div>
        <AiOutputDisclaimer />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {step === "generating" && (
        <div className="absolute inset-0 z-10 bg-[#060608]/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center py-12 px-4">
          <p className="text-white font-semibold text-lg mb-2">
            Face Swap läuft…
          </p>
          <div className="w-full max-w-xs bg-white/10 rounded-full h-2 mb-3">
            <div
              className="bg-[#B4FF00] h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(progress, 8)}%` }}
            />
          </div>
          <p className="text-[#B4FF00] text-sm">{Math.round(progress)}%</p>
          <p className="text-white/65 text-xs mt-2">{TIPS[tipIndex]}</p>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-400/30 text-[#ff8a9a] text-sm">
          {error}
        </div>
      )}

      <FaceSwapUploadBox
        hasFile={!!sourceFile}
        preview={sourcePreview}
        isVideo={sourceIsVideo}
        label={sourceLabel}
        tip={sourceTip}
        drag={dragSource}
        onDrag={setDragSource}
        accept={acceptSource}
        onFile={applySourceFile}
        readyBadge={sourceFile ? "✓ Bereit" : undefined}
      />

      {sourceIsVideo && !sourceFile && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={openCamera}
            className="w-full py-3 rounded-xl border border-white/15 text-white text-sm font-medium hover:border-[#B4FF00]/40 hover:bg-white/5 transition-all"
          >
            📹 Video aufnehmen
          </button>
          {cameraOpen && (
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
              <video
                ref={videoPreviewRef}
                muted
                playsInline
                className="w-full rounded-lg aspect-video object-cover bg-black"
              />
              <button
                type="button"
                onClick={isRecording ? stopRecord : startRecord}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-[#B4FF00] text-[#060608]"
                }`}
              >
                {isRecording ? "⏹ Aufnahme stoppen" : "● Aufnahme starten"}
              </button>
              <button
                type="button"
                onClick={closeCamera}
                className="text-white/70 text-xs hover:text-white w-full text-center"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      )}

      <FaceSwapUploadBox
        hasFile={!!targetFile}
        preview={targetPreview}
        isVideo={false}
        label={targetLabel}
        tip={targetTip}
        drag={dragTarget}
        onDrag={setDragTarget}
        accept="image/jpeg,image/png,image/webp"
        onFile={setTarget}
        readyBadge={targetFile ? "✓ Gesicht" : undefined}
      />

      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#B4FF00]"
        />
        <span className="text-sm text-white/75 leading-relaxed">
          Ich habe die Rechte und Einwilligung für alle hochgeladenen Bilder und
          Videos. Ich verwende keine Inhalte anderer Personen ohne deren
          Zustimmung. Ich verstehe, dass daraus KI-veränderte Inhalte entstehen
          können.
        </span>
      </label>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
          canGenerate
            ? "bg-[#B4FF00] text-[#060608] hover:bg-[#c8ff33] active:scale-[0.98]"
            : "bg-white/10 text-white/65 cursor-not-allowed"
        }`}
      >
        Face Swap erstellen · {credits} Credits
      </button>

      <div className="flex gap-6 justify-center text-xs">
        <span className={sourceFile ? "text-[#B4FF00]" : "text-white/20"}>
          {sourceFile ? "✓" : "○"} Quelle
        </span>
        <span className={targetFile ? "text-[#B4FF00]" : "text-white/20"}>
          {targetFile ? "✓" : "○"} Ziel-Gesicht
        </span>
      </div>
    </div>
  );
}
