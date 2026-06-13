"use client";

import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { getToolDefinition, type ToolId } from "./toolApiSchema";
import { canConnect, applyConnectionToParams } from "./connection-rules";

export type NodeKind = "control" | "asset";

export interface ControlNodeData {
  kind: "control";
  toolId: ToolId;
  params: Record<string, unknown>;
  isGenerating: boolean;
  linkedAssetId?: string;
  [key: string]: unknown;
}

export type AssetNodeStatus = "loading" | "processing" | "success" | "error";

export interface AssetOutput {
  outputType: string;
  label: string;
  text?: string;
  url?: string;
  previewUrl?: string;
  data?: unknown;
}

export interface AssetNodeData extends AssetOutput {
  kind: "asset";
  toolId: ToolId;
  createdAt: number;
  status: AssetNodeStatus;
  progress?: number;
  /** Original generation prompt from the linked control node */
  sourcePrompt?: string;
  /** User-facing error when status === "error" */
  errorMessage?: string;
  [key: string]: unknown;
}

export type CanvasNodeData = ControlNodeData | AssetNodeData;

export type CanvasNode = Node<CanvasNodeData>;
export type CanvasEdge = Edge;

interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewportCenter: { x: number; y: number };
  spawnOffset: number;
  setViewportCenter: (center: { x: number; y: number }) => void;
  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<CanvasEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  spawnControlNode: (toolId: ToolId, position?: { x: number; y: number }) => string;
  spawnAssetNode: (
    toolId: ToolId,
    output: AssetOutput & {
      status?: AssetNodeStatus;
      progress?: number;
      sourcePrompt?: string;
    },
    position?: { x: number; y: number },
    linkFromControlId?: string
  ) => string;
  updateAssetNode: (
    nodeId: string,
    patch: Partial<
      Pick<
        AssetNodeData,
        | "status"
        | "progress"
        | "text"
        | "url"
        | "previewUrl"
        | "data"
        | "label"
        | "outputType"
        | "sourcePrompt"
        | "errorMessage"
      >
    >
  ) => void;
  updateControlParams: (nodeId: string, params: Record<string, unknown>) => void;
  setControlGenerating: (nodeId: string, isGenerating: boolean) => void;
  removeNode: (nodeId: string) => void;
  spawnFollowUp: (assetNodeId: string, followUpToolId: ToolId) => string;
  applyDropConnection: (
    sourceAssetId: string,
    targetControlId: string,
    paramKey: string
  ) => void;
}

function defaultParams(toolId: ToolId): Record<string, unknown> {
  const tool = getToolDefinition(toolId);
  if (!tool) return {};
  const params: Record<string, unknown> = {};
  for (const p of tool.params) {
    if (p.defaultValue !== undefined) params[p.key] = p.defaultValue;
    else if (p.type === "boolean") params[p.key] = false;
    else if (p.type === "slider" || p.type === "number") params[p.key] = p.min ?? 0;
    else if (p.type === "multiselect") params[p.key] = p.defaultValue ?? [];
    else params[p.key] = "";
  }
  return params;
}

function laserEdge(
  id: string,
  source: string,
  target: string,
  pipelineType: string
): CanvasEdge {
  return {
    id,
    source,
    target,
    type: "laser",
    data: { pipelineType },
  };
}

