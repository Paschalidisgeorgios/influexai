"use client";

import { useEffect, useMemo, useState } from "react";
import { Clapperboard } from "lucide-react";
import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import {
  AkoolToolShell,
  akoolButtonClass,
  akoolInputClass,
  akoolLabelClass,
} from "@/components/akool/AkoolToolShell";
import { getCreditDisplayLabel } from "@/lib/tools/credit-display";
import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { useAkoolJobPoll } from "@/hooks/use-akool-job-poll";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";
import { AgentHandoffPanel } from "@/components/dashboard/studio-ui";
import { useAgentPreparedInputs } from "@/hooks/useAgentPreparedInputs";
import { applyPreparedInputsToWorkspaceState } from "@/lib/tools/agent-prepared-inputs";
import {
  buildTextToVideoLocalState,
  buildToolActionReadiness,
} from "@/lib/tools/tool-action-readiness";

export default function TextToVideoPage() {
  const prepared = useAgentPreparedInputs("text-to-video");
  const [models, setModels] = useState<AkoolImageToVideoModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState("720p");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const selected = useMemo(() => models.find((m) => m.value === modelId), [models, modelId]);
  const creditHint = getCreditDisplayLabel("text-to-video");
  const creditCost = AKOOL_TOOL_CREDITS.textToVideo;

  const { generating, elapsedSec, error, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url }) => setResultUrl(url),
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
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!prepared) return;
    const hints = applyPreparedInputsToWorkspaceState(prepared, { prompt });
    if (hints.prompt && !prompt.trim()) {
      setPrompt(hints.prompt);
    }
  }, [prepared]); // eslint-disable-line react-hooks/exhaustive-deps

  const readiness = useMemo(() => {
    if (!prepared) return null;
    const local = buildTextToVideoLocalState({
      prompt,
      aspectRatio: prepared.recommendedAspectRatio,
    });
    return buildToolActionReadiness(prepared, local);
  }, [prepared, prompt]);

  const generate = async () => {
    setErr(null);
    try {
      const res = await fetch("/api/akool/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, prompt, duration, resolution }),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, creditCost)) return;
      if (!res.ok) throw new Error(data.error);
      startPolling(data.jobId, "text2video");
    } catch (e: unknown) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      {prepared ? <AgentHandoffPanel prepared={prepared} readiness={readiness} /> : null}
    <AkoolToolShell
      icon={Clapperboard}
      title="TEXT ZU VIDEO"
      description="Erstelle Videos allein aus einer Textbeschreibung."
      creditHint={creditHint}
      loading={loading}
      generating={generating}
      elapsedSec={elapsedSec}
      result={resultUrl ? (
        <div className="p-2"><video src={resultUrl} controls className="w-full rounded-xl" /><AiOutputDisclaimer /></div>
      ) : undefined}
    >
      {models.length > 0 && (
        <select value={modelId} onChange={(e) => setModelId(e.target.value)} className={akoolInputClass}>
          {models.map((m) => (
            <option key={m.value} value={m.value}>{m.label} ({m.providerLabel})</option>
          ))}
        </select>
      )}
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className={akoolInputClass}
          placeholder={prepared?.suggestedPromptPlaceholder ?? "Beschreibe dein Video…"}
        />
      </label>
      {selected && (
        <>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={akoolInputClass}>
            {selected.durationList.map((d) => <option key={d} value={d}>{d}s</option>)}
          </select>
          <select value={resolution} onChange={(e) => setResolution(e.target.value)} className={akoolInputClass}>
            {selected.resolutionList.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </>
      )}
      <button type="button" disabled={generating || !prompt.trim()} onClick={generate} className={akoolButtonClass}>
        Video generieren
      </button>
      {(err || error) && <p className="text-sm text-[#ff6b7a]">{err || error}</p>}
    </AkoolToolShell>
    </div>
  );
}
