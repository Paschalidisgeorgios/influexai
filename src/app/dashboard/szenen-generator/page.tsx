"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Film, Upload } from "lucide-react";
import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import {
  AkoolToolShell,
  akoolButtonClass,
  akoolInputClass,
  akoolLabelClass,
} from "@/components/akool/AkoolToolShell";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { useAkoolJobPoll } from "@/hooks/use-akool-job-poll";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";

function calcCredits(model: AkoolImageToVideoModel, resolution: string, duration: number) {
  const res =
    model.resolutionList.find(
      (r) => r.value.toLowerCase() === resolution.toLowerCase()
    ) ?? model.resolutionList[0];
  return Math.max(1, Math.round((res?.unit_credit ?? 5) * duration));
}

export default function VideoGeneratorPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const lastFrameRef = useRef<HTMLInputElement>(null);
  const [models, setModels] = useState<AkoolImageToVideoModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelId, setModelId] = useState("");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lastFrameUrl, setLastFrameUrl] = useState("");
  const [lastFramePreview, setLastFramePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selected = useMemo(
    () => models.find((m) => m.value === modelId) ?? null,
    [models, modelId]
  );

  const creditCost = selected ? calcCredits(selected, resolution, duration) : 0;

  const { generating, elapsedSec, error, setError, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url, generationId: gid }) => {
      setResultUrl(url);
      setGenerationId(gid ?? null);
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/seedance/models");
        const data = await res.json();
        const list = (data.models ?? []) as AkoolImageToVideoModel[];
        setModels(list);
        if (list[0]) {
          setModelId(list[0].value);
          setResolution(list[0].resolutionList[0]?.value ?? "720p");
          setDuration(list[0].durationList[0] ?? 5);
        }
      } catch {
        setError("Modelle konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    })();
  }, [setError]);

  const grouped = useMemo(() => {
    const g: Record<string, AkoolImageToVideoModel[]> = {};
    for (const m of models) {
      (g[m.providerLabel] ??= []).push(m);
    }
    return g;
  }, [models]);

  const handleFile = (file: File, target: "source" | "last") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (target === "source") {
        setImageUrl(url);
        setImagePreview(url);
      } else {
        setLastFrameUrl(url);
        setLastFramePreview(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const runGenerate = useCallback(async () => {
    if (!selected || !imageUrl || !prompt.trim()) return;
    setSubmitError(null);
    setError(null);
    setResultUrl(null);
    try {
      const res = await fetch("/api/akool/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: selected.value,
          imageUrl,
          prompt: prompt.trim(),
          duration,
          resolution,
          lastFrameUrl: lastFrameUrl || undefined,
        }),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, creditCost)) return;
      if (!res.ok || !data.jobId) throw new Error(data.error ?? "Fehler");
      startPolling(data.jobId, "image2video");
    } catch (err: unknown) {
      setSubmitError(
        sanitizeUserMessage(err instanceof Error ? err.message : "Fehler")
      );
    }
  }, [selected, imageUrl, prompt, duration, resolution, lastFrameUrl, creditCost, startPolling, setError]);

  return (
    <AkoolToolShell
      icon={Film}
      title="SZENEN GENERATOR"
      description="Verwandle dein Startbild in ein bewegtes Video — Modell, Dauer und Auflösung frei wählbar."
      creditHint={creditCost > 0 ? `Kosten: ${creditCost} Credits` : undefined}
      loading={loading}
      generating={generating}
      elapsedSec={elapsedSec}
      result={
        resultUrl ? (
          <div className="flex flex-1 flex-col gap-4 p-2">
            <video src={resultUrl} controls playsInline className="w-full rounded-xl border border-[#B4FF00]/25 bg-black" />
            {generationId && (
              <a href={`/api/generated-video/${generationId}?download=1`} className="rounded-lg bg-[#B4FF00] px-3 py-2 text-sm font-semibold text-[#060608] w-fit">
                MP4 herunterladen
              </a>
            )}
            <AiOutputDisclaimer />
          </div>
        ) : undefined
      }
    >
      {Object.entries(grouped).map(([provider, items]) => (
        <div key={provider}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{provider}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => {
                  setModelId(m.value);
                  setResolution(m.resolutionList[0]?.value ?? "720p");
                  setDuration(m.durationList[0] ?? 5);
                }}
                className={`rounded-xl border px-3 py-2 text-left text-sm ${modelId === m.value ? "border-[#B4FF00]/50 bg-[#B4FF00]/10" : "border-white/12"}`}
              >
                {m.label}
                {m.isPro && <span className="ml-1 text-[10px] text-[#B4FF00]">PRO</span>}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 hover:border-[#B4FF00]/40"
      >
        {imagePreview ? (
          <div className="relative h-32 w-48 overflow-hidden rounded-xl">
            <Image src={imagePreview} alt="Startbild" fill unoptimized className="object-cover" />
          </div>
        ) : (
          <>
            <Upload size={24} color="#B4FF00" />
            <p className="mt-2 text-sm text-zinc-400">Startbild hochladen</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "source"); }} />
      </div>

      {selected?.supportedLastFrame && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => lastFrameRef.current?.click()}
          className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-zinc-400 hover:border-[#B4FF00]/40"
        >
          {lastFramePreview ? (
            <div className="relative mx-auto h-20 w-32 overflow-hidden rounded-lg">
              <Image src={lastFramePreview} alt="Endframe" fill unoptimized className="object-cover" />
            </div>
          ) : (
            "Endframe (optional)"
          )}
          <input ref={lastFrameRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "last"); }} />
        </div>
      )}

      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Bewegung beschreiben</span>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className={akoolInputClass} placeholder="Beschreibe die Kamerabewegung und Animation…" />
      </label>

      {selected && (
        <>
          <label className="flex flex-col gap-2">
            <span className={akoolLabelClass}>Dauer</span>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={akoolInputClass}>
              {selected.durationList.map((d) => (
                <option key={d} value={d}>{d} Sekunden</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {selected.resolutionList.map((r) => (
              <button key={r.value} type="button" onClick={() => setResolution(r.value)} className={`rounded-xl border px-3 py-2 text-sm ${resolution === r.value ? "border-[#B4FF00]/50 bg-[#B4FF00]/10 text-[#B4FF00]" : "border-white/12 text-zinc-300"}`}>
                {r.label} — {r.unit_credit} Credits/s
              </button>
            ))}
          </div>
        </>
      )}

      <button type="button" disabled={generating || !imageUrl || !prompt.trim()} onClick={runGenerate} className={akoolButtonClass}>
        {generating ? "Generiert…" : "Video generieren"}
      </button>
      {(error || submitError) && <p className="text-sm text-[#ff6b7a]">{error || submitError}</p>}
    </AkoolToolShell>
  );
}
