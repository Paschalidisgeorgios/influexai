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

/** Fallback when Akool API omits Seedance 2.0 (e.g. missing live key in CI). */
export const SEEDANCE_2_0_FALLBACK: SeedanceModelOption = {
  value: "seedance-2.0",
  label: "Seedance 2.0",
  provider: "seedance",
  providerLabel: "Seedance",
  durationList: [2, 5, 8, 10],
  resolutionList: [
    { value: "720p", label: "720p" },
    { value: "1080p", label: "1080p" },
  ],
};

function hasSeedanceV2Model(models: SeedanceModelOption[]): boolean {
  return models.some((model) => {
    const hay = `${model.label} ${model.value}`.toLowerCase();
    return (
      hay.includes("2.0") ||
      hay.includes(" v2") ||
      hay.includes("-v2") ||
      hay.includes("v2")
    );
  });
}

export function ensureSeedanceModelFallback(
  models: SeedanceModelOption[]
): SeedanceModelOption[] {
  if (models.length === 0) return [SEEDANCE_2_0_FALLBACK];
  if (!hasSeedanceV2Model(models)) return [SEEDANCE_2_0_FALLBACK, ...models];
  return models;
}

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

  const seedanceModels = models.filter(
    (model) =>
      model.provider.toLowerCase() === "seedance" ||
      model.value.toLowerCase().includes("seedance") ||
      model.label.toLowerCase().includes("seedance")
  );

  const pool = seedanceModels.length > 0 ? seedanceModels : models;

  const preferV2 = (model: SeedanceModelOption) => {
    const hay = `${model.label} ${model.value}`.toLowerCase();
    return (
      hay.includes("2.0") ||
      hay.includes(" v2") ||
      hay.includes("-v2") ||
      (hay.includes("seedance") && hay.includes("v2"))
    );
  };

  const v2Model = pool.find(preferV2);
  if (v2Model) return v2Model;

  const fallback = pool.find(
    (model) => model.value === SEEDANCE_2_0_FALLBACK.value
  );
  return fallback ?? pool[0];
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
          const mapped = ensureSeedanceModelFallback(
            (Array.isArray(data.models) ? data.models : [])
              .map(mapApiModel)
              .filter((model): model is SeedanceModelOption => model !== null)
          );
          setModels(mapped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setModels(ensureSeedanceModelFallback([]));
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
