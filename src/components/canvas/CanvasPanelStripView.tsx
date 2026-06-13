"use client";

import { memo, useCallback, useMemo, useRef } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import {
  useCanvasStore,
  type AssetNodeData,
  type BrollRecommendNodeData,
  type ControlNodeData,
} from "@/lib/canvas/canvas-store";
import { PipelineContextProvider } from "@/lib/dashboard-v3/PipelineContext";
import { usePipelineStore } from "./PipelineProvider";
import { PipelineConnections } from "@/components/dashboard-v3/PipelineConnections";
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
  const pipeline = usePipelineStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  const sorted = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const rank = (type?: string) =>
        type === "control" ? 0 : type === "asset" ? 1 : 2;
      const diff = rank(a.type) - rank(b.type);
      if (diff !== 0) return diff;
      return a.position.x - b.position.x;
    });
  }, [nodes]);

  const controlPanels = useMemo(
    () => sorted.filter((node) => node.type === "control"),
    [sorted]
  );

  const controlPanelIds = useMemo(
    () => controlPanels.map((node) => node.id),
    [controlPanels]
  );

  const setPanelRef = useCallback(
    (panelId: string, element: HTMLDivElement | null) => {
      if (element) {
        panelRefsMap.current.set(panelId, element);
      } else {
        panelRefsMap.current.delete(panelId);
      }
    },
    []
  );

  const fitToScreen = useCallback(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
        Wähle ein Tool in der Leiste — deine Panels erscheinen hier nebeneinander.
      </div>
    );
  }

  const themeRgb = "204,255,0";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="canvas-panel-strip relative flex h-full gap-4 overflow-x-auto overflow-y-hidden px-6 py-6"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <PipelineConnections
          outputs={pipeline.getAllOutputs()}
          panelRefsMap={panelRefsMap}
          panelIds={controlPanelIds}
          containerRef={scrollRef}
          themeRgb={themeRgb}
        />

        {sorted.map((node) => {
          if (node.type === "control") {
            const panelIndex = controlPanelIds.indexOf(node.id);
            const controlData = node.data as ControlNodeData;

            return (
              <div
                key={node.id}
                ref={(el) => setPanelRef(node.id, el)}
                className="relative z-20 flex h-full flex-shrink-0 overflow-y-auto rounded-2xl"
                style={{
                  width: "clamp(320px, 28vw, 420px)",
                  scrollSnapAlign: "start",
                }}
              >
                <PipelineContextProvider
                  value={{
                    ...pipeline,
                    panelId: node.id,
                    panelIndex,
                    allPanelIds: controlPanelIds,
                    themeRgb,
                  }}
                >
                  <CanvasNodeErrorBoundary fallbackLabel="Steuerung">
                    <ControlNode
                      {...mockNodeProps<ControlNodeData, "control">(
                        { id: node.id, data: controlData },
                        "control"
                      )}
                      embedded
                    />
                  </CanvasNodeErrorBoundary>
                </PipelineContextProvider>
              </div>
            );
          }

          return (
            <div
              key={node.id}
              className="relative z-20 flex h-full flex-shrink-0 overflow-y-auto rounded-2xl"
              style={{
                width: "clamp(320px, 28vw, 420px)",
                scrollSnapAlign: "start",
              }}
            >
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
          );
        })}
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={fitToScreen}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d0d10] text-[14px] text-white/40 transition-all hover:border-white/20 hover:text-white"
          aria-label="Alle Panels zentrieren"
          title="Fit to screen"
        >
          ⊡
        </button>
      </div>
    </div>
  );
}

export const CanvasPanelStripView = memo(CanvasPanelStripViewComponent);
