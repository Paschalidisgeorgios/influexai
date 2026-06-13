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

function CanvasMobileStackViewComponent() {
  const nodes = useCanvasStore((s) => s.nodes);

  const sorted = [...nodes].sort((a, b) => {
    const rank = (type?: string) =>
      type === "control" ? 0 : type === "asset" ? 1 : 2;
    const diff = rank(a.type) - rank(b.type);
    if (diff !== 0) return diff;
    return a.position.y - b.position.y;
  });

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
        Wähle ein Tool in der Leiste — dein Workflow erscheint hier als Liste.
      </div>
    );
  }

  return (
    <div className="canvas-mobile-stack h-full overflow-y-auto overscroll-contain px-3 py-4 pb-8">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-6">
        {sorted.map((node) => {
          if (node.type === "control") {
            return (
              <CanvasNodeErrorBoundary key={node.id} fallbackLabel="Steuerung">
                <ControlNode
                  {...mockNodeProps<ControlNodeData, "control">(
                    { id: node.id, data: node.data as ControlNodeData },
                    "control"
                  )}
                />
              </CanvasNodeErrorBoundary>
            );
          }
          if (node.type === "asset") {
            return (
              <CanvasNodeErrorBoundary key={node.id} fallbackLabel="Asset">
                <AssetNode
                  {...mockNodeProps<AssetNodeData, "asset">(
                    { id: node.id, data: node.data as AssetNodeData },
                    "asset"
                  )}
                />
              </CanvasNodeErrorBoundary>
            );
          }
          if (node.type === "brollRecommend") {
            return (
              <CanvasNodeErrorBoundary key={node.id} fallbackLabel="B-Roll">
                <BrollRecommendNode
                  {...mockNodeProps<BrollRecommendNodeData, "brollRecommend">(
                    { id: node.id, data: node.data as BrollRecommendNodeData },
                    "brollRecommend"
                  )}
                />
              </CanvasNodeErrorBoundary>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export const CanvasMobileStackView = memo(CanvasMobileStackViewComponent);
