"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { extractViralHook } from "@/app/actions/extract-viral-hook";
import { generateContentCalendar } from "@/app/actions/generate-content-calendar";
import type { ToolId } from "./DashboardLayout";
import {
  DASHBOARD_ACCENT,
  DASHBOARD_MUTED,
  DASHBOARD_TEXT,
  DashboardPanel,
} from "./DashboardSurface";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { useAkoolJobPoll } from "@/hooks/use-akool-job-poll";
import { useOptimisticGeneration } from "@/hooks/use-optimistic-generation";
import { useUserCredits } from "@/hooks/use-user-credits";
import { PLATFORM_FORMATS } from "@/lib/ai/imageStylePresets";
import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import type { ContentCalendarFrequency } from "@/lib/content-calendar-analysis";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { onGenerationActionResult } from "@/lib/handle-generation-result";
import { mergeSzenenGeneratorModels } from "@/lib/szenen-generator-models";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { buildAgentPrepareHref } from "./production-tool-setup-ui";

const inputClass =
  "w-full rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-black/30 focus:border-[#B4FF00]/40 focus:shadow-[0_0_0_4px_rgba(180,255,0,0.08)]";

const inputStyle = {
  background: "#FFFCF7",
  borderColor: "rgba(8,8,8,0.14)",
  color: DASHBOARD_TEXT,
} as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: DASHBOARD_MUTED }}>
      {children}
    </p>
  );
}

function SetupActions({
  primaryLabel,
  onPrimary,
  agentHref,
  primaryDisabled,
  loading,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  agentHref: string;
  primaryDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
      <LoadingButton
        mode="agent"
        isLoading={!!loading}
        disabled={primaryDisabled || loading}
        onClick={onPrimary}
        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-6 text-sm font-bold sm:flex-none sm:min-w-[12rem]"
        style={{ background: DASHBOARD_ACCENT, color: "#060608" }}
      >
        {primaryLabel}
      </LoadingButton>
      <Link
        href={agentHref}
        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border px-6 text-sm font-medium no-underline sm:flex-none"
        style={{
          borderColor: "rgba(8,8,8,0.12)",
          background: "#FFFCF7",
          color: DASHBOARD_TEXT,
        }}
      >
        Mit Agent vorbereiten
      </Link>
    </div>
  );
}

function ResultPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardPanel title={title}>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
        {children}
      </div>
      <AiOutputDisclaimer tone="light" className="mt-4 border-t border-black/[0.08] pt-3" />
    </DashboardPanel>
  );
}

function ViralHookSetup() {
  const [mode, setMode] = useState<"topic" | "link">("topic");
  const [topic, setTopic] = useState("");
  const [link, setLink] = useState("");
  const [niche, setNiche] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const { credits } = useUserCredits();
  const { generate, isGenerating } = useOptimisticGeneration();

  const canGenerate =
    mode === "topic" ? topic.trim().length >= 10 : link.trim().length > 0;

  const run = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await generate(
        () =>
          extractViralHook(
            mode === "link"
              ? { mode: "url", youtubeUrl: link, userNiche: niche || undefined }
              : {
                  mode: "manual",
                  manualDescription: topic,
                  userNiche: niche || undefined,
                }
          ),
        3,
        credits ?? 0
      );
      onGenerationActionResult(res);
      if (!res.success) {
        setError(sanitizeUserMessage(res.error));
        return;
      }
      setResult(res.result.hook);
    } catch (e) {
      setError(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  const agentHref = buildAgentPrepareHref("viral-hook", {
    mode,
    topic: mode === "topic" ? topic : link,
    niche,
  });

  return (
    <DashboardPanel>
      <div className="mb-6 flex gap-2">
        {(["topic", "link"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex-1 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors"
            style={{
              borderColor: mode === m ? "rgba(180,255,0,0.35)" : "rgba(8,8,8,0.10)",
              background: mode === m ? "rgba(180,255,0,0.12)" : "#FFFCF7",
              color: DASHBOARD_TEXT,
            }}
          >
            {m === "topic" ? "Aus Thema" : "Aus Link"}
          </button>
        ))}
      </div>

      {mode === "topic" ? (
        <div className="mb-5">
          <FieldLabel>Thema / Briefing</FieldLabel>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={5}
            placeholder="Worum geht es? Was soll der Hook auslösen?"
            className={`${inputClass} min-h-[140px] resize-none`}
            style={inputStyle}
          />
        </div>
      ) : (
        <div className="mb-5">
          <FieldLabel>YouTube-Link</FieldLabel>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://youtube.com/shorts/…"
            className={inputClass}
            style={inputStyle}
          />
        </div>
      )}

      <div className="mb-6">
        <FieldLabel>Nische (optional)</FieldLabel>
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="z. B. Fitness, Finance"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-700">{error}</p>
      ) : null}

      <SetupActions
        primaryLabel="Hook generieren"
        onPrimary={() => void run()}
        agentHref={agentHref}
        primaryDisabled={!canGenerate}
        loading={isGenerating}
      />

      {result ? (
        <div className="mt-6">
          <ResultPanel title="Hook">
            <p className="whitespace-pre-wrap font-medium">{result}</p>
          </ResultPanel>
        </div>
      ) : null}
    </DashboardPanel>
  );
}

