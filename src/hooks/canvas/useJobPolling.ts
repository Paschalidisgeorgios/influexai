"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type JobStatus = "idle" | "processing" | "completed" | "failed";

type StatusResponse = {
  status?: string;
  videoUrl?: string;
  url?: string;
  result?: string;
  generationId?: string;
  error?: string;
  progress?: number;
};

export type JobPollComplete = {
  url: string;
  generationId?: string;
};

export async function pollJobStatus(
  jobId: string,
  statusEndpoint: string,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    signal?: AbortSignal;
    onProgress?: (progress?: number) => void;
  }
): Promise<JobPollComplete> {
  const intervalMs = options?.intervalMs ?? 3000;
  const maxAttempts = options?.maxAttempts ?? 100;
  let attempts = 0;

  while (true) {
    if (options?.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const res = await fetch(
      `${statusEndpoint}?jobId=${encodeURIComponent(jobId)}`,
      { signal: options?.signal }
    );
    const data = (await res.json()) as StatusResponse;

    if (!res.ok) {
      throw new Error(data.error ?? "Status-Abfrage fehlgeschlagen");
    }

    if (data.status === "completed") {
      const url = data.videoUrl ?? data.url ?? data.result;
      if (!url) {
        throw new Error("Video-URL fehlt in der Antwort");
      }
      return { url, generationId: data.generationId };
    }

    if (data.status === "failed") {
      throw new Error(data.error ?? "Generierung fehlgeschlagen");
    }

    options?.onProgress?.(data.progress);
    attempts += 1;
    if (attempts >= maxAttempts) {
      throw new Error("Zeitüberschreitung — bitte erneut versuchen");
    }

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, intervalMs);
      options?.signal?.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true }
      );
    });
  }
}

export function useJobPolling(intervalMs = 3000, maxAttempts = 100) {
  const [status, setStatus] = useState<JobStatus>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(
    async (jobId: string, statusEndpoint: string) => {
      try {
        const res = await fetch(
          `${statusEndpoint}?jobId=${encodeURIComponent(jobId)}`,
          { signal: abortRef.current?.signal }
        );
        const data = (await res.json()) as StatusResponse;

        if (!res.ok) {
          throw new Error(data.error ?? "Status-Abfrage fehlgeschlagen");
        }

        if (data.status === "completed") {
          const url = data.videoUrl ?? data.url ?? data.result ?? null;
          setStatus("completed");
          setResultUrl(url);
          return;
        }

        if (data.status === "failed") {
          setStatus("failed");
          setError(data.error ?? "Generierung fehlgeschlagen");
          return;
        }

        attemptsRef.current += 1;
        if (attemptsRef.current >= maxAttempts) {
          setStatus("failed");
          setError("Zeitüberschreitung — bitte erneut versuchen");
          return;
        }

        timerRef.current = window.setTimeout(() => {
          void poll(jobId, statusEndpoint);
        }, intervalMs);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("failed");
        setError(
          err instanceof Error
            ? err.message
            : "Verbindungsfehler beim Abrufen des Status"
        );
      }
    },
    [intervalMs, maxAttempts]
  );

  const startPolling = useCallback(
    (jobId: string, statusEndpoint: string) => {
      clearTimer();
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      attemptsRef.current = 0;
      setStatus("processing");
      setError(null);
      setResultUrl(null);
      void poll(jobId, statusEndpoint);
    },
    [clearTimer, poll]
  );

  const reset = useCallback(() => {
    clearTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setResultUrl(null);
    setError(null);
  }, [clearTimer]);

  const waitForJob = useCallback(
    async (
      jobId: string,
      statusEndpoint: string,
      signal?: AbortSignal
    ): Promise<JobPollComplete> => {
      reset();
      setStatus("processing");
      setError(null);
      setResultUrl(null);

      try {
        const result = await pollJobStatus(jobId, statusEndpoint, {
          intervalMs,
          maxAttempts,
          signal,
        });
        setStatus("completed");
        setResultUrl(result.url);
        return result;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw err;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Verbindungsfehler beim Abrufen des Status";
        setStatus("failed");
        setError(message);
        throw err;
      }
    },
    [intervalMs, maxAttempts, reset]
  );

  useEffect(
    () => () => {
      clearTimer();
      abortRef.current?.abort();
    },
    [clearTimer]
  );

  return { status, resultUrl, error, startPolling, reset, waitForJob };
}
