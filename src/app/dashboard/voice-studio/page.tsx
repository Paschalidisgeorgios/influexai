"use client";

import { useEffect, useState } from "react";
import { Mic2 } from "lucide-react";
import {
  AkoolToolShell,
  akoolButtonClass,
  akoolInputClass,
  akoolLabelClass,
} from "@/components/akool/AkoolToolShell";
import { AKOOL_TOOL_CREDITS } from "@/lib/akool-credits";
import { handleApiInsufficientCredits } from "@/lib/client-credits-ui";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

type Tab = "tts" | "clone" | "changer";

export default function VoiceStudioPage() {
  const [tab, setTab] = useState<Tab>("tts");
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [voices, setVoices] = useState<{ id: string; label: string }[]>([]);
  const [sampleUrl, setSampleUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/akool/voices").then((r) => r.json()).then((d) => {
      setVoices(d.voices ?? []);
      if (d.voices?.[0]) setVoiceId(d.voices[0].id);
    });
  }, []);

  const creditForTab =
    tab === "tts"
      ? AKOOL_TOOL_CREDITS.tts
      : tab === "clone"
        ? AKOOL_TOOL_CREDITS.voiceClone
        : AKOOL_TOOL_CREDITS.voiceChanger;

  const generate = async () => {
    setErr(null);
    setLoading(true);
    setResultUrl(null);
    try {
      let endpoint = "/api/akool/tts";
      let body: Record<string, string> = { text, voiceId };
      if (tab === "clone") {
        endpoint = "/api/akool/voice-clone";
        body = { text, voiceUrl: sampleUrl };
      } else if (tab === "changer") {
        endpoint = "/api/akool/voice-changer";
        body = { audioUrl, voiceId };
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, creditForTab)) return;
      if (!res.ok) throw new Error(data.error);
      setResultUrl(data.resultUrl);
      window.dispatchEvent(new CustomEvent("credits-updated"));
    } catch (e: unknown) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "tts", label: "Text zu Sprache" },
    { id: "clone", label: "Stimme klonen" },
    { id: "changer", label: "Stimme ändern" },
  ];

  return (
    <AkoolToolShell
      icon={Mic2}
      title="VOICE STUDIO"
      description="Text-to-Speech, Stimmenklonen und Voice Conversion mit Akool."
      creditHint={`${creditForTab} Credits`}
      generating={loading}
      result={resultUrl ? (
        <div className="flex flex-1 flex-col justify-center p-4">
          <audio src={resultUrl} controls className="w-full" />
          <a href={resultUrl} download className="mt-3 text-sm text-[#B4FF00]">Audio herunterladen</a>
        </div>
      ) : undefined}
    >
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-[48px] w-full rounded-xl border px-3 py-2 text-sm sm:w-auto ${tab === t.id ? "border-[#B4FF00]/50 bg-[#B4FF00]/10 text-[#B4FF00]" : "border-white/12 text-zinc-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tts" && (
        <>
          <label className="flex flex-col gap-2">
            <span className={akoolLabelClass}>Text ({text.length}/5000)</span>
            <textarea value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} rows={6} className={akoolInputClass} placeholder="Text eingeben…" />
          </label>
          <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className={akoolInputClass}>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </>
      )}

      {tab === "clone" && (
        <>
          <label className="flex flex-col gap-2">
            <span className={akoolLabelClass}>Stimm-Sample URL (min. 30s empfohlen)</span>
            <input value={sampleUrl} onChange={(e) => setSampleUrl(e.target.value)} className={akoolInputClass} placeholder="https://…" />
          </label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={akoolInputClass} placeholder="Text, der gesprochen werden soll…" />
        </>
      )}

      {tab === "changer" && (
        <>
          <label className="flex flex-col gap-2">
            <span className={akoolLabelClass}>Audio-URL</span>
            <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} className={akoolInputClass} placeholder="https://…" />
          </label>
          <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className={akoolInputClass}>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </>
      )}

      <button type="button" disabled={loading} onClick={generate} className={akoolButtonClass}>
        Generieren
      </button>
      {err && <p className="text-sm text-[#ff6b7a]">{err}</p>}
    </AkoolToolShell>
  );
}
