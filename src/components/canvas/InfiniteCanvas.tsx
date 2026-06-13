"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type EdgeTypes,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import type { Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/styles/canvas.css";
import { useCanvasStore, type AssetNodeData, type ControlNodeData, type BrollRecommendNodeData } from "@/lib/canvas/canvas-store";
import { useCanvasShortcuts } from "@/hooks/useCanvasShortcuts";
import { ControlNode } from "./ControlNode";
import { AssetNode } from "./AssetNode";
import { BrollRecommendNode } from "./BrollRecommendNode";
import { CanvasIntelligenceBridge } from "./CanvasIntelligenceBridge";
import { LaserEdge } from "./LaserEdge";
import { CanvasShortcutsHelp } from "./CanvasShortcutsHelp";
import { CanvasAnalyticsPanel } from "./CanvasAnalyticsPanel";
import { CanvasNodeErrorBoundary } from "./CanvasNodeErrorBoundary";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";

const SafeControlNode = memo(function SafeControlNode(
  props: NodeProps<Node<ControlNodeData, "control">>
) {
  return (
    <CanvasNodeErrorBoundary fallbackLabel="Steuerung">
      <ControlNode {...props} />
    </CanvasNodeErrorBoundary>
  );
});

const SafeAssetNode = memo(function SafeAssetNode(
  props: NodeProps<Node<AssetNodeData, "asset">>
) {
  return (
    <CanvasNodeErrorBoundary fallbackLabel="Asset">
      <AssetNode {...props} />
    </CanvasNodeErrorBoundary>
  );
});

const SafeBrollRecommendNode = memo(function SafeBrollRecommendNode(
  props: NodeProps<Node<BrollRecommendNodeData, "brollRecommend">>
) {
  return (
    <CanvasNodeErrorBoundary fallbackLabel="B-Roll">
      <BrollRecommendNode {...props} />
    </CanvasNodeErrorBoundary>
  );
});

const nodeTypes: NodeTypes = {
  control: SafeControlNode,
  asset: SafeAssetNode,
  brollRecommend: SafeBrollRecommendNode,
};

const edgeTypes: EdgeTypes = {
  laser: LaserEdge,
};

export function InfiniteCanvas() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const setViewportCenter = useCanvasStore((s) => s.setViewportCenter);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);
  const { spacePressed, helpOpen, setHelpOpen, onPaneMouseMove } = useCanvasShortcuts();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "laser" as const,
    }),
    []
  );

  const handlePaneMouseMove = useCallback(
    (event: React.MouseEvent) => {
      touchActivity();
      onPaneMouseMove(event);
    },
    [onPaneMouseMove, touchActivity]
  );

  const handlePaneClick = useCallback(() => {
    touchActivity();
  }, [touchActivity]);

  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      touchActivity();
      const cx = (-viewport.x + window.innerWidth / 2) / viewport.zoom;
      const cy = (-viewport.y + window.innerHeight / 2) / viewport.zoom;
      setViewportCenter({ x: cx, y: cy });
    },
    [setViewportCenter, touchActivity]
  );

  useEffect(() => {
    setViewportCenter({ x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 80 });
  }, [setViewportCenter]);

  return (
    <div
      className={`canvas-flow relative h-full w-full${
        spacePressed ? " canvas-flow--space-pan" : ""
      }`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onPaneMouseMove={handlePaneMouseMove}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView={false}
        minZoom={0.2}
        maxZoom={2}
        panOnScroll
        panOnDrag={false}
        panActivationKeyCode="Space"
        selectionOnDrag
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
        />
        <Controls showInteractive={false} position="bottom-right" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === "control") return "rgba(183,255,0,0.4)";
            if (n.type === "brollRecommend") return "rgba(204,255,0,0.35)";
            return "rgba(0,213,255,0.4)";
          }}
          maskColor="rgba(0,0,0,0.75)"
          className="!rounded-xl !border !border-zinc-800/60 !bg-zinc-950/80"
        />
        <CanvasIntelligenceBridge />
      </ReactFlow>
      <CanvasShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
      <div className="pointer-events-none absolute inset-0 z-20">
        <CanvasAnalyticsPanel open={analyticsOpen} onOpenChange={setAnalyticsOpen} />
      </div>
    </div>
  );
}
