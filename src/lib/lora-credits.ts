import {
  LORA_STEPS_MAX,
  LORA_STEPS_MIN,
} from "@/lib/lora-config";

export const LORA_BASE_CREDITS = 5;
export const LORA_CREDITS_PER_1000_STEPS = 5;

export function calcLoraCredits(steps: number): number {
  const safeSteps = Math.min(
    LORA_STEPS_MAX,
    Math.max(LORA_STEPS_MIN, Math.floor(steps))
  );
  return (
    LORA_BASE_CREDITS +
    Math.ceil(safeSteps / 1000) * LORA_CREDITS_PER_1000_STEPS
  );
}
