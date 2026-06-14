"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeUserMessage } from "@/lib/sanitize-user-message";

type PollSuccess = {
  resultUrl: string;
  generationId?: string;
};

type UseAkoolJobPollOptions = {
  onSuccess?: (data: PollSuccess) => void;
};

const MAX_ATTEMPTS = 100; // ~5 min at 3s interval

export function useAkoolJobPoll(options?: UseAkoolJobPollOptions) {
  const [generating, setGenerating] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const onSuccessRef = useRef(options?.onSuccess);

  useEffect(() => {
    onSuccessRef.current = options?.onSuccess;
  }, [options?.onSuccess]);

  const stopTimers = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimers(), [stopTimers]);

  const pollOnce = useCallback(
    async (jobId: string, pollType: string) => {
      const res = await fetch(
        `/api/akool/status?jobId=${encodeURIComponent(jobId)}&type=${encodeURIComponent(pollType)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Status-Abfrage fehlgeschlagen");

      if (data.status === "completed" && (data.resultUrl || data.videoUrl)) {
        stopTimers();
        setGenerating(false);
        onSuccessRef.current?.({
          resultUrl: (data.resultUrl ?? data.videoUrl) as string,
          generationId: data.generationId as string | undefined,
        });
        window.dispatchEvent(new CustomEvent("credits-updated"));
        return true;
      }

      if (data.status === "failed") {
        stopTimers();
        setGenerating(false);
        const refundNote = data.refunded ? " Credits wurden zurückerstattet." : "";
        setError(
          sanitizeUserMessage(
            (data.error ?? "Generierung fehlgeschlagen") + refundNote
          )
        );
        window.dispatchEvent(new CustomEvent("credits-updated"));
        return true;
      }

      return false;
    },
    [stopTimers]
  );

  const startPolling = useCallback(
    (jobId: string, pollType: string) => {
      stopTimers();
      attemptsRef.current = 0;
      setGenerating(true);
      setElapsedSec(0);
      setError(null);
      elapsedRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);

      const tick = async () => {
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          stopTimers();
          setGenerating(false);
          setError("Zeitüberschreitung — bitte erneut versuchen.");
          return;
        }

        try {
          await pollOnce(jobId, pollType);
        } catch (err: unknown) {
          stopTimers();
          setGenerating(false);
          setError(
            sanitizeUserMessage(
              err instanceof Error ? err.message : "Generierung fehlgeschlagen"
            )
          );
        }
      };

      void tick();
      pollRef.current = setInterval(() => void tick(), 3000);
    },
    [pollOnce, stopTimers]
  );

  return {
    generating,
    elapsedSec,
    error,
    setError,
    startPolling,
    stopTimers,
    setGenerating,
  };
}
