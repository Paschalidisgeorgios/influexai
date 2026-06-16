"use client";

import { Upload } from "lucide-react";
import { cn } from "./cn";
import { STUDIO_INPUT_BG, STUDIO_MUTED, STUDIO_RADIUS, STUDIO_TEXT } from "./tokens";

/** Visual-only upload zone — no upload logic wired */
export function StudioUploadZone({
  label = "Datei hochladen",
  hint = "Bild oder Video — Upload folgt im nächsten Schritt.",
  className,
  onClick,
}: {
  label?: string;
  hint?: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center transition-colors hover:border-[#B4FF00]/25",
        STUDIO_RADIUS.input,
        className
      )}
      style={{
        background: STUDIO_INPUT_BG,
        borderColor: "rgba(8,8,8,0.12)",
      }}
    >
      <span
        className={cn("flex h-11 w-11 items-center justify-center", STUDIO_RADIUS.pill)}
        style={{ background: "rgba(8,8,8,0.04)" }}
      >
        <Upload size={18} style={{ color: STUDIO_MUTED }} />
      </span>
      <span className="text-sm font-semibold" style={{ color: STUDIO_TEXT }}>
        {label}
      </span>
      <span className="max-w-xs text-xs leading-relaxed" style={{ color: STUDIO_MUTED }}>
        {hint}
      </span>
    </button>
  );
}
