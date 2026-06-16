"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DASHBOARD_MUTED, DASHBOARD_TEXT } from "./DashboardSurface";
import { SETUP_COPY } from "./production-tool-setup-ui";
import { STUDIO_RADIUS, StudioPanel } from "../studio-ui";

export function SetupErrorBanner({ message }: { message: string }) {
  return (
    <div
      className={`rounded-[14px] border px-4 py-3 text-sm leading-relaxed ${STUDIO_RADIUS.input}`}
      style={{
        borderColor: "rgba(239,68,68,0.18)",
        background: "rgba(255,247,247,0.92)",
        color: "#991b1b",
      }}
      role="alert"
    >
      {message}
    </div>
  );
}

export function SetupLoadingBanner({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[14px] border border-black/[0.06] px-4 py-3 text-sm"
      style={{ background: "rgba(255,252,247,0.85)", color: DASHBOARD_MUTED }}
    >
      <Loader2 size={15} className="animate-spin shrink-0 opacity-60" />
      <span>{label}</span>
    </div>
  );
}

export function SetupModelsEmpty({ message }: { message?: string }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: DASHBOARD_MUTED }}>
      {message ?? "Keine Modelle verfügbar. Bitte später erneut versuchen."}
    </p>
  );
}

export function SetupResultPanel({
  title,
  children,
  galleryNote = false,
  copyText,
}: {
  title: string;
  children: React.ReactNode;
  galleryNote?: boolean;
  copyText?: string;
}) {
  return (
    <StudioPanel title={title}>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: DASHBOARD_TEXT }}>
        {children}
      </div>
      {copyText ? <CopyResultButton text={copyText} className="mt-4" /> : null}
      <p className="mt-4 text-xs" style={{ color: DASHBOARD_MUTED }}>
        {galleryNote ? SETUP_COPY.galleryResult : SETUP_COPY.resultInline}
      </p>
    </StudioPanel>
  );
}

export function CopyResultButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={`inline-flex min-h-[36px] items-center rounded-full border px-4 text-xs font-semibold transition-colors hover:border-black/14 ${className}`}
      style={{
        borderColor: "rgba(8,8,8,0.10)",
        background: "rgba(255,252,247,0.9)",
        color: DASHBOARD_TEXT,
      }}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? "Kopiert" : "Text kopieren"}
    </button>
  );
}
