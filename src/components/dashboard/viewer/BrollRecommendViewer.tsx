"use client";

import { useCanvasStore } from "@/lib/canvas/canvas-store";

interface Props {
  nodeId: string;
}

export function BrollRecommendViewer({ nodeId }: Props) {
  const removeNode = useCanvasStore((s) => s.removeNode);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-zinc-800/50 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-200">B-Roll Empfehlungen</p>
        <button
          type="button"
          onClick={() => removeNode(nodeId)}
          className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
        >
          ×
        </button>
      </div>
      <p className="text-xs text-zinc-500">B-Roll Viewer — in Entwicklung</p>
    </div>
  );
}
