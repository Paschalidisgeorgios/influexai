"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ScanFace, Upload } from "lucide-react";
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

export default function CharacterStudioPage() {
  const imgRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [mode, setMode] = useState<"animate" | "replace">("animate");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { generating, elapsedSec, error, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url }) => setResultUrl(url),
  });

  const generate = async () => {
    setErr(null);
    try {
      const res = await fetch("/api/akool/character-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, videoUrl, mode }),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, AKOOL_TOOL_CREDITS.characterStudio)) return;
      if (!res.ok) throw new Error(data.error);
      startPolling(data.jobId, "characterSwap");
    } catch (e: unknown) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <AkoolToolShell
      icon={ScanFace}
      title="CHARACTER STUDIO"
      description="Charakter animieren oder Gesicht in Video ersetzen."
      creditHint={`${AKOOL_TOOL_CREDITS.characterStudio} Credits`}
      generating={generating}
      elapsedSec={elapsedSec}
      result={resultUrl ? (
        <div className="p-2"><video src={resultUrl} controls className="w-full rounded-xl" /><AiOutputDisclaimer /></div>
      ) : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => imgRef.current?.click()}
        className="flex min-h-[120px] cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/15 p-4 hover:border-[#B4FF00]/40"
      >
        {imagePreview ? (
          <div className="relative h-28 w-28 overflow-hidden rounded-xl">
            <Image src={imagePreview} alt="Charakter" fill unoptimized className="object-cover" />
          </div>
        ) : (
          <><Upload size={22} color="#B4FF00" /><span className="ml-2 text-sm text-zinc-400">Charakterbild</span></>
        )}
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => { const u = ev.target?.result as string; setImageUrl(u); setImagePreview(u); };
          r.readAsDataURL(f);
        }} />
      </div>
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Video-URL (Bewegungsquelle)</span>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={akoolInputClass} placeholder="https://…" />
      </label>
      <div className="flex gap-2">
        {(["animate", "replace"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-xl border py-2 text-sm ${mode === m ? "border-[#B4FF00]/50 bg-[#B4FF00]/10 text-[#B4FF00]" : "border-white/12 text-zinc-300"}`}>
            {m === "animate" ? "Animieren" : "Gesicht ersetzen"}
          </button>
        ))}
      </div>
      <button type="button" disabled={generating || !imageUrl || !videoUrl.trim()} onClick={generate} className={akoolButtonClass}>
        Generieren
      </button>
      {(err || error) && <p className="text-sm text-[#ff6b7a]">{err || error}</p>}
    </AkoolToolShell>
  );
}
