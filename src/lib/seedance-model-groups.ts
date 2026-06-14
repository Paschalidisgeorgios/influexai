import type { ParamOption } from "@/lib/canvas/toolApiSchema";

/** Matches SzenenGeneratorStudio provider section order (Seedance first, then peers). */
export const SEEDANCE_PROVIDER_LABEL_ORDER = [
  "Seedance",
  "Minimax",
  "Kling",
  "Google",
  "OpenAI",
  "Akool",
  "Vidu",
] as const;

export type SeedanceModelGroupOption = {
  value: string;
  label: string;
  provider: string;
  providerLabel: string;
};

export type SeedanceModelOptionGroup = {
  providerLabel: string;
  options: ParamOption[];
};

export function groupSeedanceModelOptionsByProvider(
  models: SeedanceModelGroupOption[]
): SeedanceModelOptionGroup[] {
  const groups = new Map<string, ParamOption[]>();

  for (const model of models) {
    const key = model.providerLabel?.trim() || model.provider?.trim() || "Weitere";
    const list = groups.get(key) ?? [];
    list.push({ value: model.value, label: model.label });
    groups.set(key, list);
  }

  const order = SEEDANCE_PROVIDER_LABEL_ORDER as readonly string[];
  const known = order
    .filter((label) => groups.has(label))
    .map((providerLabel) => ({
      providerLabel,
      options: groups.get(providerLabel)!,
    }));

  const rest = [...groups.entries()]
    .filter(([label]) => !order.includes(label))
    .sort(([a], [b]) => a.localeCompare(b, "de"))
    .map(([providerLabel, options]) => ({ providerLabel, options }));

  return [...known, ...rest];
}