function nextSpawnPosition(state: CanvasState, position?: { x: number; y: number }) {
  const offset = state.spawnOffset * 40;
  const nextOffset = (state.spawnOffset + 1) % 12;
  const pos =
    position ?? {
      x: state.viewportCenter.x - 180 + offset,
      y: state.viewportCenter.y - 120 + offset,
    };
  state.spawnOffset = nextOffset;
  return pos;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  viewportCenter: { x: 400, y: 300 },
  spawnOffset: 0,

  setViewportCenter: (center) => set({ viewportCenter: center }),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) as CanvasNode[] }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const source = nodes.find((n) => n.id === connection.source);
    const target = nodes.find((n) => n.id === connection.target);
    if (!source || !target || source.data.kind !== "asset" || target.data.kind !== "control") return;

    const tool = getToolDefinition(target.data.toolId);
    if (!tool) return;

    const assetData = source.data as AssetNodeData;
    const param = tool.params.find((p) => p.acceptsOutputTypes?.length);
    if (!param || !canConnect(assetData.outputType as never, param.acceptsOutputTypes)) return;

    const value = applyConnectionToParams(param.key, {
      type: assetData.outputType as never,
      text: assetData.text,
      url: assetData.url,
      data: assetData.data,
    });

    set({
      edges: addEdge(
        laserEdge(
          `e-${connection.source}-${connection.target}`,
          connection.source!,
          connection.target!,
          assetData.outputType
        ),
        edges
      ),
      nodes: nodes.map((n) =>
        n.id === target.id
          ? {
              ...n,
              data: {
                ...n.data,
                params: { ...(n.data as ControlNodeData).params, [param.key]: value },
              },
            }
          : n
      ),
    });
  },

  spawnControlNode: (toolId, position) => {
    const id = `control-${toolId}-${Date.now()}`;
    const state = get();
    const pos = nextSpawnPosition(state, position);
    set({ spawnOffset: state.spawnOffset });
    const node: CanvasNode = {
      id,
      type: "control",
      position: pos,
      data: {
        kind: "control",
        toolId,
        params: defaultParams(toolId),
        isGenerating: false,
      },
    };
    set((s) => ({ nodes: [...s.nodes, node] }));
    return id;
  },

  spawnAssetNode: (toolId, output, position, linkFromControlId) => {
    const id = `asset-${toolId}-${Date.now()}`;
    const src = linkFromControlId ? get().nodes.find((n) => n.id === linkFromControlId) : null;
    const pos =
      position ??
      (src
        ? { x: src.position.x + 420, y: src.position.y }
        : nextSpawnPosition(get(), undefined));

    const { status, progress, sourcePrompt, ...outputFields } = output;
    const nodeData: AssetNodeData = {
      kind: "asset",
      toolId,
      createdAt: Date.now(),
      ...outputFields,
      status: status ?? "success",
      progress,
      sourcePrompt,
    };
    const node: CanvasNode = {
      id,
      type: "asset",
      position: pos,
      data: nodeData,
    };

    set((s) => ({
      nodes: [
        ...s.nodes.map((n) =>
          n.id === linkFromControlId
            ? { ...n, data: { ...n.data, linkedAssetId: id } as ControlNodeData }
            : n
        ),
        node,
      ],
      edges: linkFromControlId
        ? [
            ...s.edges,
            laserEdge(
              `e-${linkFromControlId}-${id}`,
              linkFromControlId,
              id,
              getToolDefinition(toolId)?.outputType ?? "video"
            ),
          ]
        : s.edges,
    }));
    return id;
  },

  updateAssetNode: (nodeId, patch) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId && n.data.kind === "asset"
          ? { ...n, data: { ...n.data, ...patch } as AssetNodeData }
          : n
      ),
    }),

  updateControlParams: (nodeId, params) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId && n.data.kind === "control"
          ? { ...n, data: { ...n.data, params: { ...n.data.params, ...params } } }
          : n
      ),
    }),

  setControlGenerating: (nodeId, isGenerating) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId && n.data.kind === "control"
          ? { ...n, data: { ...n.data, isGenerating } }
          : n
      ),
    }),

  removeNode: (nodeId) =>
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }),

  spawnFollowUp: (assetNodeId, followUpToolId) => {
    const asset = get().nodes.find((n) => n.id === assetNodeId);
    if (!asset) return get().spawnControlNode(followUpToolId);
    const pos = { x: asset.position.x + 420, y: asset.position.y + 40 };
    const controlId = get().spawnControlNode(followUpToolId, pos);
    const assetData = asset.data as AssetNodeData;
    const tool = getToolDefinition(followUpToolId);
    const param = tool?.params.find((p) =>
      p.acceptsOutputTypes?.includes(assetData.outputType as never)
    );
    if (param) {
      get().applyDropConnection(assetNodeId, controlId, param.key);
    }
    return controlId;
  },

  applyDropConnection: (sourceAssetId, targetControlId, paramKey) => {
    const { nodes } = get();
    const source = nodes.find((n) => n.id === sourceAssetId);
    const target = nodes.find((n) => n.id === targetControlId);
    if (!source || !target || source.data.kind !== "asset" || target.data.kind !== "control") return;

    const assetData = source.data as AssetNodeData;
    const value = applyConnectionToParams(paramKey, {
      type: assetData.outputType as never,
      text: assetData.text,
      url: assetData.url,
      data: assetData.data,
    });

    set({
      nodes: nodes.map((n) =>
        n.id === targetControlId
          ? {
              ...n,
              data: {
                ...n.data,
                params: { ...(n.data as ControlNodeData).params, [paramKey]: value },
              },
            }
          : n
      ),
      edges: [
        ...get().edges.filter(
          (e) => !(e.source === sourceAssetId && e.target === targetControlId)
        ),
        laserEdge(
          `e-${sourceAssetId}-${targetControlId}-${paramKey}`,
          sourceAssetId,
          targetControlId,
          assetData.outputType
        ),
      ],
    });
  },
}));
