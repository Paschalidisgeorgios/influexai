import type { AgentOutputs } from "@/lib/agent/types";
import type { AssetNodeData } from "@/lib/canvas/canvas-store";
import { getToolDefinition, type ToolId } from "@/lib/canvas/toolApiSchema";

type SpawnAssetNode = (
  toolId: ToolId,
  output: Partial<AssetNodeData> & Pick<AssetNodeData, "outputType" | "label">,
  position?: { x: number; y: number },
  linkFromControlId?: string
) => string;

export function spawnAgentOutputAssets(
  outputs: AgentOutputs,
  controlId: string,
  anchor: { x: number; y: number },
  spawnAssetNode: SpawnAssetNode,
  spawnIndex: { current: number }
): void {
  const spawns: Array<{ toolId: ToolId; output: Parameters<SpawnAssetNode>[1] }> = [];

  if (outputs.image?.imageUrl) {
    spawns.push({
      toolId: "flux-image",
      output: {
        outputType: "image",
        label: getToolDefinition("flux-image")?.outputDescription ?? "Generiertes Bild",
        status: "success",
        progress: 100,
        url: outputs.image.imageUrl,
        previewUrl: outputs.image.imageUrl,
        text: outputs.image.prompt ?? outputs.image.improvedPrompt,
      },
    });
  }

  if (outputs.video?.videoUrl) {
    spawns.push({
      toolId: "seedance-video",
      output: {
        outputType: "video",
        label: getToolDefinition("seedance-video")?.outputDescription ?? "Generiertes Video",
        status: "success",
        progress: 100,
        url: outputs.video.videoUrl,
        previewUrl: outputs.video.videoUrl,
        text: outputs.video.motionPrompt,
      },
    });
  }

  if (outputs.productPreview?.imageUrl) {
    spawns.push({
      toolId: "produkt-werbung",
      output: {
        outputType: "image",
        label:
          getToolDefinition("produkt-werbung")?.outputDescription ?? "Produkt-Vorschau",
        status: "success",
        progress: 100,
        url: outputs.productPreview.imageUrl,
        previewUrl: outputs.productPreview.imageUrl,
        text: outputs.productPreview.productName,
      },
    });
  }

  for (const spawn of spawns) {
    spawnIndex.current += 1;
    spawnAssetNode(
      spawn.toolId,
      spawn.output,
      { x: anchor.x + 340 * spawnIndex.current, y: anchor.y },
      controlId
    );
  }
}
