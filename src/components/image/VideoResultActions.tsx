"use client";

import { useState } from "react";
import {
  downloadVideoFromUrl,
  openVideoInNewTab,
} from "@/lib/image-result-actions";

type VideoResultActionsProps = {
  videoUrl?: string | null;
  variant?: "agent" | "gallery";
  embedded?: boolean;
  onPlay?: () => void;
};

function ActionButton({
  label,
  onClick,
  disabled,
  primary,
  variant,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  variant: "agent" | "gallery";
}) {
  if (variant === "gallery") {
    const style = {
      padding: "7px 12px",
      borderRadius: 8,
      fontSize: "0.78rem",
      fontWeight: 600,
      border: primary ? "none" : "1px solid rgba(255,255,255,0.12)",
      background: primary ? "rgba(180,255,0,0.12)" : "transparent",
      color: primary ? "#B4FF00" : "rgba(255,255,255,0.85)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
    } as const;

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={style}
      >
        {label}
      </button>
    );
  }

  const className = primary
    ? "rounded-lg border border-[#B4FF00]/40 bg-[#B4FF00]/10 px-3 py-2 text-xs font-semibold text-[#B4FF00] hover:bg-[#B4FF00]/15 disabled:cursor-not-allowed disabled:opacity-45"
    : "rounded-lg border border-white/12 px-3 py-2 text-xs font-semibold text-[#F0EFE8] hover:border-[#B4FF00]/35 disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {label}
    </button>
  );
}

export function VideoResultActions({
  videoUrl,
  variant = "gallery",
  embedded = false,
  onPlay,
}: VideoResultActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const trimmedUrl = videoUrl?.trim() ?? "";
  if (!trimmedUrl) return null;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    const result = await downloadVideoFromUrl(trimmedUrl);
    setDownloading(false);
    if (!result.ok) {
      setDownloadError(result.error);
    }
  };

  const wrapperClassName = embedded ? "contents" : undefined;
  const wrapperStyle = embedded
    ? undefined
    : {
        display: "flex",
        flexWrap: "wrap" as const,
        gap: 8,
      };

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      {onPlay && (
        <ActionButton
          variant={variant}
          label="Video abspielen"
          onClick={onPlay}
          primary
        />
      )}
      <ActionButton
        variant={variant}
        label="Video öffnen"
        onClick={() => openVideoInNewTab(trimmedUrl)}
      />
      <ActionButton
        variant={variant}
        label={downloading ? "Lädt…" : "Video herunterladen"}
        onClick={() => void handleDownload()}
        disabled={downloading}
      />
      {downloadError ? (
        <p
          style={{
            width: "100%",
            fontSize: "0.72rem",
            color: "#ff8a9a",
            margin: 0,
          }}
        >
          {downloadError}
        </p>
      ) : null}
    </div>
  );
}
