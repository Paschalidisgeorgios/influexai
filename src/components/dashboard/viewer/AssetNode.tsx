"use client";

/**
 * AssetNode — rendert einen einzelnen generierten Asset im Viewer.
 *
 * Status-Flow: generating → success | error
 * Kein Fake-Progress. Nur echter Status aus dem Store.
 */

import { useCanvasStore, type AssetNodeData } from "@/lib/canvas/canvas-store";
import { TOOL_API_SCHEMA } from "@/lib/canvas/toolApiSchema";
import { AssetLoadingShader } from "./AssetLoadingShader";
import { AssetErrorState } from "./AssetErrorState";
import { AssetReveal } from "./AssetReveal";
import { AssetSharePanel } from "./AssetSharePanel";

interface Props {
  nodeId: string;
  nodeData: AssetNodeData;
}

export function AssetNode({ nodeId, nodeData }: Props) {
  const removeNode = useCanvasStore((s) => s.removeNode);
  const tool = TOOL_API_SCHEMA[nodeData.toolId];
  const accent = tool?.accent ?? "#b4ff00";

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-800/50 bg-zinc-950/80 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{tool?.icon ?? "🎨"}</span>
          <div>
            <p className="text-xs font-semibold text-zinc-200">{tool?.label ?? nodeData.toolId}</p>
            {nodeData.sourcePrompt ? (
              <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-500">
                {nodeData.sourcePrompt}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeNode(nodeId)}
          className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Schließen"
        >
          ×
        </button>
      </div>

      {/* Status bar */}
      {nodeData.status === "processing" || nodeData.status === "loading" ? (
        <div
          className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-800"
          role="progressbar"
        >
          <div
            className="h-full animate-pulse rounded-full"
            style={{ width: "100%", backgroundColor: accent }}
          />
        </div>
      ) : null}

      {/* Content */}
      <div className="flex-1">
        {nodeData.status === "processing" || nodeData.status === "loading" ? (
          <AssetLoadingShader
            progress={nodeData.progress}
            label={nodeData.statusLabel}
          />
        ) : nodeData.status === "error" ? (
          <AssetErrorState message={nodeData.errorMessage} />
        ) : (
          <AssetReveal nodeData={nodeData} />
        )}
      </div>

      {/* Share */}
      {nodeData.status === "success" ? (
        <AssetSharePanel nodeData={nodeData} />
      ) : null}
    </div>
  );
}
