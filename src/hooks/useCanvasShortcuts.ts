"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useKeyPress, useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "@/lib/canvas/canvas-store";
import { isEditableTarget } from "@/lib/canvas/is-editable-target";
import type { ToolId } from "@/lib/canvas/toolApiSchema";

export function useCanvasShortcuts() {
  const mouseFlowRef = useRef<{ x: number; y: number } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const spacePressed = useKeyPress("Space");

  const { fitView, screenToFlowPosition, getNodes, getEdges, deleteElements } =
    useReactFlow();
  const spawnControlNode = useCanvasStore((s) => s.spawnControlNode);
  const viewportCenter = useCanvasStore((s) => s.viewportCenter);

  const getSpawnPosition = useCallback(() => {
    return (
      mouseFlowRef.current ?? {
        x: viewportCenter.x - 140,
        y: viewportCenter.y - 80,
      }
    );
  }, [viewportCenter]);

  const fitViewAll = useCallback(() => {
    if (getNodes().length === 0) return;
    void fitView({ padding: 0.18, duration: 480, maxZoom: 1.15 });
  }, [fitView, getNodes]);

  const deleteSelection = useCallback(() => {
    const selectedNodes = getNodes().filter((n) => n.selected);
    const selectedEdges = getEdges().filter((e) => e.selected);
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    void deleteElements({ nodes: selectedNodes, edges: selectedEdges });
  }, [deleteElements, getEdges, getNodes]);

  const spawnTool = useCallback(
    (toolId: ToolId) => {
      spawnControlNode(toolId, getSpawnPosition());
    },
    [getSpawnPosition, spawnControlNode]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(document.activeElement)) return;

      if (e.code === "Space") {
        e.preventDefault();
        return;
      }

      if (e.repeat) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen((open) => !open);
        return;
      }

      if (e.key === "Escape" && helpOpen) {
        e.preventDefault();
        setHelpOpen(false);
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "1" || key === "f") {
        e.preventDefault();
        fitViewAll();
        return;
      }

      if (key === "v") {
        e.preventDefault();
        spawnTool("seedance-video");
        return;
      }

      if (key === "i") {
        e.preventDefault();
        spawnTool("flux-image");
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelection, fitViewAll, helpOpen, spawnTool]);

  const onPaneMouseMove = useCallback(
    (event: ReactMouseEvent) => {
      mouseFlowRef.current = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
    },
    [screenToFlowPosition]
  );

  return {
    spacePressed,
    helpOpen,
    setHelpOpen,
    onPaneMouseMove,
  };
}
