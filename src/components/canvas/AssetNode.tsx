"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { ArrowRight, Download, Share2, Trash2 } from "lucide-react";
import { getToolDefinition } from "@/lib/canvas/toolApiSchema";
import { useCanvasStore, type AssetNodeData } from "@/lib/canvas/canvas-store";
import { AssetMediaReveal } from "./AssetMediaReveal";
import { AssetSharePanel } from "./AssetSharePanel";

function isAssetLoading(status: AssetNodeData["status"]): boolean {
  return status === "loading" || status === "processing";
}

function isShareableAsset(nodeData: AssetNodeData): boolean {
  return (
    nodeData.status === "success" &&
    (nodeData.outputType === "image" || nodeData.outputType === "video") &&
    !!(nodeData.url || nodeData.previewUrl)
  );
}

function AssetNodeComponent({ id, data }: NodeProps<Node<AssetNodeData, "asset">>) {
  const nodeData = data;
  const tool = getToolDefinition(nodeData.toolId);
  const [hover, setHover] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const prevStatusRef = useRef(nodeData.status);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const spawnFollowUp = useCanvasStore((s) => s.spawnFollowUp);

  const loading = isAssetLoading(nodeData.status);
  const isError = nodeData.status === "error";

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (isAssetLoading(prev) && nodeData.status === "success") {
      setJustCompleted(true);
      const timer = window.setTimeout(() => setJustCompleted(false), 900);
      prevStatusRef.current = nodeData.status;
      return () => window.clearTimeout(timer);
    }
    prevStatusRef.current = nodeData.status;
  }, [nodeData.status]);

  const handleDelete = () => {
    if (loading) return;
    setRemoving(true);
    window.setTimeout(() => removeNode(id), 220);
  };

  const handleErrorDismiss = () => {
    setRemoving(true);
    window.setTimeout(() => removeNode(id), 180);
  };

  const handleDownload = () => {
    if (loading) return;
    if (nodeData.url) {
      const a = document.createElement("a");
      a.href = nodeData.url;
      a.download = `${nodeData.toolId}-asset`;
      a.click();
    } else if (nodeData.text) {
      const blob = new Blob([nodeData.text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nodeData.toolId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/influex-asset", JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = "copy";
  };

  const followUp = tool?.followUpTools?.[0];
  const accent = tool?.accent ?? "#B7FF00";
  const accentRgb = tool?.accentRgb ?? "183,255,0";
  const shareable = isShareableAsset(nodeData);

  return (
    <AnimatePresence>
      {!removing && (
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`relative w-[min(320px,88vw)] rounded-2xl border bg-zinc-950/60 backdrop-blur-xl transition-shadow duration-500 ${
            justCompleted ? "asset-node--revealed" : "border-zinc-800/50"
          } ${loading ? "asset-node--loading" : ""} ${isError ? "asset-node--error" : ""}`}
          style={{
            boxShadow: justCompleted
              ? `0 0 40px rgba(${accentRgb}, 0.35), 0 0 80px rgba(${accentRgb}, 0.12)`
              : isError
                ? `0 0 24px rgba(239,68,68,0.12)`
                : hover
                  ? `0 0 36px rgba(${accentRgb}, 0.18)`
                  : `0 0 20px rgba(${accentRgb}, 0.08)`,
            borderColor: justCompleted
              ? accent
              : isError
                ? "rgba(239,68,68,0.35)"
                : loading
                  ? `rgba(${accentRgb}, 0.25)`
                  : undefined,
          }}
        >
          <div
            draggable={!loading}
            onDragStart={handleDragStart}
            className={loading ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}
          >
            <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-zinc-700" />
            <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-zinc-700" />

            {hover && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-10 right-2 z-10 flex gap-1 rounded-full border border-zinc-800/80 bg-black/80 p-1 backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
                  aria-label="Löschen"
                >
                  <Trash2 size={14} />
                </button>
                {!isError ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      aria-label="Download"
                    >
                      <Download size={14} />
                    </button>
                    {shareable ? (
                      <button
                        type="button"
                        onClick={() => setShareOpen((open) => !open)}
                        className={`rounded-full p-1.5 transition-colors ${
                          shareOpen
                            ? "bg-[#ccff00]/15 text-[#ccff00]"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        }`}
                        aria-label="Veröffentlichen"
                        aria-expanded={shareOpen}
                      >
                        <Share2 size={14} />
                      </button>
                    ) : null}
                    {followUp ? (
                      <button
                        type="button"
                        onClick={() => spawnFollowUp(id, followUp as never)}
                        className="rounded-full p-1.5 text-zinc-400 hover:text-[var(--accent)]"
                        style={{ ["--accent" as string]: accent }}
                        aria-label="Weitermachen"
                      >
                        <ArrowRight size={14} />
                      </button>
                    ) : null}
                  </>
                ) : null}
              </motion.div>
            )}

            <div className="p-3">
              <p
                className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: accent }}
              >
                {nodeData.label}
              </p>

              <AssetMediaReveal
                nodeData={nodeData}
                accent={accent}
                accentRgb={accentRgb}
                isLoading={loading}
                justCompleted={justCompleted}
                onErrorDismiss={isError ? handleErrorDismiss : undefined}
              />

              <AnimatePresence initial={false}>
                {shareOpen && shareable ? (
                  <AssetSharePanel
                    nodeData={nodeData}
                    accent={accent}
                    onClose={() => setShareOpen(false)}
                  />
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const AssetNode = memo(AssetNodeComponent);
