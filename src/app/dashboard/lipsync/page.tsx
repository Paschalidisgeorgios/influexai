"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import {
  AkoolToolShell,
  akoolButtonClass,
  akoolInputClass,
  akoolLabelClass,
} from "@/components/akool/AkoolToolShell";
import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { useAkoolJobPoll } from "@/hooks/use-akool-job-poll";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";
import { AiOutputDisclaimer } from "@/components/ui/AiOutputDisclaimer";

export default function LipsyncPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [useTts, setUseTts] = useState(false);
  const [voiceId, setVoiceId] = useState("");
  const [voices, setVoices] = useState<{ id: string; label: string }[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { generating, elapsedSec, error, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url }) => setResultUrl(url),
  });

  useEffect(() => {
    fetch("/api/akool/voices").then((r) => r.json()).then((d) => {
      setVoices(d.voices ?? []);
      if (d.voices?.[0]) setVoiceId(d.voices[0].id);
    });
  }, []);

  const generate = async () => {
    setErr(null);
    let finalAudio = audioUrl;
    if (useTts && ttsText.trim()) {
      const ttsRes = await fetch("/api/akool/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsText, voiceId }),
      });
      const ttsData = await ttsRes.json();
      if (!ttsRes.ok) throw new Error(ttsData.error ?? "TTS fehlgeschlagen");
      finalAudio = ttsData.resultUrl;
    }
    try {
      const res = await fetch("/api/akool/lipsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, audioUrl: finalAudio }),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, AKOOL_TOOL_CREDITS.lipsync)) return;
      if (!res.ok) throw new Error(data.error);
      startPolling(data.jobId, "lipsync");
    } catch (e: unknown) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <AkoolToolShell
      icon={Mic}
      title="LIP SYNC"
      description="Synchronisiere Lippenbewegungen in einem Video mit Audio."
      creditHint={`${AKOOL_TOOL_CREDITS.lipsync} Credits`}
      generating={generating}
      elapsedSec={elapsedSec}
      result={resultUrl ? (
        <div className="p-2"><video src={resultUrl} controls className="w-full rounded-xl" /><AiOutputDisclaimer /></div>
      ) : undefined}
    >
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Video-URL</span>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={akoolInputClass} placeholder="https://…" />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={useTts} onChange={(e) => setUseTts(e.target.checked)} className="accent-[#B4FF00]" />
        Text zu Sprache statt Audio-URL
      </label>
      {useTts ? (
        <>
          <textarea value={ttsText} onChange={(e) => setTtsText(e.target.value)} rows={3} className={akoolInputClass} placeholder="Text für Sprachausgabe…" />
          <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className={akoolInputClass}>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </>
      ) : (
        <label className="flex flex-col gap-2">
          <span className={akoolLabelClass}>Audio-URL</span>
          <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className={akoolInputClass} placeholder="https://…" />
        </label>
      )}
      <button type="button" disabled={generating || !videoUrl.trim()} onClick={generate} className={akoolButtonClass}>
        Lip Sync starten
      </button>
      {(err || error) && <p className="text-sm text-[#ff6b7a]">{err || error}</p>}
    </AkoolToolShell>
  );
}
