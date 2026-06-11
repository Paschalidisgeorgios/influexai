"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
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

const TARGET_LANGS = [
  { code: "de", label: "Deutsch" },
  { code: "en", label: "Englisch" },
  { code: "es", label: "Spanisch" },
  { code: "fr", label: "Französisch" },
  { code: "it", label: "Italienisch" },
  { code: "pt", label: "Portugiesisch" },
  { code: "nl", label: "Niederländisch" },
  { code: "pl", label: "Polnisch" },
  { code: "tr", label: "Türkisch" },
];

export default function VideoTranslationPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("de");
  const [voiceClone, setVoiceClone] = useState(true);
  const [minutes, setMinutes] = useState(1);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const creditCost = minutes * AKOOL_TOOL_CREDITS.videoTranslationPerMinute;
  const { generating, elapsedSec, error, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url }) => setResultUrl(url),
  });

  const generate = async () => {
    setErr(null);
    try {
      const res = await fetch("/api/akool/video-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          sourceLanguage,
          targetLanguage,
          voiceClone,
          durationMinutes: minutes,
        }),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, creditCost)) return;
      if (!res.ok) throw new Error(data.error);
      startPolling(data.jobId, "translation");
    } catch (e: unknown) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <AkoolToolShell
      icon={Languages}
      title="VIDEO ÜBERSETZER"
      description="Übersetze Videos in andere Sprachen mit optionaler Stimmklonung."
      creditHint={`${creditCost} Credits (${AKOOL_TOOL_CREDITS.videoTranslationPerMinute}/Min.)`}
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
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Quellsprache</span>
        <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className={akoolInputClass}>
          <option value="auto">Automatisch erkennen</option>
          {TARGET_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Zielsprache</span>
        <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className={akoolInputClass}>
          {TARGET_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Videolänge (Minuten, geschätzt)</span>
        <input type="number" min={1} max={30} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={akoolInputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={voiceClone} onChange={(e) => setVoiceClone(e.target.checked)} className="accent-[#B4FF00]" />
        Stimme des Sprechers beibehalten (Voice Clone)
      </label>
      <button type="button" disabled={generating || !videoUrl.trim()} onClick={generate} className={akoolButtonClass}>
        Übersetzen
      </button>
      {(err || error) && <p className="text-sm text-[#ff6b7a]">{err || error}</p>}
    </AkoolToolShell>
  );
}
