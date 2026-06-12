import type { AkoolImageToVideoModel } from "@/lib/akool-models";
import { calculateAkoolModelCredits, getDurationsForModel } from "@/lib/akool-models";

export type SzenenFeatureTag =
  | "Start"
  | "End"
  | "Audio"
  | "Referenz"
  | "Multi-Shot"
  | "Multi-Ratio";

export type SzenenModelBadge = "Neu" | "Pro";

export type SzenenGeneratorModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  tags: SzenenFeatureTag[];
  badge?: SzenenModelBadge;
  creditEstimate: string;
  durationLabel: string;
  resolutionLabel: string;
  akool?: AkoolImageToVideoModel;
  apiAvailable: boolean;
};

type CatalogEntry = {
  id: string;
  name: string;
  provider: string;
  description: string;
  tags: SzenenFeatureTag[];
  badge?: SzenenModelBadge;
  creditEstimate: string;
  durationLabel: string;
  resolutionLabel: string;
  matchLabels: string[];
  excludeLabels?: string[];
};

const CATALOG: CatalogEntry[] = [
  {
    id: "seedance-2-0",
    name: "Seedance 2.0",
    provider: "SEEDANCE",
    description: "Hochwertige Bild-zu-Video-Animation mit Audio & Referenz.",
    tags: ["Start", "End", "Audio", "Referenz"],
    creditEstimate: "~1100 Credits",
    durationLabel: "2-10s",
    resolutionLabel: "720p-1080p",
    matchLabels: ["seedance 2.0", "seedance2.0"],
    excludeLabels: ["fast", "lite", "1."],
  },
  {
    id: "seedance-2-0-fast",
    name: "Seedance 2.0 Fast",
    provider: "SEEDANCE",
    description: "Schnellere Variante mit Start-, End- und Referenzbild.",
    tags: ["Start", "End", "Referenz"],
    creditEstimate: "~900 Credits",
    durationLabel: "2-10s",
    resolutionLabel: "720p",
    matchLabels: ["seedance 2.0 fast", "seedance 2 fast", "2.0 fast"],
  },
  {
    id: "seedance-1-5-pro",
    name: "Seedance 1.5 Pro",
    provider: "SEEDANCE",
    description: "Pro-Qualität mit flexiblem Seitenverhältnis.",
    tags: ["Start", "End", "Multi-Ratio"],
    creditEstimate: "~700 Credits",
    durationLabel: "5-10s",
    resolutionLabel: "1080p",
    matchLabels: ["seedance 1.5", "1.5 pro"],
    excludeLabels: ["lite"],
  },
  {
    id: "seedance-1-0-pro",
    name: "Seedance 1.0 Pro",
    provider: "SEEDANCE",
    description: "Zuverlässige Animation mit Start- und Endframe.",
    tags: ["Start", "End"],
    creditEstimate: "~500 Credits",
    durationLabel: "5s",
    resolutionLabel: "720p",
    matchLabels: ["seedance 1.0 pro", "seedance 1 pro", "1.0 pro"],
    excludeLabels: ["lite"],
  },
  {
    id: "seedance-1-0-lite",
    name: "Seedance 1.0 Lite",
    provider: "SEEDANCE",
    description: "Günstiger Einstieg nur mit Startbild.",
    tags: ["Start"],
    creditEstimate: "~200 Credits",
    durationLabel: "5s",
    resolutionLabel: "480p",
    matchLabels: ["seedance 1.0 lite", "seedance 1 lite", "1.0 lite", "lite"],
  },
  {
    id: "hailuo-2-3",
    name: "Hailuo 2.3",
    provider: "MINIMAX",
    description: "Minimax Hailuo mit Audio-Unterstützung.",
    tags: ["Start", "Audio"],
    creditEstimate: "~600 Credits",
    durationLabel: "6s",
    resolutionLabel: "768p",
    matchLabels: ["hailuo 2.3", "hailuo2.3"],
    excludeLabels: ["fast"],
  },
  {
    id: "hailuo-2-3-fast",
    name: "Hailuo 2.3 Fast",
    provider: "MINIMAX",
    description: "Schnelle Minimax-Variante mit Startbild.",
    tags: ["Start"],
    creditEstimate: "~150 Credits",
    durationLabel: "6s",
    resolutionLabel: "768p",
    matchLabels: ["hailuo 2.3 fast", "hailuo fast"],
  },
  {
    id: "kling-3-omni",
    name: "Kling 3.0 Omni",
    provider: "KLING",
    description: "Premium Kling mit Audio und Endframe.",
    tags: ["Start", "End", "Audio"],
    badge: "Pro",
    creditEstimate: "~800 Credits",
    durationLabel: "5-10s",
    resolutionLabel: "1080p",
    matchLabels: ["kling 3", "kling3", "omni"],
  },
  {
    id: "veo-3-1-lite",
    name: "Veo 3.1 Lite",
    provider: "GOOGLE",
    description: "Google Veo Lite für schnelle Szenen.",
    tags: ["Start"],
    creditEstimate: "~200 Credits",
    durationLabel: "8s",
    resolutionLabel: "720p",
    matchLabels: ["veo 3.1", "veo3.1", "veo 3"],
  },
  {
    id: "happyhorse",
    name: "HappyHorse",
    provider: "WEITERE",
    description: "Referenzbasierte Animation mit Startbild.",
    tags: ["Start", "Referenz"],
    creditEstimate: "~500 Credits",
    durationLabel: "5-8s",
    resolutionLabel: "720p",
    matchLabels: ["happyhorse", "happy horse"],
  },
  {
    id: "wan-2-7",
    name: "Wan 2.7",
    provider: "WEITERE",
    description: "Multi-Shot Clips mit Start- und Endframe.",
    tags: ["Start", "End", "Multi-Shot"],
    creditEstimate: "~400 Credits",
    durationLabel: "5s",
    resolutionLabel: "720p",
    matchLabels: ["wan 2.7", "wan2.7", "wan 2"],
  },
];

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesCatalogEntry(
  apiModel: AkoolImageToVideoModel,
  entry: CatalogEntry
): boolean {
  const label = normalizeLabel(apiModel.label);
  const hasMatch = entry.matchLabels.some((key) => label.includes(normalizeLabel(key)));
  if (!hasMatch) return false;
  if (!entry.excludeLabels?.length) return true;
  return !entry.excludeLabels.some((ex) => label.includes(normalizeLabel(ex)));
}

