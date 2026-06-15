"use client";

/**
 * DashboardProvider — zentraler React-State für das Dashboard.
 *
 * DESIGN-PRINZIPIEN:
 * - Kein Event-Emitter. Reiner React-Context + Zustand-Store.
 * - Tools und Viewer sind via Context verbunden, nicht via Props-Drilling.
 * - Der Provider ist der einzige Kanal für: aktives Tool, Assets, Generating-Status.
 *
 * ARCHITEKTUR:
 * - Der Canvas-Zustand (Assets, Nodes, Edges) liegt im Zustand-Store (lib/canvas/canvas-store.ts).
 * - Dieser Context stellt einen typsicheren, React-idiomatischen Zugang bereit.
 * - Jedes Tool liest/schreibt über useDashboard() — kein direkter Store-Zugriff aus Tools.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useCanvasStore, type AssetNodeData, type ControlNodeData } from "@/lib/canvas/canvas-store";
import type { ToolId } from "@/lib/canvas/toolApiSchema";

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface DashboardAsset extends AssetNodeData {
  id: string;
}

export interface DashboardContextValue {
  /** Alle Assets auf dem Board, neueste zuerst */
  assets: DashboardAsset[];
  /** Setzt den aktiven Tool-Knoten (löst Spawn aus wenn nicht vorhanden) */
  activateTool: (toolId: ToolId) => void;
  /** Gibt true zurück wenn irgendein Tool gerade generiert */
  isAnyGenerating: boolean;
  /** Gibt den ControlNode-State für ein bestimmtes Tool zurück */
  getToolState: (toolId: ToolId) => ControlNodeData | null;
  /** Aktualisiert Parameter eines Tools */
  updateToolParam: (nodeId: string, key: string, value: unknown) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DashboardProvider({ children }: { children: ReactNode }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const spawnControlNode = useCanvasStore((s) => s.spawnControlNode);
  const updateControlParams = useCanvasStore((s) => s.updateControlParams);

  const assets = useMemo<DashboardAsset[]>(() => {
    return nodes
      .filter((n) => n.type === "asset")
      .map((n) => ({ id: n.id, ...(n.data as AssetNodeData) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [nodes]);

  const isAnyGenerating = useMemo(
    () =>
      nodes.some(
        (n) => n.type === "control" && (n.data as ControlNodeData).isGenerating
      ),
    [nodes]
  );

  const activateTool = useCallback(
    (toolId: ToolId) => {
      const existing = nodes.find(
        (n) => n.type === "control" && (n.data as ControlNodeData).toolId === toolId
      );
      if (!existing) spawnControlNode(toolId);
    },
    [nodes, spawnControlNode]
  );

  const getToolState = useCallback(
    (toolId: ToolId): ControlNodeData | null => {
      const node = nodes.find(
        (n) => n.type === "control" && (n.data as ControlNodeData).toolId === toolId
      );
      return node ? (node.data as ControlNodeData) : null;
    },
    [nodes]
  );

  const updateToolParam = useCallback(
    (nodeId: string, key: string, value: unknown) => {
      updateControlParams(nodeId, { [key]: value });
    },
    [updateControlParams]
  );

  const value = useMemo<DashboardContextValue>(
    () => ({ assets, activateTool, isAnyGenerating, getToolState, updateToolParam }),
    [assets, activateTool, isAnyGenerating, getToolState, updateToolParam]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard muss innerhalb von <DashboardProvider> verwendet werden");
  }
  return ctx;
}
