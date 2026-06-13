import type { ToolApiDefinition } from "./toolApiSchema";
import { calculateCanvasToolCoins } from "./tool-credit-costs";

export function calculateToolCoins(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): number {
  return calculateCanvasToolCoins(tool, params);
}
