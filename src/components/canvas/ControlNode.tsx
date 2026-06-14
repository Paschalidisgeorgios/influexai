"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import { getToolDefinition } from "@/lib/canvas/toolApiSchema";
import { calculateToolCoins } from "@/lib/canvas/coin-calculator";
import {
  useCanvasStore,
  type AssetNodeData,
  type ControlNodeData,
} from "@/lib/canvas/canvas-store";
import { useCredits } from "@/components/credits/BuyCreditsProvider";
import { isClientCreditExempt } from "@/lib/client-credits-ui";
import {
  runCanvasGeneration,
  validateSeedanceParams,
  validateKiIchParams,
  CANVAS_ASYNC_JOB_START_TIMEOUT_MS,
} from "@/lib/canvas/canvas-generate-client";
import {
  shouldRefundCredits,
  userMessageForCanvasError,
} from "@/lib/canvas/canvas-api-errors";
import { shouldPostCanvasAnalytics } from "@/lib/canvas/canvas-analytics-record";
import Link from "next/link";
import { ParamFields, type ParamFieldOverride } from "./ParamFields";
import {
  pickDefaultSeedanceModel,
  pickDefaultSeedanceResolution,
  groupSeedanceModelOptionsByProvider,
  useSeedanceModels,
} from "@/hooks/canvas/useSeedanceModels";
import { useJobPolling } from "@/hooks/canvas/useJobPolling";
import { useKiInfluencerCharacters } from "@/hooks/canvas/useKiInfluencerCharacters";
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
import { consumeAgentStream } from "@/lib/agent/consumeAgentStream";
import type { AgentChatMessage, AgentOutputs } from "@/lib/agent/types";
import { parseAgentResponse, type ParsedToolCall } from "@/lib/agent/parseAgentResponse";
import { spawnAgentOutputAssets } from "@/lib/canvas/spawn-agent-output-assets";
import { AgentCanvasFollowUpPanel } from "./AgentCanvasFollowUpPanel";
import { openNoCreditsModal } from "@/lib/client-credits-ui";

