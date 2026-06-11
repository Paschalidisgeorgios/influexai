"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseKiInfluencerJsonResponse,
  type KiInfluencerApiErrorBody,
} from "@/lib/ki-influencer-client-errors";

const LOG_LINES = [
  "> Lade Trainingsdaten...",
  "> Gesichtspunkte erkannt: 468 Landmarks",
  "> Lichtanalyse läuft...",
  "> Hautstruktur wird kartiert...",
  "> Neuronales Netz: Layer 1/12",
  "> Neuronales Netz: Layer 4/12",
  "> Neuronales Netz: Layer 8/12",
  "> Neuronales Netz: Layer 12/12",
  "> Feinabstimmung läuft...",
  "> Qualitätsprüfung...",
  "> Training abgeschlossen ✓",
] as const;

const LINE_INTERVAL_MS = 1500;
const PROGRESS_DURATION_MS = LOG_LINES.length * LINE_INTERVAL_MS;
const POST_COMPLETE_DELAY_MS = 2000;
const STATUS_POLL_MS = 10_000;

type Props = {
  active: boolean;
  characterId: string;
  fallbackImageUrl?: string | null;
  onComplete: () => void;
};

export function KiInfluencerTrainingVisualizer({
  active,
  characterId,
  fallbackImageUrl = null,
  onComplete,
}: Props) {
  const [trainingImageUrl, setTrainingImageUrl] = useState<string | null>(
    fallbackImageUrl
  );
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setTrainingImageUrl(fallbackImageUrl ?? null);
  }, [fallbackImageUrl]);

  const advanceIfReady = useCallback(async () => {
    if (finishedRef.current) return false;
    try {
      const res = await fetch(`/api/ki-influencer/status/${characterId}`);
      const parsed = await parseKiInfluencerJsonResponse<
        KiInfluencerApiErrorBody & { status?: string }
      >(res);
      if (parsed.data.status === "ready") {
        finishedRef.current = true;
        onCompleteRef.current();
        return true;
      }
    } catch {
      /* keep waiting */
    }
    return false;
  }, [characterId]);

  useEffect(() => {
    if (!active || !characterId) return;

    finishedRef.current = false;
    setVisibleLines([]);
    setProgress(0);

    void (async () => {
      try {
        const res = await fetch(`/api/ki-influencer/character/${characterId}`);
        const parsed = await parseKiInfluencerJsonResponse<
          KiInfluencerApiErrorBody & {
            character?: {
              training_images?: string[];
              casting_image_url?: string | null;
            };
          }
        >(res);
        const images = parsed.data.character?.training_images;
        if (images?.[0]) {
          setTrainingImageUrl(images[0]);
        } else if (parsed.data.character?.casting_image_url) {
          setTrainingImageUrl(parsed.data.character.casting_image_url);
        }
      } catch {
        /* use fallback */
      }
    })();

    void advanceIfReady();

    const progressStart = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - progressStart;
      const pct = Math.min(100, (elapsed / PROGRESS_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(progressTimer);
      }
    }, 50);

    let lineIndex = 0;
    const lineTimer = window.setInterval(() => {
      if (lineIndex < LOG_LINES.length) {
        const line = LOG_LINES[lineIndex]!;
        setVisibleLines((prev) => [...prev, line]);
        lineIndex += 1;
        return;
      }

      window.clearInterval(lineTimer);
      window.setTimeout(() => {
        void advanceIfReady();
      }, POST_COMPLETE_DELAY_MS);
    }, LINE_INTERVAL_MS);

    const pollTimer = window.setInterval(() => {
      void advanceIfReady();
    }, STATUS_POLL_MS);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(lineTimer);
      window.clearInterval(pollTimer);
    };
  }, [active, characterId, advanceIfReady]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleLines]);

  if (!active) return null;

  return (
    <div className="flex flex-col gap-3">
      <style>{`
        @keyframes ki-influencer-scan {
          0% { top: 0; opacity: 1; }
          100% { top: calc(100% - 2px); opacity: 1; }
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-lg">
        <div className="relative max-h-[180px] w-full overflow-hidden rounded-lg bg-[#0a0a0a]">
          {trainingImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trainingImageUrl}
              alt=""
              className="h-[180px] w-full object-cover"
            />
          ) : (
            <div className="h-[180px] w-full bg-white/[0.04]" />
          )}
          <div
            className="pointer-events-none absolute left-0 right-0 h-[2px] bg-[#B4FF00]"
            style={{
              boxShadow: "0 0 12px #B4FF00",
              animation: "ki-influencer-scan 2.5s linear infinite",
            }}
          />
        </div>
      </div>

      <div
        className="h-[3px] w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #B4FF00, #7AB800)",
          }}
        />
      </div>

      <div
        ref={logRef}
        className="max-h-32 overflow-hidden rounded-lg bg-[#0a0a0a] p-3 font-mono text-xs text-[#B4FF00]"
      >
        {visibleLines.map((line, i) => (
          <p key={`${line}-${i}`} className="m-0 leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
