"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { getToolDefinition } from "@/lib/canvas/toolApiSchema";
import { calculateToolCoins } from "@/lib/canvas/coin-calculator";
import {
  useCanvasStore,
  type ControlNodeData,
} from "@/lib/canvas/canvas-store";
import { useCredits } from "@/components/credits/BuyCreditsProvider";
import { isClientCreditExempt } from "@/lib/client-credits-ui";
import { runCanvasGeneration } from "@/lib/canvas/canvas-generate-client";
import {
  shouldRefundCredits,
  userMessageForCanvasError,
} from "@/lib/canvas/canvas-api-errors";
import { ParamFields } from "./ParamFields";
import { CanvasTopUpOverlay } from "./CanvasTopUpOverlay";
import { useCanvasAnalyticsStore } from "@/lib/canvas/canvas-analytics-store";

function ControlNodeComponent({ id, data }: NodeProps<Node<ControlNodeData, "control">>) {
  const nodeData = data;
  const tool = getToolDefinition(nodeData.toolId);
  const { credits, addCreditsOptimistic, refreshCredits, showCreditsToast } = useCredits();
  const updateControlParams = useCanvasStore((s) => s.updateControlParams);
  const setControlGenerating = useCanvasStore((s) => s.setControlGenerating);
  const spawnAssetNode = useCanvasStore((s) => s.spawnAssetNode);
  const updateAssetNode = useCanvasStore((s) => s.updateAssetNode);
  const recordGeneration = useCanvasAnalyticsStore((s) => s.recordGeneration);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const resumeGenerationRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleChange = useCallback(
    (key: string, value: unknown) => updateControlParams(id, { [key]: value }),
    [id, updateControlParams]
  );

  const runGenerate = useCallback(async () => {
    if (!tool) return;

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    const coins = calculateToolCoins(tool, nodeData.params);
    const creditExempt = isClientCreditExempt();
    let creditsReserved = false;

    setControlGenerating(id, true);

    const assetId = spawnAssetNode(
      nodeData.toolId,
      {
        outputType: tool.outputType,
        label: tool.outputDescription,
        status: "loading",
        progress: 0,
        sourcePrompt:
          typeof nodeData.params.prompt === "string"
            ? nodeData.params.prompt
            : undefined,
      },
      undefined,
      id
    );

    if (!creditExempt && tool.apiRoute) {
      addCreditsOptimistic(-coins);
      creditsReserved = true;
    }

    let progress = 0;
    const progressTimer = window.setInterval(() => {
      progress = Math.min(92, progress + 4 + Math.random() * 6);
      updateAssetNode(assetId, {
        progress,
        status: progress >= 55 ? "processing" : "loading",
      });
    }, 180);

    try {
      const result = await runCanvasGeneration(tool, nodeData.params, {
        signal: abortController.signal,
      });

      updateAssetNode(assetId, {
        status: "success",
        progress: 100,
        errorMessage: undefined,
        text: result.text,
        url: result.url,
        previewUrl: result.previewUrl,
        data: result.data,
      });

      recordGeneration({
        toolId: tool.id,
        toolLabel: tool.label,
        toolIcon: tool.icon,
        creditsUsed: coins,
        prompt: typeof nodeData.params.prompt === "string" ? nodeData.params.prompt : undefined,
      });

      void fetch("/api/canvas/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: tool.id,
          creditsUsed: coins,
          prompt: nodeData.params.prompt,
        }),
      }).catch(() => undefined);

      void refreshCredits();
    } catch (err) {
      if (abortController.signal.aborted) return;

      const message = userMessageForCanvasError(err);
      if (creditsReserved && shouldRefundCredits(err)) {
        addCreditsOptimistic(coins);
      }

      updateAssetNode(assetId, {
        status: "error",
        progress: 0,
        errorMessage: message,
      });

      showCreditsToast(message, "error");
      void refreshCredits();
    } finally {
      window.clearInterval(progressTimer);
      setControlGenerating(id, false);
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }
    }
  }, [
    addCreditsOptimistic,
    id,
    nodeData.params,
    nodeData.toolId,
    recordGeneration,
    refreshCredits,
    setControlGenerating,
    showCreditsToast,
    spawnAssetNode,
    tool,
    updateAssetNode,
  ]);

  const handleGenerate = async () => {
    if (!tool || nodeData.isGenerating) return;

    const cost = calculateToolCoins(tool, nodeData.params);
    const balance = credits ?? 0;

    if (!isClientCreditExempt() && credits !== null && balance < cost) {
      resumeGenerationRef.current = true;
      setTopUpOpen(true);
      return;
    }

    await runGenerate();
  };

  const handleTopUpSuccess = useCallback(
    (newBalance: number) => {
      setTopUpOpen(false);

      if (!tool) return;
      const cost = calculateToolCoins(tool, nodeData.params);

      if (resumeGenerationRef.current && newBalance >= cost) {
        resumeGenerationRef.current = false;
        void runGenerate();
      } else {
        resumeGenerationRef.current = false;
      }
    },
    [nodeData.params, runGenerate, tool]
  );

  const handleTopUpClose = useCallback(() => {
    setTopUpOpen(false);
    resumeGenerationRef.current = false;
  }, []);

  if (!tool) return null;

  const coins = calculateToolCoins(tool, nodeData.params);
  const remaining = credits ?? 0;
  const insufficient = credits !== null && remaining < coins;

  return (
    <div className="relative w-[min(340px,90vw)]">
      <div
        className="rounded-2xl border border-zinc-800/50 bg-zinc-950/60 p-4 shadow-2xl backdrop-blur-xl"
        style={{
          boxShadow: `0 0 40px rgba(${tool.accentRgb}, 0.12), 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-zinc-600 !bg-zinc-900" />
        <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-zinc-600 !bg-zinc-900" />

        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <span
              className="mb-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                borderColor: `rgba(${tool.accentRgb}, 0.35)`,
                color: tool.accent,
                background: `rgba(${tool.accentRgb}, 0.08)`,
              }}
            >
              {tool.category}
            </span>
            <h3 className="text-sm font-semibold text-white">
              {tool.icon} {tool.label}
            </h3>
            <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{tool.description}</p>
          </div>
        </div>

        <ParamFields
          params={tool.params}
          values={nodeData.params}
          accent={tool.accent}
          onChange={handleChange}
          onAssetDrop={(key, asset) => {
            updateControlParams(id, {
              [key]: asset.text ?? asset.url ?? "connected",
            });
          }}
        />

        {insufficient && !topUpOpen ? (
          <p className="mt-3 text-[10px] font-medium text-[#ccff00]/80">
            Nicht genug Credits ({remaining}/{coins}) — Top-Up öffnet sich beim Generieren.
          </p>
        ) : null}

        <button
          type="button"
          disabled={nodeData.isGenerating}
          onClick={() => void handleGenerate()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-black transition-transform hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${tool.accent}, rgba(${tool.accentRgb}, 0.7))`,
          }}
        >
          <Sparkles size={14} />
          {nodeData.isGenerating ? "Generiere…" : `Generieren · ${coins} Coins`}
        </button>
      </div>

      <CanvasTopUpOverlay
        open={topUpOpen}
        required={coins}
        remaining={remaining}
        toolLabel={tool.label}
        onClose={handleTopUpClose}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
}

export const ControlNode = memo(ControlNodeComponent);