const CAL_PLATFORMS = ["TikTok", "YouTube Shorts", "Instagram Reels", "Alle Plattformen"];
const CAL_FREQUENCIES: { id: ContentCalendarFrequency; label: string }[] = [
  { id: "daily", label: "30 Tage · täglich" },
  { id: "three_per_week", label: "12 Posts · 3× / Woche" },
  { id: "weekly", label: "4 Posts · wöchentlich" },
];

function ContentCalendarSetup() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState(CAL_PLATFORMS[0]);
  const [frequency, setFrequency] = useState<ContentCalendarFrequency>("daily");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const { credits } = useUserCredits();
  const { generate, isGenerating } = useOptimisticGeneration();

  const run = async () => {
    setError(null);
    setSummary(null);
    try {
      const res = await generate(
        () =>
          generateContentCalendar({
            niche,
            platform,
            frequency,
            language: "de",
          }),
        5,
        credits ?? 0
      );
      onGenerationActionResult(res);
      if (!res.success) {
        setError(sanitizeUserMessage(res.error));
        return;
      }
      setSummary(res.result.summary);
    } catch (e) {
      setError(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <DashboardPanel>
      <div className="mb-5">
        <FieldLabel>Thema / Nische</FieldLabel>
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Wofür planst du Content?"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Plattform</FieldLabel>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className={inputClass}
            style={inputStyle}
          >
            {CAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Zeitraum</FieldLabel>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ContentCalendarFrequency)}
            className={inputClass}
            style={inputStyle}
          >
            {CAL_FREQUENCIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      <SetupActions
        primaryLabel="Kalender generieren"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("content-calendar", { niche, platform, frequency })}
        primaryDisabled={!niche.trim()}
        loading={isGenerating}
      />

      {summary ? (
        <div className="mt-6">
          <ResultPanel title="Plan">
            <p className="whitespace-pre-wrap">{summary}</p>
          </ResultPanel>
        </div>
      ) : null}
    </DashboardPanel>
  );
}

function ImageGenSetup() {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState(PLATFORM_FORMATS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setError(null);
    setImageUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform }),
      });
      const data = (await res.json()) as {
        error?: string;
        imageUrl?: string;
        generationId?: string;
        credits?: number;
      };
      if (!res.ok) {
        setError(sanitizeUserMessage(data.error ?? "Generierung fehlgeschlagen"));
        return;
      }
      const url =
        data.imageUrl ??
        (data.generationId
          ? `/api/generated-image/${data.generationId}?variant=preview`
          : null);
      if (!url) {
        setError("Kein Bild zurückgegeben.");
        return;
      }
      setImageUrl(url);
      window.dispatchEvent(new Event("credits-updated"));
    } catch (e) {
      setError(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardPanel>
      <div className="mb-5">
        <FieldLabel>Prompt</FieldLabel>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="Was soll auf dem Bild zu sehen sein?"
          className={`${inputClass} min-h-[140px] resize-none`}
          style={inputStyle}
        />
      </div>

      <div className="mb-6">
        <FieldLabel>Format</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_FORMATS.map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setPlatform(fmt.id)}
              className="rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
              style={{
                borderColor:
                  platform === fmt.id ? "rgba(180,255,0,0.35)" : "rgba(8,8,8,0.10)",
                background: platform === fmt.id ? "rgba(180,255,0,0.12)" : "#FFFCF7",
                color: DASHBOARD_TEXT,
              }}
            >
              {fmt.aspectLabel} · {fmt.labelDE}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      <SetupActions
        primaryLabel="Bild generieren"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("image-gen", { prompt, platform })}
        primaryDisabled={!prompt.trim()}
        loading={loading}
      />

      {imageUrl ? (
        <div className="mt-6">
          <ResultPanel title="Ergebnis">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Generiertes Bild"
              className="w-full max-w-md rounded-xl border border-black/[0.08]"
            />
          </ResultPanel>
        </div>
      ) : null}
    </DashboardPanel>
  );
}

