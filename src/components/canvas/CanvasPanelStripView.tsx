"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const panelStripItemClass =
  "relative z-20 flex h-full w-full shrink-0 snap-center overflow-y-auto rounded-2xl md:w-[clamp(320px,28vw,420px)] md:snap-start";

function CanvasPanelStripViewComponent() {
  const nodes = useCanvasStore((s) => s.nodes);
  const pipeline = usePipelineStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const panelObserverRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);

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

  const registerPanelRef = useCallback(
    (panelId: string, element: HTMLDivElement | null, isControl: boolean) => {
      if (isControl) {
        if (element) {
          panelRefsMap.current.set(panelId, element);
        } else {
          panelRefsMap.current.delete(panelId);
        }
      }
      if (element) {
        panelObserverRefs.current.set(panelId, element);
      } else {
        panelObserverRefs.current.delete(panelId);
      }
    },
    []
  );

  const fitToScreen = useCallback(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      sorted.length === 0 ? 0 : Math.min(current, sorted.length - 1)
    );
  }, [sorted.length]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || sorted.length === 0) return;

    const panelIndexById = new Map(sorted.map((node, index) => [node.id, index]));

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const panelId = entry.target.getAttribute("data-panel-id");
          if (!panelId) continue;
          const index = panelIndexById.get(panelId);
          if (index === undefined) continue;
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }

        if (bestIndex >= 0) {
          setActiveIndex(bestIndex);
        }
      },
      {
        root: scrollEl,
        threshold: [0.35, 0.5, 0.65, 0.85, 1],
      }
    );

    for (const node of sorted) {
      const element = panelObserverRefs.current.get(node.id);
      if (element) {
        element.setAttribute("data-panel-id", node.id);
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [sorted]);

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
        className="canvas-panel-strip relative flex h-full snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-6 py-6"
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
                ref={(el) => registerPanelRef(node.id, el, true)}
                className={panelStripItemClass}
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
              ref={(el) => registerPanelRef(node.id, el, false)}
              className={panelStripItemClass}
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

      {sorted.length > 1 ? (
        <div
          className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 gap-1.5 md:hidden"
          aria-hidden
        >
          {sorted.map((panel, i) => (
            <div
              key={panel.id}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-[#B4FF00]" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      ) : null}

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
