"use client";

import { memo, useMemo, type CSSProperties } from "react";
import {
  BaseEdge,
  getBezierPath,
  useNodesData,
  type EdgeProps,
} from "@xyflow/react";
import type { AssetNodeData, ControlNodeData } from "@/lib/canvas/canvas-store";

export type LaserPipelineType =
  | "video"
  | "image"
  | "text"
  | "audio"
  | "agent"
  | "calendar"
  | "train";

export type LaserEdgeData = {
  pipelineType?: LaserPipelineType;
};

const LASER_COLORS: Record<LaserPipelineType, string> = {
  video: "#a855f7",
  image: "#39ff14",
  text: "#00f0ff",
  agent: "#00f0ff",
  audio: "#a855f7",
  calendar: "#00f0ff",
  train: "#39ff14",
};

export function getLaserColor(pipelineType?: string): string {
  if (pipelineType && pipelineType in LASER_COLORS) {
    return LASER_COLORS[pipelineType as LaserPipelineType];
  }
  return LASER_COLORS.video;
}

function isControlGenerating(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const node = data as ControlNodeData;
  return node.kind === "control" && node.isGenerating === true;
}

function isAssetProcessing(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const node = data as AssetNodeData;
  return (
    node.kind === "asset" &&
    (node.status === "loading" || node.status === "processing")
  );
}

function LaserEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as LaserEdgeData | undefined;
  const laserColor = getLaserColor(edgeData?.pipelineType);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const connectedNodes = useNodesData([source, target]);
  const isActive = useMemo(() => {
    const sourceData = connectedNodes.find((n) => n.id === source)?.data;
    const targetData = connectedNodes.find((n) => n.id === target)?.data;
    return (
      isControlGenerating(targetData) ||
      isControlGenerating(sourceData) ||
      isAssetProcessing(targetData) ||
      isAssetProcessing(sourceData)
    );
  }, [connectedNodes, source, target]);

  const laserStyle = useMemo(
    () =>
      ({
        "--laser-color": laserColor,
        "--laser-duration": isActive ? "1s" : "2s",
        filter: `drop-shadow(0px 0px 4px ${laserColor}) drop-shadow(0px 0px 10px ${laserColor})`,
      }) as CSSProperties,
    [isActive, laserColor]
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "#1f1f2e",
          strokeWidth: 2,
          opacity: selected ? 1 : 0.9,
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={laserColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="5, 10"
        className="laser-edge-flow"
        style={laserStyle}
      />
    </>
  );
}

export const LaserEdge = memo(LaserEdgeComponent);
