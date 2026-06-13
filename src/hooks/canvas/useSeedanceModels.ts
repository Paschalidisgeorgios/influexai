"use client";

import { useEffect, useState } from "react";

export type SeedanceModelOption = {
  value: string;
  label: string;
  durationList: number[];
  resolutionList: Array<{ value: string; label: string }>;
};

type ModelsResponse = {
  models?: SeedanceModelOption[];
  error?: string;
};

export function pickDefaultSeedanceModel(
  models: SeedanceModelOption[]
): SeedanceModelOption | undefined {
  if (models.length === 0) return undefined;
  const seedanceMatch = models.find(
    (model) =>
      model.value.toLowerCase().includes("seedance") ||
      model.label.toLowerCase().includes("seedance")
  );
  return seedanceMatch ?? models[0];
}

export function pickDefaultSeedanceResolution(
  model: SeedanceModelOption | undefined
): string | undefined {
  if (!model?.resolutionList.length) return undefined;
  const preferred = model.resolutionList.find(
    (item) => item.value.toLowerCase() === "720p"
  );
  return preferred?.value ?? model.resolutionList[0]?.value;
}

export function useSeedanceModels() {
  const [models, setModels] = useState<SeedanceModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/seedance/models");
        const data = (await res.json()) as ModelsResponse;
        if (!res.ok) {
          throw new Error(data.error ?? "Modellliste konnte nicht geladen werden");
        }
        if (!cancelled) {
          setModels(Array.isArray(data.models) ? data.models : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setModels([]);
          setError(
            err instanceof Error ? err.message : "Modellliste konnte nicht geladen werden"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { models, loading, error };
}
