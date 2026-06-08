"use client";

import Link from "next/link";
import { useState } from "react";
import {
  copyTextToClipboard,
  downloadImageFromUrl,
  galleryImageHref,
  openImageInNewTab,
} from "@/lib/image-result-actions";

type ImageResultActionsProps = {
  imageUrl?: string | null;
  prompt?: string | null;
  generationId?: string | null;
  downloadFilename?: string;
  variant?: "agent" | "gallery";
  embedded?: boolean;
};

function ActionButton({
  label,
  onClick,
  href,
  disabled,
  title,
  primary,
  variant,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  title?: string;
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
      textDecoration: "none",
    } as const;

    if (href && !disabled) {
      return (
        <Link href={href} style={style} title={title}>
          {label}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={style}
      >
        {label}
      </button>
    );
  }

  const className = primary
    ? "rounded-lg border border-[#B4FF00]/40 bg-[#B4FF00]/10 px-3 py-2 text-xs font-semibold text-[#B4FF00] hover:bg-[#B4FF00]/15 disabled:cursor-not-allowed disabled:opacity-45"
    : "rounded-lg border border-white/12 px-3 py-2 text-xs font-semibold text-[#F0EFE8] hover:border-[#B4FF00]/35 disabled:cursor-not-allowed disabled:opacity-45";

  if (href && !disabled) {
    return (
      <Link href={href} className={`${className} no-underline inline-block`} title={title}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
    >
      {label}
    </button>
  );
}

export function ImageResultActions({
  imageUrl,
  prompt,
  generationId,
  downloadFilename = "influexai-bild.jpg",
  variant = "agent",
  embedded = false,
}: ImageResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const trimmedUrl = imageUrl?.trim() ?? "";
  const trimmedPrompt = prompt?.trim() ?? "";
  const hasUrl = Boolean(trimmedUrl);
  const hasPrompt = Boolean(trimmedPrompt);
  const hasGeneration = Boolean(generationId?.trim());

  if (!hasUrl && !hasPrompt && !hasGeneration) return null;

  const handleCopyPrompt = async () => {
    if (!hasPrompt) return;
    const ok = await copyTextToClipboard(trimmedPrompt);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownload = async () => {
    if (!hasUrl || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    const result = await downloadImageFromUrl(trimmedUrl, downloadFilename);
    setDownloading(false);
    if (!result.ok) {
      setDownloadError(result.error);
    }
  };

  const wrapperClassName =
    variant === "agent"
      ? "mt-3 flex flex-wrap gap-2"
      : embedded
        ? "contents"
        : undefined;

  const wrapperStyle =
    variant === "gallery" && !embedded
      ? {
          padding: "10px 14px 14px",
          display: "flex",
          flexWrap: "wrap" as const,
          gap: 8,
          marginTop: "auto",
        }
      : undefined;

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      {hasUrl && (
        <>
          <ActionButton
            variant={variant}
            label={downloading ? "Lädt…" : variant === "agent" ? "Bild herunterladen" : "Herunterladen"}
            onClick={() => void handleDownload()}
            disabled={downloading}
            primary={variant === "gallery"}
          />
          <ActionButton
            variant={variant}
            label={variant === "agent" ? "Bild öffnen" : "In neuem Tab öffnen"}
            onClick={() => openImageInNewTab(trimmedUrl)}
          />
        </>
      )}
      {hasPrompt && (
        <ActionButton
          variant={variant}
          label={copied ? "Kopiert" : "Prompt kopieren"}
          onClick={() => void handleCopyPrompt()}
        />
      )}
      {hasGeneration && (
        <ActionButton
          variant={variant}
          label="In Galerie öffnen"
          href={galleryImageHref()}
        />
      )}
      {downloadError ? (
        <p
          className={
            variant === "agent"
              ? "w-full text-[11px] text-[#ff8a9a]"
              : undefined
          }
          style={
            variant === "gallery"
              ? {
                  width: "100%",
                  fontSize: "0.72rem",
                  color: "#ff8a9a",
                  margin: 0,
                }
              : undefined
          }
        >
          {downloadError}
        </p>
      ) : null}
    </div>
  );
}
