"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import {
  useCanvasStore,
  type AssetNodeData,
  type BrollRecommendNodeData,
  type ControlNodeData,
} from "@/lib/canvas/canvas-store";
import { ControlNode } from "./ControlNode";
import { AssetNode } from "./AssetNode";
import { BrollRecommendNode } from "./BrollRecommendNode";
import { CanvasNodeErrorBoundary } from "./CanvasNodeErrorBoundary";

function mockNodeProps<T extends Record<string, unknown>, TNodeType extends string>(
  node: { id: string; data: T; type?: string },
  type: TNodeType
): NodeProps<Node<T, TNodeType>> {
  return {
    id: node.id,
    type,
    data: node.data,
    selected: false,
    dragging: false,
    draggable: false,
    selectable: false,
    deletable: false,
    isConnectable: false,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as NodeProps<Node<T, TNodeType>>;
}

function CanvasPanelStripViewComponent() {
  const nodes = useCanvasStore((s) => s.nodes);

  const sorted = [...nodes].sort((a, b) => {
    const rank = (type?: string) =>
      type === "control" ? 0 : type === "asset" ? 1 : 2;
    const diff = rank(a.type) - rank(b.type);
    if (diff !== 0) return diff;
    return a.position.x - b.position.x;
  });

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
        Wähle ein Tool in der Leiste — deine Panels erscheinen hier nebeneinander.
      </div>
    );
  }

  return (
    <div
      className="canvas-panel-strip flex h-full gap-4 overflow-x-auto overflow-y-hidden px-6 py-6"
      style={{ scrollSnapType: "x mandatory" }}
    >
      {sorted.map((node) => (
        <div
          key={node.id}
          className="flex h-full flex-shrink-0 overflow-y-auto rounded-2xl"
          style={{
            width: "clamp(320px, 30vw, 460px)",
            scrollSnapAlign: "start",
          }}
        >
          {node.type === "control" ? (
            <CanvasNodeErrorBoundary fallbackLabel="Steuerung">
              <ControlNode
                {...mockNodeProps<ControlNodeData, "control">(
                  { id: node.id, data: node.data as ControlNodeData },
                  "control"
                )}
                embedded
              />
            </CanvasNodeErrorBoundary>
          ) : null}
          {node.type === "asset" ? (
            <CanvasNodeErrorBoundary fallbackLabel="Asset">
              <AssetNode
                {...mockNodeProps<AssetNodeData, "asset">(
                  { id: node.id, data: node.data as AssetNodeData },
                  "asset"
                )}
              />
            </CanvasNodeErrorBoundary>
          ) : null}
          {node.type === "brollRecommend" ? (
            <CanvasNodeErrorBoundary fallbackLabel="B-Roll">
              <BrollRecommendNode
                {...mockNodeProps<BrollRecommendNodeData, "brollRecommend">(
                  { id: node.id, data: node.data as BrollRecommendNodeData },
                  "brollRecommend"
                )}
              />
            </CanvasNodeErrorBoundary>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export const CanvasPanelStripView = memo(CanvasPanelStripViewComponent);
