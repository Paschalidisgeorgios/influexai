"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { getToolDefinition } from "@/lib/canvas/toolApiSchema";
import { calculateToolCoins } from "@/lib/canvas/coin-calculator";
import {
  useCanvasStore,
  type AssetNodeData,
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
import {
  AgentAutopilotNodeExtras,
  AGENT_AI_MODEL_OPTIONS,
} from "./AgentAutopilotNodeExtras";
import { CanvasTopUpOverlay } from "./CanvasTopUpOverlay";
import { CanvasNodeAmbientGlow } from "./CanvasNodeAmbientGlow";
import { useCanvasAnalyticsStore } from "@/lib/canvas/canvas-analytics-store";
import { ViralPredictorPanel } from "@/components/canvas/ViralPredictorPanel";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import {
  appendKeywordToPrompt,
  buildPromptFromParams,
  computeViralPrediction,
  getPrimaryPromptParamKey,
} from "@/utils/viralPredictor";
import type { PremiumBrollSegment } from "@/lib/claude-premium-generate";
import { useOnboardingStore } from "@/lib/canvas/onboarding-store";
import type { ToolParamSchema } from "@/lib/canvas/toolApiSchema";

function isPrimaryParam(field: ToolParamSchema, isAgentAutopilot: boolean): boolean {
  if (isAgentAutopilot && (field.key === "ai_model" || field.key === "reference_image")) {
    return false;
  }
  if (field.type === "textarea") return true;
  if (field.key === "prompt") return true;
  if (field.type === "node-ref" && field.required) return true;
  if (field.type === "string" && field.required) return true;
  return false;
}
import { usePipelineContextOptional } from "@/lib/dashboard-v3/PipelineContext";
import { usePipelineStoreOptional } from "./PipelineProvider";
import {
  buildEffectiveParams,
  resolvePipelineOutput,
} from "@/lib/canvas/pipeline-output";

function isPremiumScriptData(
  data: unknown
): data is { brollSegments: PremiumBrollSegment[]; source?: string } {
  return (
    !!data &&
    typeof data === "object" &&
    Array.isArray((data as { brollSegments?: unknown }).brollSegments) &&
    (data as { brollSegments: unknown[] }).brollSegments.length > 0
  );
}

function ControlNodeComponent({
  id,
  data,
  selected,
  embedded = false,
}: NodeProps<Node<ControlNodeData, "control">> & { embedded?: boolean }) {
  const nodeData = data;
  const tool = getToolDefinition(nodeData.toolId);
  const { credits, addCreditsOptimistic, refreshCredits, showCreditsToast } = useCredits();
  const updateControlParams = useCanvasStore((s) => s.updateControlParams);
  const setControlGenerating = useCanvasStore((s) => s.setControlGenerating);
  const spawnAssetNode = useCanvasStore((s) => s.spawnAssetNode);
  const spawnPremiumVideoTiles = useCanvasStore((s) => s.spawnPremiumVideoTiles);
  const updateAssetNode = useCanvasStore((s) => s.updateAssetNode);
  const closeControlPanel = useCanvasStore((s) => s.closeControlPanel);
  const canvasNodes = useCanvasStore((s) => s.nodes);
  const canvasEdges = useCanvasStore((s) => s.edges);
  const recordGeneration = useCanvasAnalyticsStore((s) => s.recordGeneration);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [pipelineDisconnected, setPipelineDisconnected] = useState<Set<string>>(
    () => new Set()
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const resumeGenerationRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const { profile } = useCreatorProfile();
  const highlightedToolId = useOnboardingStore((s) => s.highlightedToolId);
  const recordCanvasAction = useOnboardingStore((s) => s.recordCanvasAction);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);
  const isHighlighted = highlightedToolId === nodeData.toolId;
  const pipelinePanel = usePipelineContextOptional();
  const pipelineStore = usePipelineStoreOptional();

  const promptText = useMemo(
    () => buildPromptFromParams(nodeData.params, tool?.params ?? []),
    [nodeData.params, tool?.params]
  );

  const promptParamKey = useMemo(
    () => getPrimaryPromptParamKey(tool?.params ?? []),
    [tool?.params]
  );

  const studioContext = useMemo(
    () => ({
      nische: profile?.nische,
      zielgruppe: profile?.zielgruppe,
      plattformen: profile?.plattformen,
      tonalitaet: profile?.tonalitaet,
    }),
    [profile?.nische, profile?.plattformen, profile?.tonalitaet, profile?.zielgruppe]
  );

  const viralPrediction = useMemo(
    () =>
      computeViralPrediction(promptText, studioContext, {
        outputType: tool?.outputType,
        keywordLimit: 3,
      }),
    [promptText, studioContext, tool?.outputType]
  );

  const handleTrendKeyword = useCallback(
    (keyword: string) => {
      if (!promptParamKey) return;
      const current =
        typeof nodeData.params[promptParamKey] === "string"
          ? (nodeData.params[promptParamKey] as string)
          : promptText;
      updateControlParams(id, {
        [promptParamKey]: appendKeywordToPrompt(current, keyword),
      });
    },
    [id, nodeData.params, promptParamKey, promptText, updateControlParams]
  );

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      updateControlParams(id, { [key]: value });
      touchActivity();
      if (typeof value === "string" ? value.trim().length > 0 : value != null && value !== "") {
        recordCanvasAction("params_changed", nodeData.toolId, id);
      }
    },
    [id, nodeData.toolId, recordCanvasAction, touchActivity, updateControlParams]
  );

  const runGenerate = useCallback(async () => {
    if (!tool) return;

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    const generationParams =
      pipelinePanel && tool.params
        ? buildEffectiveParams(
            nodeData.params,
            tool.params,
            pipelinePanel.getInheritedValue,
            pipelinePanel.panelIndex,
            pipelinePanel.allPanelIds,
            pipelineDisconnected
          )
        : nodeData.params;

    const coins = calculateToolCoins(tool, generationParams);
    const creditExempt = isClientCreditExempt();
    let creditsReserved = false;

    setControlGenerating(id, true);
    touchActivity();
    recordCanvasAction("generate_clicked", nodeData.toolId, id);

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
      const result = await runCanvasGeneration(tool, generationParams, {
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

      const pipelineOutput = resolvePipelineOutput(id, tool.id, tool.label, result);
      if (pipelineOutput && pipelineStore) {
        pipelineStore.registerOutput(pipelineOutput);
      }

      if (isPremiumScriptData(result.data)) {
        const assetNode = useCanvasStore.getState().nodes.find((n) => n.id === assetId);
        if (assetNode) {
          spawnPremiumVideoTiles(assetId, result.data.brollSegments, {
            x: assetNode.position.x + 340,
            y: assetNode.position.y,
          });
        }
      }

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
    pipelineDisconnected,
    pipelinePanel,
    pipelineStore,
    recordCanvasAction,
    recordGeneration,
    refreshCredits,
    setControlGenerating,
    showCreditsToast,
    spawnAssetNode,
    spawnPremiumVideoTiles,
    tool,
    touchActivity,
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
  const creditExempt = isClientCreditExempt();
  const insufficient = !creditExempt && credits !== null && remaining < coins;
  const isAgentAutopilot = nodeData.toolId === "agent-autopilot";
  const visibleParams =
    tool?.params.filter(
      (field) =>
        !isAgentAutopilot ||
        (field.key !== "ai_model" && field.key !== "reference_image")
    ) ?? [];
  const aiModel =
    typeof nodeData.params.ai_model === "string"
      ? nodeData.params.ai_model
      : AGENT_AI_MODEL_OPTIONS[0].value;
  const referenceImage =
    typeof nodeData.params.reference_image === "string"
      ? nodeData.params.reference_image
      : undefined;
  const referenceImageName =
    typeof nodeData.params.reference_image_name === "string"
      ? nodeData.params.reference_image_name
      : undefined;

  const hasResult = useMemo(() => {
    const linkedAssetIds = canvasEdges
      .filter((edge) => edge.source === id)
      .map((edge) => edge.target);
    return canvasNodes.some(
      (node) =>
        linkedAssetIds.includes(node.id) &&
        node.type === "asset" &&
        (node.data as AssetNodeData).status === "success"
    );
  }, [canvasEdges, canvasNodes, id]);

  return (
    <div
      className={`relative${embedded ? " h-full w-full" : " w-[90vw] max-w-[360px]"}${isHighlighted ? " canvas-onboarding-pulse" : ""}`}
    >
      {selected ? <CanvasNodeAmbientGlow accentRgb={tool.accentRgb} /> : null}
      <div
        className={`canvas-glass-node rounded-2xl border-zinc-700/80 p-4 shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]${embedded ? " h-full" : ""}`}
        style={{
          boxShadow: `0 0 40px rgba(${tool.accentRgb}, 0.12), 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        {!embedded ? (
          <>
            <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-zinc-600 !bg-zinc-900" />
            <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-zinc-600 !bg-zinc-900" />
          </>
        ) : null}

        <div className="relative mb-3 border-b border-white/[0.06] pb-3">
          <button
            type="button"
            onClick={() => {
              closeControlPanel(id);
              pipelineStore?.removeOutputsForPanels([id]);
            }}
            className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[11px] text-white/40 transition-all hover:bg-white/[0.12] hover:text-white"
            aria-label="Panel schließen"
          >
            ✕
          </button>
          <span
            className="mb-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              borderColor: `rgba(${tool.accentRgb}, 0.35)`,
              color: tool.accent,
              background: `rgba(${tool.accentRgb}, 0.08)`,
            }}
          >
            {tool.category}
          </span>
          <h3 className="pr-8 text-[16px] font-bold text-white">
            {tool.icon} {tool.label}
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-white/40">{tool.description}</p>
        </div>

        <ParamFields
          params={visibleParams.filter((field) => isPrimaryParam(field, isAgentAutopilot))}
          values={nodeData.params}
          accent={tool.accent}
          onChange={handleChange}
          disconnectedFields={pipelineDisconnected}
          onDisconnectField={(key) =>
            setPipelineDisconnected((prev) => new Set(prev).add(key))
          }
          onReconnectField={(key) =>
            setPipelineDisconnected((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            })
          }
          onAssetDrop={(key, asset) => {
            updateControlParams(id, {
              [key]: asset.text ?? asset.url ?? "connected",
            });
          }}
        />

        {(isAgentAutopilot || visibleParams.some((f) => !isPrimaryParam(f, isAgentAutopilot))) ? (
          <>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="mt-3 flex items-center gap-1.5 self-start text-[11px] text-white/30 transition-colors hover:text-white/60"
            >
              <span aria-hidden="true">⚙️</span>
              {showAdvanced ? "Weniger Optionen" : "Erweiterte Einstellungen"}
            </button>

            {showAdvanced ? (
              <div className="mt-3 flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                {isAgentAutopilot ? (
                  <AgentAutopilotNodeExtras
                    aiModel={aiModel}
                    referenceImage={referenceImage}
                    referenceImageName={referenceImageName}
                    accent={tool.accent}
                    onModelChange={(model) => handleChange("ai_model", model)}
                    onReferenceImageChange={(dataUrl, fileName) => {
                      updateControlParams(id, {
                        reference_image: dataUrl,
                        reference_image_name: fileName,
                      });
                    }}
                  />
                ) : null}
                <ParamFields
                  params={visibleParams.filter(
                    (field) => !isPrimaryParam(field, isAgentAutopilot)
                  )}
                  values={nodeData.params}
                  accent={tool.accent}
                  flat
                  onChange={handleChange}
                  disconnectedFields={pipelineDisconnected}
                  onDisconnectField={(key) =>
                    setPipelineDisconnected((prev) => new Set(prev).add(key))
                  }
                  onReconnectField={(key) =>
                    setPipelineDisconnected((prev) => {
                      const next = new Set(prev);
                      next.delete(key);
                      return next;
                    })
                  }
                  onAssetDrop={(key, asset) => {
                    updateControlParams(id, {
                      [key]: asset.text ?? asset.url ?? "connected",
                    });
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {promptParamKey && hasResult ? (
          <ViralPredictorPanel
            prediction={viralPrediction}
            onKeywordClick={handleTrendKeyword}
          />
        ) : null}

        {insufficient && !topUpOpen ? (
          <p className="mt-3 text-[10px] font-medium text-[#ccff00]/80">
            Nicht genug Credits ({remaining}/{coins}) — Top-Up öffnet sich beim Generieren.
          </p>
        ) : null}

        <button
          type="button"
          disabled={nodeData.isGenerating}
          onClick={() => void handleGenerate()}
          className={`mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 ${
            creditExempt
              ? "bg-gradient-to-r from-[#ccff00] to-[#00D5FF] text-black shadow-[0_0_24px_rgba(204,255,0,0.35)]"
              : "text-black"
          }`}
          style={
            creditExempt
              ? { boxShadow: "0 0 0 1px rgba(255,100,0,0.4), 0 0 24px rgba(204,255,0,0.35)" }
              : {
                  background: `linear-gradient(135deg, ${tool.accent}, rgba(${tool.accentRgb}, 0.7))`,
                }
          }
        >
          <Sparkles size={14} />
          {nodeData.isGenerating ? (
            "Generiere…"
          ) : creditExempt ? (
            <>
              Generieren ⚡
              <span className="ml-2 rounded px-1 py-0.5 text-[8px] bg-black/20">ADMIN</span>
            </>
          ) : (
            `Generieren · ${coins} Coins`
          )}
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
