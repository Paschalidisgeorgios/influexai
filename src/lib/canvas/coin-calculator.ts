import type { ToolApiDefinition } from "./toolApiSchema";

export function calculateToolCoins(
  tool: ToolApiDefinition,
  params: Record<string, unknown>
): number {
  let coins = tool.baseCoins;

  if (tool.id === "flux-image") {
    const num = Number(params.num_images ?? 1);
    const highRes = params.aspect_ratio === "16:9" || num > 2;
    if (highRes && tool.highResCoins) coins = tool.highResCoins * num;
    else coins = tool.baseCoins * num;
    return Math.max(coins, tool.baseCoins);
  }

  if (tool.id === "seedance-video") {
    const duration = Number(params.duration ?? 8);
    const audio = params.generate_audio === true;
    const highRes = duration > 10 || audio;
    coins = highRes && tool.highResCoins ? tool.highResCoins : tool.baseCoins;
    if (duration > 10) coins += 2;
    return coins;
  }

  if (tool.id === "lora-training") {
    const steps = Number(params.training_steps ?? 2000);
    if (steps > 2000) coins += Math.ceil((steps - 2000) / 500) * 5;
  }

  return coins;
}
