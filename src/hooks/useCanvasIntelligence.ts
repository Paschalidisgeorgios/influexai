"use client";

import { useEffect, useMemo, useRef } from "react";
import { useCanvasStore, type AssetNodeData, type CanvasNode } from "@/lib/canvas/canvas-store";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { fetchBrollMatches, isScriptAsset } from "@/utils/brollSearch";
import { loadImageDataFromUrl } from "@/utils/thumbnailAnalyzer";
import { useThumbnailCtrStore } from "@/lib/canvas/thumbnail-ctr-store";

const ADJACENCY_THRESHOLD = 420;

function isImageAsset(node: CanvasNode): node is CanvasNode & { data: AssetNodeData } {
  return (
    node.data.kind === "asset" &&
    node.data.outputType === "image" &&
    node.data.status === "success" &&
    !!(node.data.url || node.data.previewUrl)
  );
}

function areAdjacent(
  a: { position: { x: number; y: number } },
  b: { position: { x: number; y: number } }
): boolean {
  const dx = Math.abs(a.position.x - b.position.x);
  const dy = Math.abs(a.position.y - b.position.y);
  return dx < ADJACENCY_THRESHOLD && dy < ADJACENCY_THRESHOLD;
}

function findComparePair(
  imageNodes: { id: string; selected?: boolean; position: { x: number; y: number } }[]
): [string, string] | null {
  const selected = imageNodes.filter((n) => n.selected);
  if (selected.length === 2) {
    return [selected[0]!.id, selected[1]!.id];
  }

  for (let i = 0; i < imageNodes.length; i++) {
    for (let j = i + 1; j < imageNodes.length; j++) {
      if (areAdjacent(imageNodes[i]!, imageNodes[j]!)) {
        return [imageNodes[i]!.id, imageNodes[j]!.id];
      }
    }
  }
  return null;
}

export function useCanvasIntelligence() {
  const nodes = useCanvasStore((s) => s.nodes);
  const { profile } = useCreatorProfile();
  const spawnBrollRecommendNodes = useCanvasStore((s) => s.spawnBrollRecommendNodes);
  const removeBrollForSource = useCanvasStore((s) => s.removeBrollForSource);

  const processedBrollRef = useRef<Set<string>>(new Set());
  const brollAbortRef = useRef<AbortController | null>(null);

  const setAnalyzing = useThumbnailCtrStore((s) => s.setAnalyzing);
  const setRating = useThumbnailCtrStore((s) => s.setRating);
  const setCompare = useThumbnailCtrStore((s) => s.setCompare);
  const clearNode = useThumbnailCtrStore((s) => s.clearNode);

  const workerRef = useRef<Worker | null>(null);
  const analyzedRef = useRef<Set<string>>(new Set());
  const pendingCompareRef = useRef<[string, string] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const worker = new Worker(
      new URL("@/workers/thumbnail-analyzer.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === "analyzed") {
        setRating(msg.id, msg.rating);
        const pair = pendingCompareRef.current;
        if (pair && (pair[0] === msg.id || pair[1] === msg.id)) {
          const ratings = useThumbnailCtrStore.getState().ratings;
          const a = ratings[pair[0]];
          const b = ratings[pair[1]];
          if (a?.score && b?.score && !a.analyzing && !b.analyzing) {
            worker.postMessage({
              type: "compare",
              idA: pair[0],
              ratingA: a,
              idB: pair[1],
              ratingB: b,
            });
          }
        }
      }
      if (msg.type === "compared") {
        setCompare(msg.winnerId, msg.loserId, msg.deltaPercent, msg.reason);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [setCompare, setRating]);

  const scriptAssets = useMemo(
    () =>
      nodes.filter(
        (n): n is CanvasNode & { data: AssetNodeData } =>
          n.data.kind === "asset" &&
          n.data.status === "success" &&
          isScriptAsset(n.data.toolId, n.data.outputType, n.data.text)
      ),
    [nodes]
  );

  const imageNodes = useMemo(() => nodes.filter(isImageAsset), [nodes]);

  const comparePairKey = useMemo(() => {
    const pair = findComparePair(imageNodes);
    return pair ? `${pair[0]}:${pair[1]}` : null;
  }, [imageNodes]);

  useEffect(() => {
    for (const node of scriptAssets) {
      if (processedBrollRef.current.has(node.id)) continue;
      const text = node.data.text;
      if (!text?.trim()) continue;

      const assetData = node.data.data;
      if (
        assetData &&
        typeof assetData === "object" &&
        (assetData as { source?: string }).source === "claude-premium"
      ) {
        processedBrollRef.current.add(node.id);
        continue;
      }

      processedBrollRef.current.add(node.id);
      brollAbortRef.current?.abort();
      const controller = new AbortController();
      brollAbortRef.current = controller;

      void (async () => {
        try {
          const matches = await fetchBrollMatches(text, {
            niche: profile?.nische,
            limit: 3,
            signal: controller.signal,
          });
          if (controller.signal.aborted || matches.length === 0) return;

          removeBrollForSource(node.id);
          spawnBrollRecommendNodes(node.id, matches, {
            x: node.position.x + 340,
            y: node.position.y,
          });
        } catch {
          processedBrollRef.current.delete(node.id);
        }
      })();
    }
  }, [scriptAssets, profile?.nische, removeBrollForSource, spawnBrollRecommendNodes]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const activeIds = new Set(imageNodes.map((n) => n.id));
    for (const id of analyzedRef.current) {
      if (!activeIds.has(id)) {
        analyzedRef.current.delete(id);
        clearNode(id);
      }
    }

    for (const node of imageNodes) {
      if (analyzedRef.current.has(node.id)) continue;
      analyzedRef.current.add(node.id);
      setAnalyzing(node.id, true);

      const url = node.data.previewUrl ?? node.data.url;
      if (!url) continue;
      void loadImageDataFromUrl(url, 128).then((imageData) => {
        if (!imageData) {
          analyzedRef.current.delete(node.id);
          clearNode(node.id);
          return;
        }
        worker.postMessage(
          {
            type: "analyze",
            id: node.id,
            buffer: imageData.data.buffer,
            width: imageData.width,
            height: imageData.height,
          },
          [imageData.data.buffer]
        );
      });
    }
  }, [imageNodes, clearNode, setAnalyzing]);

  useEffect(() => {
    if (!comparePairKey) {
      pendingCompareRef.current = null;
      return;
    }
    const [idA, idB] = comparePairKey.split(":");
    pendingCompareRef.current = [idA!, idB!];

    const ratings = useThumbnailCtrStore.getState().ratings;
    const a = ratings[idA!];
    const b = ratings[idB!];
    if (a?.score && b?.score && !a.analyzing && !b.analyzing && workerRef.current) {
      workerRef.current.postMessage({
        type: "compare",
        idA: idA,
        ratingA: a,
        idB: idB,
        ratingB: b,
      });
    }
  }, [comparePairKey]);
}
