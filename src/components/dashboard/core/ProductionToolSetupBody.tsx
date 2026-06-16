"use client";

import { useEffect, useMemo, useState } from "react";
import { extractViralHook } from "@/app/actions/extract-viral-hook";
import { generateContentCalendar } from "@/app/actions/generate-content-calendar";
import type { ToolId } from "./DashboardLayout";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "./DashboardSurface";
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
import { mergeSzenenGeneratorModels, type SzenenGeneratorModel } from "@/lib/szenen-generator-models";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { buildAgentPrepareHref, SETUP_COPY } from "./production-tool-setup-ui";
import {
  StudioActionBar,
  StudioFieldHelper,
  StudioFieldLabel,
  StudioInput,
  StudioOptionPills,
  StudioPanel,
  StudioSegmentedControl,
  StudioSelect,
  StudioTextarea,
} from "../studio-ui";

const IMAGE_SETUP_FORMATS = PLATFORM_FORMATS.filter((f) =>
  ["1:1", "9:16", "16:9"].includes(f.aspectLabel)
);

const VIRAL_HOOK_MODES = [
  { value: "topic" as const, label: "Hook aus Thema" },
  { value: "link" as const, label: "Hook aus Link" },
];

const SETUP_FORM_CLASS =
  "relative w-full min-w-0 max-w-full space-y-5 pb-2 md:pb-0";

type SetupActionsProps = {
  primaryLabel: string;
  primaryLoadingLabel?: string;
  onPrimary: () => void;
  agentHref: string;
  primaryDisabled?: boolean;
  loading?: boolean;
};

function SetupActions({
  primaryLabel,
  primaryLoadingLabel,
  onPrimary,
  agentHref,
  primaryDisabled,
  loading,
}: SetupActionsProps) {
  return (
    <StudioActionBar
      primaryLabel={primaryLabel}
      primaryLoadingLabel={primaryLoadingLabel}
      onPrimary={onPrimary}
      secondaryHref={agentHref}
      secondaryLabel={SETUP_COPY.agentSecondary}
      primaryDisabled={primaryDisabled}
      primaryLoading={loading}
    />
  );
}

function ResponsiveSetupActions(props: SetupActionsProps) {
  return (
    <>
      <div className="md:hidden">
        <StudioActionBar
          stickyMobile
          {...props}
          secondaryHref={props.agentHref}
          secondaryLabel={SETUP_COPY.agentSecondary}
          primaryLoading={props.loading}
        />
      </div>
      <div className="hidden md:block">
        <SetupActions {...props} />
      </div>
    </>
  );
}

function MobileEarlySetupActions(props: SetupActionsProps) {
  return (
    <div className="md:hidden">
      <StudioActionBar
        stickyMobile
        {...props}
        secondaryHref={props.agentHref}
        secondaryLabel={SETUP_COPY.agentSecondary}
        primaryLoading={props.loading}
      />
    </div>
  );
}

function DesktopSetupActions(props: SetupActionsProps) {
  return (
    <div className="hidden md:block">
      <SetupActions {...props} />
    </div>
  );
}

function SetupError({ message }: { message: string }) {
  return <p className="text-sm text-red-700">{message}</p>;
}

function ResultPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <StudioPanel title={title}>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
        {children}
      </div>
      <AiOutputDisclaimer tone="light" className="mt-4 border-t border-black/[0.08] pt-3" />
      <p className="mt-3 text-xs" style={{ color: DASHBOARD_MUTED }}>
        {SETUP_COPY.galleryResult}
      </p>
    </StudioPanel>
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
      setError(
        sanitizeUserMessage(
          e instanceof Error ? e.message : SETUP_COPY.errorGeneric
        )
      );
    }
  };

  const agentHref = buildAgentPrepareHref("viral-hook", {
    mode,
    topic: mode === "topic" ? topic : link,
    niche,
  });

  return (
    <div className={SETUP_FORM_CLASS}>
      <div>
        <StudioFieldLabel>Quelle</StudioFieldLabel>
        <StudioSegmentedControl
          value={mode}
          options={VIRAL_HOOK_MODES}
          onChange={setMode}
        />
      </div>

      {mode === "topic" ? (
        <div>
          <StudioFieldLabel>Thema oder Produkt</StudioFieldLabel>
          <StudioTextarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z. B. Neuer Beauty-Launch für junge Frauen auf TikTok"
          />
        </div>
      ) : (
        <div>
          <StudioFieldLabel>Link</StudioFieldLabel>
          <StudioInput
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://youtube.com/shorts/…"
          />
        </div>
      )}

      <div>
        <StudioFieldLabel>Zielgruppe / Nische (optional)</StudioFieldLabel>
        <StudioInput
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="z. B. Fitness, Beauty, B2B"
        />
      </div>

      {error ? <SetupError message={error} /> : null}

      {!result && !error ? (
        <StudioFieldHelper>
          Gute Hooks erklären nicht alles. Sie erzeugen Neugier in den ersten Sekunden.
        </StudioFieldHelper>
      ) : null}

      <ResponsiveSetupActions
        primaryLabel="Hooks generieren"
        onPrimary={() => void run()}
        agentHref={agentHref}
        primaryDisabled={!canGenerate}
        loading={isGenerating}
      />

      {result ? (
        <ResultPanel title="Hook">
          <p className="whitespace-pre-wrap font-medium">{result}</p>
        </ResultPanel>
      ) : null}
    </div>
  );
}

const CAL_PLATFORMS = ["Instagram", "TikTok", "YouTube Shorts", "LinkedIn"];
const CAL_FREQUENCIES: { id: ContentCalendarFrequency; label: string }[] = [
  { id: "weekly", label: "30 Tage · 1× pro Woche" },
  { id: "three_per_week", label: "30 Tage · 3× pro Woche" },
  { id: "daily", label: "30 Tage · täglich" },
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
      setError(
        sanitizeUserMessage(
          e instanceof Error ? e.message : SETUP_COPY.errorGeneric
        )
      );
    }
  };

  return (
    <div className={SETUP_FORM_CLASS}>
      <div>
        <StudioFieldLabel>Thema, Branche oder Angebot</StudioFieldLabel>
        <StudioInput
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="z. B. Griechisches Restaurant in Stuttgart, mehr Reservierungen über Instagram"
        />
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <StudioFieldLabel>Plattform</StudioFieldLabel>
          <StudioSelect value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {CAL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </StudioSelect>
        </div>
        <div className="min-w-0">
          <StudioFieldLabel>Zeitraum</StudioFieldLabel>
          <StudioSelect
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ContentCalendarFrequency)}
          >
            {CAL_FREQUENCIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </StudioSelect>
        </div>
      </div>

      {error ? <SetupError message={error} /> : null}

      <ResponsiveSetupActions
        primaryLabel="Kalender erstellen"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("content-calendar", { niche, platform, frequency })}
        primaryDisabled={!niche.trim()}
        loading={isGenerating}
      />

      {summary ? (
        <ResultPanel title="Plan">
          <p className="whitespace-pre-wrap">{summary}</p>
        </ResultPanel>
      ) : null}
    </div>
  );
}

