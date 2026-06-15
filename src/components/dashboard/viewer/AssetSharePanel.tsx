"use client";

import { useState } from "react";
import { Check, Copy, Download, ExternalLink } from "lucide-react";
import type { AssetNodeData } from "@/lib/canvas/canvas-store";

interface Props {
  nodeData: AssetNodeData;
}

export function AssetSharePanel({ nodeData }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = nodeData.url ?? nodeData.previewUrl;

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shareUrl) return null;

  return (
    <div className="flex items-center gap-1.5 pt-2">
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200"
      >
        {copied ? <Check size={12} className="text-[#b4ff00]" /> : <Copy size={12} />}
        {copied ? "Kopiert!" : "Link"}
      </button>

      <a
        href={shareUrl}
        download
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200"
      >
        <Download size={12} />
        Speichern
      </a>

      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200"
      >
        <ExternalLink size={12} />
        Öffnen
      </a>
    </div>
  );
}
