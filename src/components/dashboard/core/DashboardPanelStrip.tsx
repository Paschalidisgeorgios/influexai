"use client";

/**
 * DashboardPanelStrip — Haupt-Render-Engine des Dashboards.
 *
 * Rendert Control-Panels (Tool-Eingabe) und Asset-Viewer (generierte Medien)
 * als horizontalen Strip. Keine ReactFlow-Abhängigkeit — reines React.
 */

import { memo } from "react";
import { useCanvasStore, type ControlNodeData, type AssetNodeData } from "@/lib/canvas/canvas-store";
import { DashboardNodeErrorBoundary } from "./DashboardNodeErrorBoundary";
import { ToolControlPanel } from "@/components/dashboard/tools/ToolControlPanel";
import { AssetNode } from "@/components/dashboard/viewer/AssetNode";
import { BrollRecommendViewer } from "@/components/dashboard/viewer/BrollRecommendViewer";

export const DashboardPanelStrip = memo(DashboardPanelStripComponent);

function DashboardPanelStripComponent() {
  const nodes = useCanvasStore((s) => s.nodes);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-600">Wähle ein Tool aus der Sidebar</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full gap-3 overflow-x-auto overflow-y-hidden px-4 py-4">
      {nodes.map((node) => (
        <DashboardNodeErrorBoundary key={node.id}>
          {node.data.kind === "control" ? (
            <div className="h-full w-[380px] shrink-0">
              <ToolControlPanel
                nodeId={node.id}
                nodeData={node.data as ControlNodeData}
              />
            </div>
          ) : node.data.kind === "asset" ? (
            <div className="h-full w-[380px] shrink-0">
              <AssetNode
                nodeId={node.id}
                nodeData={node.data as AssetNodeData}
              />
            </div>
          ) : node.data.kind === "broll-recommend" ? (
            <div className="h-full w-[380px] shrink-0">
              <BrollRecommendViewer nodeId={node.id} />
            </div>
          ) : null}
        </DashboardNodeErrorBoundary>
      ))}
    </div>
  );
}
