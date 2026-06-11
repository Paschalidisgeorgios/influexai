"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ShoppingBag, Upload } from "lucide-react";
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

export default function EcommerceAdsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [productImageUrl, setProductImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [format, setFormat] = useState<"square" | "portrait" | "landscape">("square");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const { generating, elapsedSec, error, startPolling } = useAkoolJobPoll({
    onSuccess: ({ resultUrl: url }) => setResultUrl(url),
  });

  const generate = async () => {
    setErr(null);
    try {
      const res = await fetch("/api/akool/ecommerce-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productImageUrl, backgroundPrompt, format }),
      });
      const data = await res.json();
      if (handleApiInsufficientCredits(res.status, data, AKOOL_TOOL_CREDITS.ecommerceAds)) return;
      if (!res.ok) throw new Error(data.error);
      startPolling(data.jobId, "ecommerceAds");
    } catch (e: unknown) {
      setErr(sanitizeUserMessage(e instanceof Error ? e.message : "Fehler"));
    }
  };

  return (
    <AkoolToolShell
      icon={ShoppingBag}
      title="E-COMMERCE ADS"
      description="Produktfotos in werbefertige Creatives verwandeln."
      creditHint={`${AKOOL_TOOL_CREDITS.ecommerceAds} Credits`}
      generating={generating}
      elapsedSec={elapsedSec}
      result={resultUrl ? (
        <div className="flex flex-1 items-center justify-center p-4">
          {resultUrl.includes(".mp4") || resultUrl.includes("video") ? (
            <video src={resultUrl} controls className="max-h-[480px] w-full rounded-xl" />
          ) : (
            <Image src={resultUrl} alt="Ad" width={512} height={512} unoptimized className="max-h-[480px] rounded-xl object-contain" />
          )}
        </div>
      ) : undefined}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-4 hover:border-[#B4FF00]/40"
      >
        {preview ? (
          <div className="relative h-32 w-32 overflow-hidden rounded-xl">
            <Image src={preview} alt="Produkt" fill unoptimized className="object-cover" />
          </div>
        ) : (
          <><Upload size={24} color="#B4FF00" /><p className="mt-2 text-sm text-zinc-400">Produktbild hochladen</p></>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = (ev) => { const u = ev.target?.result as string; setProductImageUrl(u); setPreview(u); };
          r.readAsDataURL(f);
        }} />
      </div>
      <label className="flex flex-col gap-2">
        <span className={akoolLabelClass}>Hintergrund & Szene</span>
        <textarea value={backgroundPrompt} onChange={(e) => setBackgroundPrompt(e.target.value)} rows={3} className={akoolInputClass} placeholder="Beschreibe den Hintergrund und die Stimmung…" />
      </label>
      <div className="flex flex-wrap gap-2">
        {([
          ["square", "Quadrat 1:1"],
          ["portrait", "Hochformat 9:16"],
          ["landscape", "Querformat 16:9"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setFormat(key)} className={`rounded-xl border px-3 py-2 text-sm ${format === key ? "border-[#B4FF00]/50 bg-[#B4FF00]/10 text-[#B4FF00]" : "border-white/12 text-zinc-300"}`}>
            {label}
          </button>
        ))}
      </div>
      <button type="button" disabled={generating || !productImageUrl || !backgroundPrompt.trim()} onClick={generate} className={akoolButtonClass}>
        Ad generieren
      </button>
      {(err || error) && <p className="text-sm text-[#ff6b7a]">{err || error}</p>}
    </AkoolToolShell>
  );
}