function TextToVideoSetup() {
  const [models, setModels] = useState<AkoolImageToVideoModel[]>([]);
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [err, setErr] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const selected = useMemo(
    () => models.find((m) => m.value === modelId),
    [models, modelId]
  );

  const { generating, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl }) => setVideoUrl(resultUrl),
  });

  useEffect(() => {
    fetch("/api/akool/text-to-video")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.models ?? []) as AkoolImageToVideoModel[];
        setModels(list);
        if (list[0]) {
          setModelId(list[0].value);
          setDuration(list[0].durationList[0] ?? 5);
          setResolution(list[0].resolutionList[0]?.value ?? "720p");
        }
      })
      .catch(() => setErr("Modelle konnten nicht geladen werden."));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDuration(selected.durationList[0] ?? 5);
    setResolution(selected.resolutionList[0]?.value ?? "720p");
  }, [selected]);

  const run = async () => {
    setErr(null);
    setVideoUrl(null);
    try {
      const res = await fetch("/api/akool/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, prompt, duration, resolution }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string; credits?: number };
      if (handleApiInsufficientCredits(res.status, data, AKOOL_TOOL_CREDITS.textToVideo)) {
        return;
      }
      if (!res.ok || !data.jobId) throw new Error(data.error ?? "Fehler");
      startPolling(data.jobId, "text2video");
    } catch (e) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <DashboardPanel>
      <div className="mb-5">
        <FieldLabel>Prompt</FieldLabel>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Beschreibe die Szene…"
          className={`${inputClass} min-h-[120px] resize-none`}
          style={inputStyle}
        />
      </div>

      {models.length > 0 ? (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <FieldLabel>Modell</FieldLabel>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          {selected ? (
            <>
              <div>
                <FieldLabel>Dauer</FieldLabel>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className={inputClass}
                  style={inputStyle}
                >
                  {selected.durationList.map((d) => (
                    <option key={d} value={d}>
                      {d}s
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Auflösung</FieldLabel>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                >
                  {selected.resolutionList.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {err ? <p className="mb-4 text-sm text-red-700">{err}</p> : null}

      <SetupActions
        primaryLabel={generating ? "Wird gerendert…" : "Video generieren"}
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("text-to-video", { prompt, modelId })}
        primaryDisabled={!prompt.trim() || !modelId || generating}
        loading={generating}
      />

      {videoUrl ? (
        <div className="mt-6">
          <ResultPanel title="Video">
            <video src={videoUrl} controls className="w-full max-w-lg rounded-xl" />
          </ResultPanel>
        </div>
      ) : null}
    </DashboardPanel>
  );
}

function ImgToVideoSetup() {
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [err, setErr] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const { generating, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl }) => setVideoUrl(resultUrl),
  });

  useEffect(() => {
    fetch("/api/seedance/models")
      .then((r) => r.json())
      .then((d) => {
        const apiModels = (d.models ?? []) as AkoolImageToVideoModel[];
        const merged = mergeSzenenGeneratorModels(apiModels);
        setModels(merged.map((m) => ({ id: m.id, name: m.name })));
        if (merged[0]) {
          setModelId(merged[0].id);
          setDuration(merged[0].durations[0] ?? 5);
          setResolution(merged[0].resolutions[0] ?? "720p");
        }
      })
      .catch(() => setErr("Modelle konnten nicht geladen werden."));
  }, []);

  const canGenerate = Boolean(prompt.trim() && imageUrl.trim() && modelId);

  const run = async () => {
    setErr(null);
    setVideoUrl(null);
    try {
      const res = await fetch("/api/akool/image-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          imageUrl: imageUrl.trim(),
          prompt: prompt.trim(),
          duration,
          resolution,
        }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string; credits?: number };
      if (!res.ok || !data.jobId) throw new Error(data.error ?? "Fehler");
      startPolling(data.jobId, "image2video");
    } catch (e) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <DashboardPanel>
      <div className="mb-5">
        <FieldLabel>Startbild (URL)</FieldLabel>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="mb-5">
        <FieldLabel>Prompt</FieldLabel>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Wie soll sich das Bild bewegen?"
          className={`${inputClass} min-h-[120px] resize-none`}
          style={inputStyle}
        />
      </div>

      {models.length > 0 ? (
        <div className="mb-5">
          <FieldLabel>Modell</FieldLabel>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className={inputClass}
            style={inputStyle}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {err ? <p className="mb-4 text-sm text-red-700">{err}</p> : null}

      <SetupActions
        primaryLabel={generating ? "Wird gerendert…" : "Video generieren"}
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("img-to-video", { prompt, imageUrl, modelId })}
        primaryDisabled={!canGenerate || generating}
        loading={generating}
      />

      {!canGenerate ? (
        <p className="mt-4 text-xs" style={{ color: DASHBOARD_MUTED }}>
          Startbild-URL, Prompt und Modell ausfüllen — oder über den Agent starten.
        </p>
      ) : null}

      {videoUrl ? (
        <div className="mt-6">
          <ResultPanel title="Video">
            <video src={videoUrl} controls className="w-full max-w-lg rounded-xl" />
          </ResultPanel>
        </div>
      ) : null}
    </DashboardPanel>
  );
}

export function ProductionToolSetupBody({ toolId }: { toolId: ToolId }) {
  switch (toolId) {
    case "viral-hook":
      return <ViralHookSetup />;
    case "content-calendar":
      return <ContentCalendarSetup />;
    case "image-gen":
      return <ImageGenSetup />;
    case "img-to-video":
      return <ImgToVideoSetup />;
    case "text-to-video":
      return <TextToVideoSetup />;
    default:
      return null;
  }
}
