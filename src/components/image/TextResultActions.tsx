"use client";

import { useState } from "react";
import {
  copyTextToClipboard,
  downloadTextAsFile,
} from "@/lib/image-result-actions";

type TextResultActionsProps = {
  text: string;
  downloadFilename?: string;
  variant?: "agent" | "gallery";
};

export function TextResultActions({
  text,
  downloadFilename = "influexai-text.txt",
  variant = "agent",
}: TextResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const trimmed = text.trim();

  if (!trimmed) return null;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(trimmed);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  if (variant === "gallery") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() => void handleCopy()}
          style={{
            padding: "7px 12px",
            borderRadius: 8,
            fontSize: "0.78rem",
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "rgba(255,255,255,0.85)",
            cursor: "pointer",
          }}
        >
          {copied ? "Kopiert" : "Text kopieren"}
        </button>
        <button
          type="button"
          onClick={() => downloadTextAsFile(trimmed, downloadFilename)}
          style={{
            padding: "7px 12px",
            borderRadius: 8,
            fontSize: "0.78rem",
            fontWeight: 600,
            border: "none",
            background: "rgba(180,255,0,0.12)",
            color: "#B4FF00",
            cursor: "pointer",
          }}
        >
          Als TXT herunterladen
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-lg border border-white/12 px-3 py-2 text-xs font-semibold text-[#F0EFE8] hover:border-[#B4FF00]/35"
      >
        {copied ? "Kopiert" : "Text kopieren"}
      </button>
      <button
        type="button"
        onClick={() => downloadTextAsFile(trimmed, downloadFilename)}
        className="rounded-lg border border-[#B4FF00]/40 bg-[#B4FF00]/10 px-3 py-2 text-xs font-semibold text-[#B4FF00] hover:bg-[#B4FF00]/15"
      >
        Als TXT herunterladen
      </button>
    </div>
  );
}