function findApiModel(
  entry: CatalogEntry,
  apiModels: AkoolImageToVideoModel[]
): AkoolImageToVideoModel | undefined {
  return apiModels.find((model) => matchesCatalogEntry(model, entry));
}

function formatCreditEstimate(
  entry: CatalogEntry,
  apiModel?: AkoolImageToVideoModel
): string {
  if (!apiModel) return entry.creditEstimate;
  const resolution = apiModel.resolutionList[0]?.value ?? "720p";
  const durations = getDurationsForModel(apiModel, resolution);
  const duration = durations[durations.length - 1] ?? durations[0] ?? 5;
  const credits = calculateAkoolModelCredits(apiModel, resolution, duration);
  return `~${credits} Credits`;
}

export function mergeSzenenGeneratorModels(
  apiModels: AkoolImageToVideoModel[] = []
): SzenenGeneratorModel[] {
  const usedApiIds = new Set<string>();

  const catalogModels = CATALOG.map((entry) => {
    const akool = findApiModel(entry, apiModels);
    if (akool) usedApiIds.add(akool.value);
    return {
      id: akool?.value ?? entry.id,
      name: akool?.label ?? entry.name,
      provider: entry.provider,
      description: akool?.description ?? entry.description,
      tags: entry.tags,
      badge: entry.badge ?? (akool?.isPro ? "Pro" : undefined),
      creditEstimate: formatCreditEstimate(entry, akool),
      durationLabel: entry.durationLabel,
      resolutionLabel: entry.resolutionLabel,
      akool,
      apiAvailable: Boolean(akool),
    } satisfies SzenenGeneratorModel;
  });

  const extraApiModels = apiModels
    .filter((model) => !usedApiIds.has(model.value))
    .map((model) => {
      const resolution = model.resolutionList[0]?.value ?? "720p";
      const durations = getDurationsForModel(model, resolution);
      const minDur = durations[0] ?? 5;
      const maxDur = durations[durations.length - 1] ?? minDur;
      const durationLabel =
        minDur === maxDur ? `${minDur}s` : `${minDur}-${maxDur}s`;
      const resLabels = model.resolutionList.map((r) => r.label).join("-");

      const tags: SzenenFeatureTag[] = ["Start"];
      if (model.supportedLastFrame) tags.push("End");

      return {
        id: model.value,
        name: model.label,
        provider: model.providerLabel.toUpperCase(),
        description: model.description ?? "Bild-zu-Video Modell",
        tags,
        badge: model.isPro ? ("Pro" as const) : undefined,
        creditEstimate: formatCreditEstimate(
          {
            ...CATALOG[0],
            creditEstimate: "~500 Credits",
          },
          model
        ),
        durationLabel,
        resolutionLabel: resLabels || resolution,
        akool: model,
        apiAvailable: true,
      } satisfies SzenenGeneratorModel;
    });

  return [...catalogModels, ...extraApiModels];
}

export function groupSzenenModelsByProvider(
  models: SzenenGeneratorModel[]
): { provider: string; models: SzenenGeneratorModel[] }[] {
  const order = ["SEEDANCE", "MINIMAX", "KLING", "GOOGLE", "WEITERE"];
  const groups = new Map<string, SzenenGeneratorModel[]>();

  for (const model of models) {
    const list = groups.get(model.provider) ?? [];
    list.push(model);
    groups.set(model.provider, list);
  }

  const known = order
    .filter((key) => groups.has(key))
    .map((provider) => ({ provider, models: groups.get(provider)! }));

  const rest = [...groups.entries()]
    .filter(([key]) => !order.includes(key))
    .map(([provider, modelsInGroup]) => ({ provider, models: modelsInGroup }));

  return [...known, ...rest];
}

export function modelSupportsTag(
  model: SzenenGeneratorModel,
  tag: SzenenFeatureTag
): boolean {
  return model.tags.includes(tag);
}

export function getModelCreditCost(
  model: SzenenGeneratorModel,
  duration: number,
  resolution: string
): number {
  if (model.akool) {
    return calculateAkoolModelCredits(model.akool, resolution, duration);
  }
  const match = model.creditEstimate.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function getDefaultDuration(model: SzenenGeneratorModel): number {
  if (model.akool) {
    const resolution = model.akool.resolutionList[0]?.value;
    const durations = getDurationsForModel(model.akool, resolution);
    return durations[0] ?? 5;
  }
  const match = model.durationLabel.match(/(\d+)/);
  return match ? Number(match[1]) : 5;
}

export function getDefaultResolution(model: SzenenGeneratorModel): string {
  return model.akool?.resolutionList[0]?.value ?? "720p";
}
