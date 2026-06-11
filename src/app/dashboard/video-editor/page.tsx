"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
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

export default function VideoEditorPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [strength, setStrength] = useState(50);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { generating, elapsedSec, error, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url }) => setResultUrl(url),
  });

  const generate = async () => {
    setErr(null);
    try {
      const res = await fetch("/api/akool/video-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, stylePrompt, strength }),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, AKOOL_TOOL_CREDITS.videoEditor)) return;
      if (!res.ok) throw new Error(data.error);
      startPolling(data.jobId, "videoEditor");
    } catch (e: unknown) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <AkoolToolShell
      icon={Wand2}
      title="VIDEO EDITOR"
      description="Wende KI-Stile und Looks auf bestehende Videos an."
      creditHint={`${AKOOL_TOOL_CREDITS.videoEditor} Credits`}
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
        <span className={akoolLabelClass}>Stil-Beschreibung</span>
        <textarea value={stylePrompt} onChange={(e) => setStylePrompt(e.target.value)} rows={4} className={akoolInputClass} placeholder="z.B. cinematic noir, warm sunset glow…" />
      </label>
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Stärke: {strength}%</span>
        <input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="w-full accent-[#B4FF00]" />
      </label>
      <button type="button" disabled={generating || !videoUrl.trim() || !stylePrompt.trim()} onClick={generate} className={akoolButtonClass}>
        Stil anwenden
      </button>
      {(err || error) && <p className="text-sm text-[#ff6b7a]">{err || error}</p>}
    </AkoolToolShell>
  );
}
