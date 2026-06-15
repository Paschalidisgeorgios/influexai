"use client";

/**
 * ToolControlPanel — rendert das Eingabe-Panel für ein Tool.
 *
 * ARCHITEKTUR:
 * - Registrierte Tool-Module (DashboardRegistry) → BaseTool
 * - Nicht-migrierte Tools → ParamFields (generischer Fallback)
 *
 * KEIN Fake-Progress. Kein Event-Emitter.
 * State-Updates direkt via canvas-store.
 */

import { useCallback, useRef } from "react";
import { useCanvasStore, type ControlNodeData } from "@/lib/canvas/canvas-store";
import { TOOL_API_SCHEMA } from "@/lib/canvas/toolApiSchema";
import { calculateToolCoins } from "@/lib/canvas/coin-calculator";
import { useCredits } from "@/components/credits/BuyCreditsProvider";
import { isClientCreditExempt } from "@/lib/client-credits-ui";
import { getRegisteredModule } from "@/components/dashboard/DashboardRegistry";
import { BaseTool } from "./BaseTool";
import { ParamFields } from "./ParamFields";

interface Props {
  nodeId: string;
  nodeData: ControlNodeData;
}

export function ToolControlPanel({ nodeId, nodeData }: Props) {
  const removeNode = useCanvasStore((s) => s.removeNode);
  const updateControlParams = useCanvasStore((s) => s.updateControlParams);
  const setControlGenerating = useCanvasStore((s) => s.setControlGenerating);
  const spawnAssetNode = useCanvasStore((s) => s.spawnAssetNode);
  const updateAssetNode = useCanvasStore((s) => s.updateAssetNode);

  const { credits, addCreditsOptimistic, rollbackOptimistic } = useCredits();
  const creditExempt = isClientCreditExempt();

  const tool = TOOL_API_SCHEMA[nodeData.toolId];
  const module = getRegisteredModule(nodeData.toolId);
  const coins = calculateToolCoins(tool, nodeData.params);
  const remaining = credits ?? Infinity;

  const abortRef = useRef<AbortController | null>(null);

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      updateControlParams(nodeId, { [key]: value });
    },
    [nodeId, updateControlParams]
  );

  const handleModuleGenerate = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!module) return;

      // Credit-Check
      if (!creditExempt && credits !== null && remaining < coins) {
        return;
      }

      // Asset spawnen (Status: processing)
      const assetId = spawnAssetNode(
        nodeData.toolId,
        {
          outputType: tool.outputType as "image" | "video" | "text" | "script" | "audio" | "train" | "agent" | "calendar",
          label: tool.label,
          sourcePrompt: String(payload.prompt ?? ""),
          status: "processing",
        },
        undefined,
        nodeId
      );

      setControlGenerating(nodeId, true);
      if (!creditExempt && credits !== null) addCreditsOptimistic(-coins);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch(module.apiRoute, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const result = await res.json() as Record<string, unknown>;

        // ── Polling für async Jobs (Video) ────────────────────────────────
        if (module.polling) {
          const generationId = String(result.generationId ?? "");
          if (!generationId) throw new Error("Keine generationId in der Antwort");

          updateAssetNode(assetId, {
            status: "processing",
            statusLabel: module.polling.processingLabel,
          });

          let attempts = 0;
          const MAX_ATTEMPTS = 120;
          const POLL_INTERVAL = 5000;

          while (attempts < MAX_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, POLL_INTERVAL));

            const pollRes = await fetch(
              `${module.polling.statusEndpoint}?generationId=${encodeURIComponent(generationId)}`,
              { signal: abortRef.current.signal }
            );

            if (!pollRes.ok) break;

            const pollData = await pollRes.json() as {
              status?: string;
              url?: string;
              videoUrl?: string;
              error?: string;
            };

            if (pollData.status === "completed" || pollData.url || pollData.videoUrl) {
              const videoUrl = String(pollData.url ?? pollData.videoUrl ?? "");
              updateAssetNode(assetId, {
                status: "success",
                progress: 100,
                statusLabel: undefined,
                url: videoUrl,
                previewUrl: videoUrl,
              });
              break;
            } else if (pollData.status === "failed" || pollData.error) {
              throw new Error(pollData.error ?? "Generierung fehlgeschlagen");
            }

            attempts++;
          }

          if (attempts >= MAX_ATTEMPTS) {
            throw new Error("Timeout — bitte prüfe die Galerie für das Ergebnis");
          }

        // ── Synchrone Ergebnisse (Bild, Text) ─────────────────────────────
        } else {
          const generationId = typeof result.generationId === "string" ? result.generationId : null;
          const previewUrl = generationId
            ? `/api/generated-image/${generationId}?variant=preview`
            : typeof result.imageUrl === "string"
              ? result.imageUrl
              : typeof result.url === "string"
                ? result.url
                : undefined;

          updateAssetNode(assetId, {
            status: "success",
            progress: 100,
            statusLabel: undefined,
            url: previewUrl,
            previewUrl,
            text: typeof result.text === "string" ? result.text : undefined,
            data: result,
          });
        }

      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unbekannter Fehler";
        updateAssetNode(assetId, {
          status: "error",
          statusLabel: undefined,
          errorMessage: message,
        });
        if (!creditExempt && credits !== null) rollbackOptimistic();
      } finally {
        setControlGenerating(nodeId, false);
      }
    },
    [
      module, nodeId, nodeData.toolId, tool, coins, credits, remaining,
      creditExempt, spawnAssetNode, setControlGenerating, updateAssetNode,
      addCreditsOptimistic, rollbackOptimistic,
    ]
  );

  const handleGenericGenerate = useCallback(async () => {
    if (!tool.apiRoute) return;
    await handleModuleGenerate(nodeData.params);
  }, [handleModuleGenerate, nodeData.params, tool.apiRoute]);

  if (!tool) {
    return (
      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/80 p-4">
        <p className="text-xs text-zinc-500">Unbekanntes Tool: {nodeData.toolId}</p>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-zinc-800/50 bg-zinc-950/80 p-4 backdrop-blur-sm"
      style={{ borderColor: `${tool.accent}22` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{tool.icon}</span>
            <h2 className="text-sm font-semibold text-zinc-100">{tool.label}</h2>
          </div>
          {tool.description ? (
            <p className="mt-1 text-[11px] leading-snug text-zinc-500">{tool.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => removeNode(nodeId)}
          className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300"
          aria-label="Panel schließen"
        >
          ×
        </button>
      </div>

      {/* Tool-Formular */}
      {module ? (
        <BaseTool
          module={module}
          values={nodeData.params}
          onChange={handleChange}
          onGenerate={(payload) => void handleModuleGenerate(payload)}
          isGenerating={nodeData.isGenerating}
          accent={tool.accent}
          coinCost={coins}
          hasEnoughCredits={creditExempt || credits === null || remaining >= coins}
          creditExempt={creditExempt}
        />
      ) : (
        <>
          <ParamFields tool={tool} values={nodeData.params} onChange={handleChange} />

          <button
            type="button"
            disabled={nodeData.isGenerating || (!creditExempt && credits !== null && remaining < coins)}
            onClick={() => void handleGenericGenerate()}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-black transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: tool.accent }}
          >
            {nodeData.isGenerating ? "Generiert…" : "Generieren"}
          </button>
        </>
      )}
    </div>
  );
}
