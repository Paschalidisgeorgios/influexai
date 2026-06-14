"use client";

import { useEffect, useState } from "react";
import { groupSeedanceModelOptionsByProvider } from "@/lib/seedance-model-groups";

export type SeedanceModelOption = {
  value: string;
  label: string;
  provider: string;
  providerLabel: string;
  durationList: number[];
  resolutionList: Array<{ value: string; label: string }>;
};

type AkoolModelApiEntry = {
  value?: string;
  label?: string;
  provider?: string;
  providerLabel?: string;
  durationList?: number[];
  resolutionList?: Array<{ value: string; label: string }>;
};

type ModelsResponse = {
  models?: AkoolModelApiEntry[];
  error?: string;
};

function mapApiModel(raw: AkoolModelApiEntry): SeedanceModelOption | null {
  const value = raw.value?.trim() ?? "";
  const label = raw.label?.trim() ?? "";
  if (!value || !label) return null;

  return {
    value,
    label,
    provider: raw.provider?.trim() ?? "",
    providerLabel: raw.providerLabel?.trim() || raw.provider?.trim() || "Weitere",
    durationList: Array.isArray(raw.durationList) ? raw.durationList : [],
    resolutionList: Array.isArray(raw.resolutionList)
      ? raw.resolutionList.map((item) => ({
          value: item.value,
          label: item.label || item.value,
        }))
      : [],
  };
}

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

export { groupSeedanceModelOptionsByProvider };

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
          const mapped = (Array.isArray(data.models) ? data.models : [])
            .map(mapApiModel)
            .filter((model): model is SeedanceModelOption => model !== null);
          setModels(mapped);
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
