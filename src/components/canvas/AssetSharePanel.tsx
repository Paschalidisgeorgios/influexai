"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import type { AssetNodeData } from "@/lib/canvas/canvas-store";
import { buildDefaultShareCaption, buildShareCaption } from "@/lib/canvas/share-caption";
import { publishAssetToPlatform } from "@/lib/canvas/share-client";
import { getToolDefinition } from "@/lib/canvas/toolApiSchema";
import { useCanvasAnalyticsStore } from "@/lib/canvas/canvas-analytics-store";
import {
  SHARE_PLATFORMS,
  type ShareMediaType,
  type SharePlatform,
} from "@/lib/canvas/share-platforms";
import { platformIcon } from "./SharePlatformIcons";

type PlatformStatus = "idle" | "uploading" | "success" | "error";

type PlatformState = {
  status: PlatformStatus;
  liveUrl?: string;
  error?: string;
};

type AssetSharePanelProps = {
  nodeData: AssetNodeData;
  accent: string;
  onClose: () => void;
};

function isShareableAsset(data: AssetNodeData): data is AssetNodeData & {
  outputType: ShareMediaType;
} {
  return (
    (data.outputType === "image" || data.outputType === "video") &&
    data.status === "success" &&
    !!(data.url || data.previewUrl)
  );
}

function AssetSharePanelComponent({ nodeData, accent, onClose }: AssetSharePanelProps) {
  const mediaType = nodeData.outputType as ShareMediaType;
  const assetUrl = nodeData.url ?? nodeData.previewUrl ?? "";
  const sourcePrompt = nodeData.sourcePrompt ?? "";

  const [caption, setCaption] = useState(() =>
    buildDefaultShareCaption(sourcePrompt, mediaType)
  );
  const [platformStates, setPlatformStates] = useState<Record<SharePlatform, PlatformState>>({
    tiktok: { status: "idle" },
    instagram: { status: "idle" },
    youtube: { status: "idle" },
  });

  const activePlatform = useMemo(() => {
    return (Object.entries(platformStates) as [SharePlatform, PlatformState][]).find(
      ([, s]) => s.status === "uploading"
    )?.[0];
  }, [platformStates]);

  const updatePlatform = useCallback(
    (platform: SharePlatform, patch: Partial<PlatformState>) => {
      setPlatformStates((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], ...patch },
      }));
    },
    []
  );
  const recordShare = useCanvasAnalyticsStore((s) => s.recordShare);
  const shareTool = getToolDefinition(nodeData.toolId);

  const handlePlatformFocus = useCallback(
    (platform: SharePlatform) => {
      if (activePlatform) return;
      setCaption(buildShareCaption(sourcePrompt, mediaType, platform));
    },
    [activePlatform, mediaType, sourcePrompt]
  );

  const handlePublish = useCallback(
    async (platform: SharePlatform) => {
      if (activePlatform || !assetUrl) return;

      updatePlatform(platform, { status: "uploading", error: undefined });

      try {
        const result = await publishAssetToPlatform(platform, {
          assetUrl,
          caption,
          mediaType,
          toolId: nodeData.toolId,
        });

        updatePlatform(platform, {
          status: "success",
          liveUrl: result.liveUrl,
        });

        recordShare({
          toolId: nodeData.toolId,
          toolLabel: shareTool?.label ?? nodeData.toolId,
          toolIcon: shareTool?.icon ?? "📤",
          platform,
          liveUrl: result.liveUrl,
        });
      } catch (err) {
        updatePlatform(platform, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload fehlgeschlagen",
        });
      }
    },
    [activePlatform, assetUrl, caption, mediaType, nodeData.toolId, recordShare, shareTool, updatePlatform]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!isShareableAsset(nodeData)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="nodrag nowheel overflow-hidden"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="asset-share-panel mt-2 rounded-xl border border-zinc-800/60 bg-zinc-950/80 p-3 backdrop-blur-md">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
            Veröffentlichen
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-0.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
            aria-label="Schließen"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="mb-2.5 grid grid-cols-3 gap-1.5">
          {SHARE_PLATFORMS.map((platform) => {
            const state = platformStates[platform.id];
            const Icon = platformIcon(platform.id);
            const isUploading = state.status === "uploading";
            const isSuccess = state.status === "success";

            return (
              <button
                key={platform.id}
                type="button"
                disabled={!!activePlatform && !isUploading}
                onMouseEnter={() => handlePlatformFocus(platform.id)}
                onFocus={() => handlePlatformFocus(platform.id)}
                onClick={() => void handlePublish(platform.id)}
                className={`asset-share-platform relative flex flex-col items-center gap-1 overflow-hidden rounded-lg border px-2 py-2 transition-colors ${
                  isSuccess
                    ? "border-[#ccff00]/30 bg-[#ccff00]/5"
                    : "border-zinc-800/70 bg-black/30 hover:border-zinc-700 hover:bg-black/50"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                aria-label={`${platform.label} veröffentlichen`}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    color: isSuccess ? "#ccff00" : platform.accent,
                    background: `rgba(${platform.accentRgb}, 0.1)`,
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ccff00]" />
                  ) : isSuccess ? (
                    <Check className="h-3.5 w-3.5 text-[#ccff00]" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="text-[9px] font-medium text-zinc-400">
                  {isSuccess ? "Gepostet" : platform.shortLabel}
                </span>

                {isUploading ? (
                  <span className="asset-share-progress absolute inset-x-0 bottom-0 h-0.5 bg-[#ccff00]" />
                ) : null}

                {state.status === "error" ? (
                  <span className="text-[8px] leading-tight text-red-400/90">
                    {state.error}
                  </span>
                ) : null}

                {isSuccess && state.liveUrl ? (
                  <a
                    href={state.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 inline-flex items-center gap-0.5 text-[8px] text-zinc-500 transition-colors hover:text-[#ccff00]"
                  >
                    Live ansehen
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : null}
              </button>
            );
          })}
        </div>

        <label className="block">
          <span className="mb-1 block text-[9px] uppercase tracking-wider text-zinc-500">
            Caption
          </span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="nodrag nowheel w-full resize-none rounded-lg border border-zinc-800/70 bg-black/40 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-zinc-300 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#ccff00]/30 focus:ring-1 focus:ring-[#ccff00]/15"
            placeholder="Caption mit Hashtags…"
            style={{ boxShadow: `0 0 0 0 transparent` }}
          />
        </label>

        <p className="mt-2 text-[8px] leading-snug text-zinc-600">
          Auto-Caption aus Prompt · Plattform-Hashtags bei Hover
          <span style={{ color: accent }}> · </span>
          {mediaType === "video" ? "Video" : "Bild"}-Upload
        </p>
      </div>
    </motion.div>
  );
}

export const AssetSharePanel = memo(AssetSharePanelComponent);