function ImageGenSetup() {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState(IMAGE_SETUP_FORMATS[0]?.id ?? PLATFORM_FORMATS[0].id);
  const [quality, setQuality] = useState<"standard" | "high">("standard");
  const highRes = quality === "high";
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatOptions = IMAGE_SETUP_FORMATS.map((fmt) => ({
    value: fmt.id,
    label: fmt.aspectLabel,
  }));

  const run = async () => {
    setError(null);
    setImageUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform, highRes }),
      });
      const data = (await res.json()) as {
        error?: string;
        imageUrl?: string;
        generationId?: string;
        credits?: number;
      };
      if (!res.ok) {
        setError(sanitizeUserMessage(data.error ?? SETUP_COPY.errorGeneric));
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
      setError(
        sanitizeUserMessage(
          e instanceof Error ? e.message : SETUP_COPY.errorGeneric
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={SETUP_FORM_CLASS}>
      <div>
        <StudioFieldLabel>Bildbeschreibung</StudioFieldLabel>
        <StudioTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="z. B. Premium Produktfoto einer schwarzen Parfumflasche auf hellem Stein, cinematic lighting"
        />
      </div>

      <div className="min-w-0">
        <StudioFieldLabel>Format</StudioFieldLabel>
        <StudioOptionPills
          value={platform}
          options={formatOptions}
          onChange={setPlatform}
        />
      </div>

      <div className="min-w-0">
        <StudioFieldLabel>Qualität</StudioFieldLabel>
        <StudioOptionPills
          value={quality}
          options={[
            { value: "standard" as const, label: "Standard" },
            { value: "high" as const, label: "High Resolution" },
          ]}
          onChange={setQuality}
        />
      </div>

      <StudioFieldHelper>
        Für bessere Ergebnisse: Motiv, Stil, Licht, Hintergrund und gewünschtes Format beschreiben.
      </StudioFieldHelper>

      {error ? <SetupError message={error} /> : null}

      <ResponsiveSetupActions
        primaryLabel="Bild generieren"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("image-gen", { prompt, platform })}
        primaryDisabled={!prompt.trim()}
        loading={loading}
      />

      {imageUrl ? (
        <ResultPanel title="Ergebnis">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Generiertes Bild"
            className="w-full max-w-md rounded-xl border border-black/[0.08]"
          />
        </ResultPanel>
      ) : null}
    </div>
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
      .catch(() => setErr(SETUP_COPY.errorGeneric));
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
      if (!res.ok || !data.jobId) throw new Error(data.error ?? SETUP_COPY.errorGeneric);
      startPolling(data.jobId, "text2video");
    } catch (e) {
      setErr(
        sanitizeUserMessage(
          e instanceof Error ? e.message : SETUP_COPY.errorGeneric
        )
      );
    }
  };

  return (
    <div className={SETUP_FORM_CLASS}>
      <div>
        <StudioFieldLabel>Videobeschreibung</StudioFieldLabel>
        <StudioTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="min-h-[120px]"
          placeholder="z. B. Eine moderne Fashion-Ad-Szene in einer hellen Stadt, langsame Kamerafahrt, hochwertiger Look"
        />
      </div>

      {err ? <SetupError message={err} /> : null}

      <MobileEarlySetupActions
        primaryLabel="Video vorbereiten"
        primaryLoadingLabel="Erstellung gestartet…"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("text-to-video", { prompt, modelId })}
        primaryDisabled={!prompt.trim() || !modelId || generating}
        loading={generating}
      />

      {models.length > 0 ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-3">
          <div className="min-w-0 sm:col-span-3">
            <StudioFieldLabel>Modell</StudioFieldLabel>
            <StudioSelect value={modelId} onChange={(e) => setModelId(e.target.value)}>
              {models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </StudioSelect>
          </div>
          {selected ? (
            <>
              <div className="min-w-0">
                <StudioFieldLabel>Dauer</StudioFieldLabel>
                <StudioSelect
                  value={String(duration)}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {selected.durationList.map((d) => (
                    <option key={d} value={d}>
                      {d} Sekunden
                    </option>
                  ))}
                </StudioSelect>
              </div>
              <div className="min-w-0">
                <StudioFieldLabel>Format</StudioFieldLabel>
                <StudioSelect
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                >
                  {selected.resolutionList.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </StudioSelect>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <DesktopSetupActions
        primaryLabel="Video vorbereiten"
        primaryLoadingLabel="Erstellung gestartet…"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("text-to-video", { prompt, modelId })}
        primaryDisabled={!prompt.trim() || !modelId || generating}
        loading={generating}
      />

      {videoUrl ? (
        <ResultPanel title="Video">
          <video src={videoUrl} controls className="w-full max-w-lg rounded-xl" />
        </ResultPanel>
      ) : null}
    </div>
  );
}

function ImgToVideoSetup() {
  const [models, setModels] = useState<SzenenGeneratorModel[]>([]);
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [err, setErr] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const selected = useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId]
  );

  const { generating, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl }) => setVideoUrl(resultUrl),
  });

  useEffect(() => {
    fetch("/api/seedance/models")
      .then((r) => r.json())
      .then((d) => {
        const apiModels = (d.models ?? []) as AkoolImageToVideoModel[];
        const merged = mergeSzenenGeneratorModels(apiModels);
        setModels(merged);
        if (merged[0]) {
          setModelId(merged[0].id);
          setDuration(merged[0].durations[0] ?? 5);
          setResolution(merged[0].resolutions[0] ?? "720p");
        }
      })
      .catch(() => setErr(SETUP_COPY.errorGeneric));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDuration(selected.durations[0] ?? 5);
    setResolution(selected.resolutions[0] ?? "720p");
  }, [selected]);

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
      if (!res.ok || !data.jobId) throw new Error(data.error ?? SETUP_COPY.errorGeneric);
      startPolling(data.jobId, "image2video");
    } catch (e) {
      setErr(
        sanitizeUserMessage(
          e instanceof Error ? e.message : SETUP_COPY.errorGeneric
        )
      );
    }
  };

  return (
    <div className={SETUP_FORM_CLASS}>
      <div>
        <StudioFieldLabel>Startbild</StudioFieldLabel>
        <StudioInput
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Bild-URL einfügen — z. B. aus der Galerie"
        />
        <StudioFieldHelper className="mt-2">
          URL aus Galerie oder externem Link einfügen.
        </StudioFieldHelper>
      </div>

      <div>
        <StudioFieldLabel>Bewegung beschreiben</StudioFieldLabel>
        <StudioTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="min-h-[120px]"
          placeholder="z. B. Kamera fährt langsam nach vorne, Licht reflektiert auf dem Produkt, cinematic motion"
        />
      </div>

      {err ? <SetupError message={err} /> : null}

      <MobileEarlySetupActions
        primaryLabel="Video vorbereiten"
        primaryLoadingLabel="Erstellung gestartet…"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("img-to-video", { prompt, imageUrl, modelId })}
        primaryDisabled={!canGenerate || generating}
        loading={generating}
      />

      {models.length > 0 ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-3">
          <div className="min-w-0 sm:col-span-3">
            <StudioFieldLabel>Modell</StudioFieldLabel>
            <StudioSelect value={modelId} onChange={(e) => setModelId(e.target.value)}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </StudioSelect>
          </div>
          {selected ? (
            <>
              <div className="min-w-0">
                <StudioFieldLabel>Dauer</StudioFieldLabel>
                <StudioSelect
                  value={String(duration)}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {selected.durations.map((d) => (
                    <option key={d} value={d}>
                      {d} Sekunden
                    </option>
                  ))}
                </StudioSelect>
              </div>
              <div className="min-w-0">
                <StudioFieldLabel>Format</StudioFieldLabel>
                <StudioSelect
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                >
                  {selected.resolutions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </StudioSelect>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <StudioFieldHelper>
        Je klarer die gewünschte Bewegung beschrieben ist, desto besser wird der Clip.
      </StudioFieldHelper>

      <DesktopSetupActions
        primaryLabel="Video vorbereiten"
        primaryLoadingLabel="Erstellung gestartet…"
        onPrimary={() => void run()}
        agentHref={buildAgentPrepareHref("img-to-video", { prompt, imageUrl, modelId })}
        primaryDisabled={!canGenerate || generating}
        loading={generating}
      />

      {videoUrl ? (
        <ResultPanel title="Video">
          <video src={videoUrl} controls className="w-full max-w-lg rounded-xl" />
        </ResultPanel>
      ) : null}
    </div>
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