function isPrimaryParam(
  field: ToolParamSchema,
  isAgentAutopilot: boolean,
  toolId?: string
): boolean {
  if (isAgentAutopilot && field.key === "platforms") return true;
  if (
    toolId === "seedance-video" &&
    (field.key === "modelId" || field.key === "images_list")
  ) {
    return true;
  }
  if (toolId === "ki-ich" && field.key === "characterId") {
    return true;
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
  const [seedanceValidationError, setSeedanceValidationError] = useState<string | null>(
    null
  );
  const [kiIchValidationError, setKiIchValidationError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<AgentChatMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [followUpRunning, setFollowUpRunning] = useState(false);
  const [latestToolCalls, setLatestToolCalls] = useState<ParsedToolCall[]>([]);
  const resumeGenerationRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const agentPrimaryAssetIdRef = useRef<string | null>(null);
  const agentOutputSpawnIndexRef = useRef(0);
  const chatHistoryRef = useRef<AgentChatMessage[]>([]);
  const { profile } = useCreatorProfile();
  const highlightedToolId = useOnboardingStore((s) => s.highlightedToolId);
  const recordCanvasAction = useOnboardingStore((s) => s.recordCanvasAction);
  const touchActivity = useOnboardingStore((s) => s.touchActivity);
  const isHighlighted = highlightedToolId === nodeData.toolId;
  const pipelinePanel = usePipelineContextOptional();
  const pipelineStore = usePipelineStoreOptional();
  const isSeedanceTool = nodeData.toolId === "seedance-video";
  const isKiIchTool = nodeData.toolId === "ki-ich";
  const seedanceModels = useSeedanceModels();
  const kiInfluencerCharacters = useKiInfluencerCharacters();
  const jobPolling = useJobPolling();

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  const seedanceFieldOverrides = useMemo((): Record<string, ParamFieldOverride> | undefined => {
    if (!isSeedanceTool) return undefined;

    const modelOptionGroups = groupSeedanceModelOptionsByProvider(seedanceModels.models);
    const selectedModel = seedanceModels.models.find(
      (model) => model.value === nodeData.params.modelId
    );
    const resolutionOptions =
      selectedModel?.resolutionList.map((item) => ({
        value: item.value,
        label: item.label,
      })) ?? [];

    return {
      modelId: {
        optionGroups: modelOptionGroups,
        placeholder: seedanceModels.loading ? "Lade Modelle…" : "Modell wählen",
        disabled: seedanceModels.loading || seedanceModels.models.length === 0,
      },
      resolution: {
        options: resolutionOptions,
        disabled: resolutionOptions.length === 0,
      },
    };
  }, [isSeedanceTool, nodeData.params.modelId, seedanceModels.loading, seedanceModels.models]);

  const kiIchFieldOverrides = useMemo((): Record<string, ParamFieldOverride> | undefined => {
    if (!isKiIchTool) return undefined;

    const characterOptions = kiInfluencerCharacters.characters.map((character) => ({
      value: character.id,
      label: character.name,
    }));

    return {
      characterId: {
        options: characterOptions,
        placeholder: kiInfluencerCharacters.loading
          ? "Lade Avatare…"
          : characterOptions.length === 0
            ? "Kein trainierter Avatar"
            : "Avatar wählen",
        disabled:
          kiInfluencerCharacters.loading || characterOptions.length === 0,
      },
    };
  }, [
    isKiIchTool,
    kiInfluencerCharacters.characters,
    kiInfluencerCharacters.loading,
  ]);

  const fieldOverrides = seedanceFieldOverrides ?? kiIchFieldOverrides;

  useEffect(() => {
    if (
      !isKiIchTool ||
      kiInfluencerCharacters.loading ||
      kiInfluencerCharacters.characters.length === 0
    ) {
      return;
    }

    const currentCharacterId =
      typeof nodeData.params.characterId === "string"
        ? nodeData.params.characterId
        : "";

    if (!currentCharacterId) {
      const first = kiInfluencerCharacters.characters[0];
      if (first) {
        updateControlParams(id, { characterId: first.id });
      }
    }
  }, [
    id,
    isKiIchTool,
    kiInfluencerCharacters.characters,
    kiInfluencerCharacters.loading,
    nodeData.params.characterId,
    updateControlParams,
  ]);

  useEffect(() => {
    if (!isSeedanceTool || seedanceModels.loading || seedanceModels.models.length === 0) {
      return;
    }

    const patches: Record<string, unknown> = {};
    const currentModelId =
      typeof nodeData.params.modelId === "string" ? nodeData.params.modelId : "";

    if (!currentModelId) {
      const defaultModel = pickDefaultSeedanceModel(seedanceModels.models);
      if (defaultModel) patches.modelId = defaultModel.value;
    }

    const effectiveModelId =
      typeof patches.modelId === "string" ? patches.modelId : currentModelId;
    const model = seedanceModels.models.find((item) => item.value === effectiveModelId);
    const currentResolution =
      typeof nodeData.params.resolution === "string" ? nodeData.params.resolution : "";
    const resolutionValid = model?.resolutionList.some(
      (item) => item.value === currentResolution
    );

    if (model && !resolutionValid) {
      const defaultResolution = pickDefaultSeedanceResolution(model);
      if (defaultResolution) patches.resolution = defaultResolution;
    }

    if (Object.keys(patches).length > 0) {
      updateControlParams(id, patches);
    }
  }, [
    id,
    isSeedanceTool,
    nodeData.params.modelId,
    nodeData.params.resolution,
    seedanceModels.loading,
    seedanceModels.models,
    updateControlParams,
  ]);

  useEffect(() => {
    if (!isSeedanceTool) {
      jobPolling.reset();
      setSeedanceValidationError(null);
    }
    if (!isKiIchTool) {
      setKiIchValidationError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when leaving tool only
  }, [isSeedanceTool, isKiIchTool]);

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

    if (tool.id === "seedance-video") {
      const validationError = validateSeedanceParams(generationParams);
      if (validationError) {
        setSeedanceValidationError(validationError);
        showCreditsToast(validationError, "error");
        return;
      }
      setSeedanceValidationError(null);
    }

    if (tool.id === "ki-ich") {
      const validationError = validateKiIchParams(generationParams);
      if (validationError) {
        setKiIchValidationError(validationError);
        showCreditsToast(validationError, "error");
        return;
      }
      setKiIchValidationError(null);
    }

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

    const isAgentAutopilot = tool.id === "agent-autopilot";
    let progressTimer: number | undefined;

    if (isAgentAutopilot) {
      updateAssetNode(assetId, {
        progress: 5,
        status: "loading",
        statusLabel: "Agent startet…",
      });
    } else {
      let progress = 0;
      progressTimer = window.setInterval(() => {
        progress = Math.min(92, progress + 4 + Math.random() * 6);
        updateAssetNode(assetId, {
          progress,
          status: progress >= 55 ? "processing" : "loading",
        });
      }, 180);
    }

    let agentProgress = 5;
    let agentToolStartCount = 0;

    try {
      const result = await runCanvasGeneration(tool, generationParams, {
        signal: abortController.signal,
        timeoutMs:
          tool.id === "seedance-video"
            ? CANVAS_ASYNC_JOB_START_TIMEOUT_MS
            : undefined,
        onProgress: isAgentAutopilot
          ? (event) => {
              if (event.type === "tool_start") {
                agentToolStartCount += 1;
                agentProgress = Math.min(85, 15 + agentToolStartCount * 15);
                updateAssetNode(assetId, {
                  progress: agentProgress,
                  status: "processing",
                  statusLabel: event.label ? `${event.label}…` : "Agent arbeitet…",
                });
              } else if (event.type === "tool_done") {
                agentProgress = Math.min(90, agentProgress + 5);
                updateAssetNode(assetId, { progress: agentProgress });
              } else if (event.type === "tool_error") {
                updateAssetNode(assetId, {
                  statusLabel: `Fehler bei ${event.tool ?? "Tool"}`,
                });
              }
            }
          : undefined,
      });

      let finalUrl = result.url;

      if (tool.id === "seedance-video" && result.jobId) {
        updateAssetNode(assetId, { status: "processing", progress: 35 });
        const polled = await jobPolling.waitForJob(
          result.jobId,
          "/api/seedance/status",
          abortController.signal
        );
        finalUrl = polled.url;
      }

      updateAssetNode(assetId, {
        status: "success",
        progress: 100,
        statusLabel: undefined,
        errorMessage: undefined,
        text: result.text,
        url: finalUrl,
        previewUrl: result.previewUrl ?? finalUrl,
        data: result.data,
      });

      const pipelineOutput = resolvePipelineOutput(id, tool.id, tool.label, {
        ...result,
        url: finalUrl,
      });
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

      if (isAgentAutopilot) {
        const userMessage =
          typeof generationParams.campaign_goal === "string"
            ? generationParams.campaign_goal.trim()
            : promptText;

        if (userMessage && result.text) {
          setChatHistory([
            { role: "user", content: userMessage },
            { role: "assistant", content: result.text },
          ]);
          setLatestToolCalls(parseAgentResponse(result.text).toolCalls);
        }

        agentPrimaryAssetIdRef.current = assetId;
        agentOutputSpawnIndexRef.current = 0;

        if (result.data && typeof result.data === "object") {
          const assetNode = useCanvasStore.getState().nodes.find((n) => n.id === assetId);
          if (assetNode) {
            spawnAgentOutputAssets(
              result.data as AgentOutputs,
              id,
              assetNode.position,
              spawnAssetNode,
              agentOutputSpawnIndexRef
            );
          }
        }
      }

      let analyticsCredits = 0;
      if (shouldPostCanvasAnalytics(tool.id)) {
        try {
          const analyticsRes = await fetch("/api/canvas/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolId: tool.id,
              params: generationParams,
              prompt:
                typeof generationParams.prompt === "string"
                  ? generationParams.prompt
                  : undefined,
            }),
          });
          if (analyticsRes.ok) {
            const analyticsJson = (await analyticsRes.json()) as { creditsUsed?: number };
            if (typeof analyticsJson.creditsUsed === "number") {
              analyticsCredits = analyticsJson.creditsUsed;
            }
          }
        } catch {
          // Analytics persistence is best-effort; generation already succeeded.
        }
      }

      recordGeneration({
        toolId: tool.id,
        toolLabel: tool.label,
        toolIcon: tool.icon,
        creditsUsed: analyticsCredits,
        prompt:
          typeof generationParams.prompt === "string"
            ? generationParams.prompt
            : undefined,
      });

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
      if (progressTimer !== undefined) {
        window.clearInterval(progressTimer);
      }
      setControlGenerating(id, false);
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }
    }
  }, [
    addCreditsOptimistic,
    id,
    jobPolling,
    nodeData.params,
    nodeData.toolId,
    pipelineDisconnected,
    pipelinePanel,
    pipelineStore,
    promptText,
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

  const sendFollowUp = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || followUpRunning || tool?.id !== "agent-autopilot") return;

      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      setFollowUpRunning(true);
      setFollowUpInput("");

      const primaryAssetId = agentPrimaryAssetIdRef.current;
      const history = chatHistoryRef.current;

      if (primaryAssetId) {
        updateAssetNode(primaryAssetId, {
          status: "loading",
          progress: 5,
          statusLabel: "Agent startet…",
          text: "",
          errorMessage: undefined,
        });
      }

      let streamedText = "";
      let agentProgress = 5;
      let agentToolStartCount = 0;
      let streamFailed = false;

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
          signal: abortController.signal,
        });

        const contentType = res.headers.get("content-type") ?? "";

        if (!res.ok) {
          const data = contentType.includes("json")
            ? ((await res.json().catch(() => ({}))) as {
                error?: string;
                credits?: number;
                required?: number;
              })
            : {};

          if (res.status === 402) {
            openNoCreditsModal({
              required: data.required ?? 1,
              remaining: data.credits ?? 0,
            });
          }

          const errMsg = data.error ?? "Anfrage fehlgeschlagen.";
          showCreditsToast(errMsg, "error");
          if (primaryAssetId) {
            updateAssetNode(primaryAssetId, {
              status: "error",
              progress: 0,
              errorMessage: errMsg,
            });
          }
          return;
        }

        await consumeAgentStream(res, {
          onTextDelta: (chunk) => {
            streamedText += chunk;
            if (primaryAssetId) {
              updateAssetNode(primaryAssetId, {
                text: streamedText,
                status: "processing",
                progress: Math.min(95, agentProgress + 5),
              });
            }
          },
          onToolStart: (_toolName, label) => {
            agentToolStartCount += 1;
            agentProgress = Math.min(85, 15 + agentToolStartCount * 15);
            if (primaryAssetId) {
              updateAssetNode(primaryAssetId, {
                progress: agentProgress,
                status: "processing",
                statusLabel: label ? `${label}…` : "Agent arbeitet…",
              });
            }
          },
          onToolDone: () => {
            agentProgress = Math.min(90, agentProgress + 5);
            if (primaryAssetId) {
              updateAssetNode(primaryAssetId, { progress: agentProgress });
            }
          },
          onToolError: (toolName) => {
            if (primaryAssetId) {
              updateAssetNode(primaryAssetId, {
                statusLabel: `Fehler bei ${toolName}`,
              });
            }
          },
          onOutputs: (outputs) => {
            const anchorNode = primaryAssetId
              ? useCanvasStore.getState().nodes.find((n) => n.id === primaryAssetId)
              : useCanvasStore.getState().nodes.find((n) => n.id === id);
            if (anchorNode) {
              spawnAgentOutputAssets(
                outputs,
                id,
                anchorNode.position,
                spawnAssetNode,
                agentOutputSpawnIndexRef
              );
            }
          },
          onCredits: () => {
            window.dispatchEvent(new Event("credits-updated"));
          },
          onDone: (summary) => {
            const finalText = streamedText.trim() || summary;
            if (primaryAssetId) {
              updateAssetNode(primaryAssetId, {
                status: "success",
                progress: 100,
                statusLabel: undefined,
                text: finalText,
              });
            }
            setChatHistory((prev) => [
              ...prev,
              { role: "user", content: trimmed },
              { role: "assistant", content: finalText },
            ]);
            setLatestToolCalls(parseAgentResponse(finalText).toolCalls);
          },
          onError: (errMessage) => {
            streamFailed = true;
            showCreditsToast(errMessage, "error");
            if (primaryAssetId) {
              updateAssetNode(primaryAssetId, {
                status: "error",
                progress: 0,
                errorMessage: errMessage,
              });
            }
          },
        });

        if (streamFailed && primaryAssetId) {
          return;
        }
      } catch (err) {
        if (abortController.signal.aborted) return;
        showCreditsToast("Netzwerkfehler. Bitte erneut versuchen.", "error");
        if (primaryAssetId) {
          updateAssetNode(primaryAssetId, {
            status: "error",
            progress: 0,
            errorMessage: "Netzwerkfehler. Bitte erneut versuchen.",
          });
        }
      } finally {
        setFollowUpRunning(false);
        if (abortRef.current === abortController) {
          abortRef.current = null;
        }
        void refreshCredits();
      }
    },
    [
      followUpRunning,
      id,
      refreshCredits,
      showCreditsToast,
      spawnAssetNode,
      tool?.id,
      updateAssetNode,
    ]
  );

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

  if (!tool) return null;

  const coins = calculateToolCoins(tool, nodeData.params);
  const remaining = credits ?? 0;
  const creditExempt = isClientCreditExempt();
  const insufficient = !creditExempt && credits !== null && remaining < coins;
  const dynamicCost =
    tool.id === "seedance-video" ||
    tool.id === "flux-image" ||
    tool.id === "lora-training" ||
    tool.id === "video-uebersetzer" ||
    tool.id === "agent-autopilot" ||
    tool.id === "avatar-studio" ||
    tool.id === "produkt-werbung";
  const creditCostLabel = dynamicCost ? `~${coins} Credits` : `${coins} Credits`;
  const isAgentAutopilot = nodeData.toolId === "agent-autopilot";
  const visibleParams = tool?.params ?? [];

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
            className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[11px] text-white/40 transition-all hover:bg-white/[0.12] hover:text-white ${
              embedded
                ? "top-[calc(0.75rem+env(safe-area-inset-top,0px))] right-3 md:top-0 md:right-0"
                : "top-0 right-0"
            }`}
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
          params={visibleParams.filter((field) =>
            isPrimaryParam(field, isAgentAutopilot, nodeData.toolId)
          )}
          values={nodeData.params}
          accent={tool.accent}
          onChange={handleChange}
          fieldOverrides={fieldOverrides}
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

        {visibleParams.some(
          (f) => !isPrimaryParam(f, isAgentAutopilot, nodeData.toolId)
        ) ? (
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
                <ParamFields
                  params={visibleParams.filter(
                    (field) =>
                      !isPrimaryParam(field, isAgentAutopilot, nodeData.toolId)
                  )}
                  values={nodeData.params}
                  accent={tool.accent}
                  flat
                  onChange={handleChange}
                  fieldOverrides={fieldOverrides}
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

        {isKiIchTool && kiInfluencerCharacters.error ? (
          <p className="mt-3 text-[10px] text-red-400/80">
            {kiInfluencerCharacters.error}
          </p>
        ) : null}

        {isKiIchTool &&
        !kiInfluencerCharacters.loading &&
        kiInfluencerCharacters.characters.length === 0 ? (
          <p className="mt-3 text-[11px] leading-relaxed text-white/45">
            Noch kein trainierter Avatar.{" "}
            <Link
              href="/dashboard/ki-influencer"
              className="text-[#B7FF00] underline underline-offset-2 hover:text-[#ccff00]"
            >
              Avatar im KI-Influencer trainieren →
            </Link>
          </p>
        ) : null}

        {kiIchValidationError ? (
          <p className="mt-3 text-[10px] text-red-400/80">{kiIchValidationError}</p>
        ) : null}

        {isSeedanceTool && seedanceModels.error ? (
          <p className="mt-3 text-[10px] text-red-400/80">{seedanceModels.error}</p>
        ) : null}

        {seedanceValidationError ? (
          <p className="mt-3 text-[10px] text-red-400/80">{seedanceValidationError}</p>
        ) : null}

        {isSeedanceTool && jobPolling.status === "processing" ? (
          <div className="mt-3 flex items-center gap-2 text-[12px] text-white/40">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-[#0066FF]"
              aria-hidden
            />
            Video wird generiert… (kann 1–3 Minuten dauern)
          </div>
        ) : null}

        {isSeedanceTool && jobPolling.status === "failed" && jobPolling.error ? (
          <div className="mt-3 text-[12px] text-red-400/70">{jobPolling.error}</div>
        ) : null}

        {insufficient && !topUpOpen ? (
          <p className="mt-3 text-[10px] font-medium text-[#ccff00]/80">
            Nicht genug Credits ({remaining}/{coins}) — Top-Up öffnet sich beim Generieren.
          </p>
        ) : null}

        {isAgentAutopilot ? (
          <Link
            href="/dashboard/campaign-autopilot"
            className="mb-3 mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[12px] text-white/50 no-underline transition-all hover:border-white/15 hover:text-white/80"
          >
            <span>Volle Kampagne planen?</span>
            <span className="flex items-center gap-1 text-[#B4FF00]">
              Campaign Autopilot →
            </span>
          </Link>
        ) : null}

        <button
          type="button"
          disabled={nodeData.isGenerating}
          onClick={() => void handleGenerate()}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: `linear-gradient(135deg, ${tool.accent}, rgba(${tool.accentRgb}, 0.7))`,
          }}
        >
          <Zap size={16} aria-hidden="true" />
          {nodeData.isGenerating ? (
            "Generiere…"
          ) : (
            <>
              Generieren
              <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 font-mono text-[10px]">
                {creditCostLabel}
              </span>
              {creditExempt ? (
                <span className="ml-1.5 rounded bg-black/20 px-1.5 py-0.5 text-[8px] text-white/50">
                  ADMIN
                </span>
              ) : null}
            </>
          )}
        </button>

        {isAgentAutopilot && chatHistory.length > 0 ? (
          <AgentCanvasFollowUpPanel
            followUpInput={followUpInput}
            onFollowUpInputChange={setFollowUpInput}
            followUpRunning={followUpRunning}
            toolCalls={latestToolCalls}
            onSendFollowUp={(msg) => void sendFollowUp(msg)}
          />
        ) : null}
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
