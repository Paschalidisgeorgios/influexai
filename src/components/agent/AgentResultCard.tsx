"use client";

import { LightFrame } from "@/components/LightFrame";
import type { AgentOutputs } from "@/lib/agent/types";
import { AgentRedirectCards } from "./AgentRedirectCards";
import {
  AgentGenericJsonResult,
  AgentNicheResult,
  AgentScriptResult,
  AgentThumbnailResult,
  AgentViralScoreResult,
} from "./AgentStructuredResults";

type Props = {
  outputs: AgentOutputs;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
};

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#060608]/50 p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent,#B4FF00)] mb-3">
        {title}
      </h4>
      {children}
    </div>
  );
}

function AgentMediaImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <div className="space-y-2">
      {caption ? (
        <p className="text-[11px] text-white/50 font-mono">{caption}</p>
      ) : null}
      <LightFrame className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0f0f12]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full max-h-80 object-contain bg-black/40"
        />
      </LightFrame>
    </div>
  );
}

function AgentMediaVideo({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  return (
    <div className="space-y-2">
      {caption ? (
        <p className="text-[11px] text-white/50 font-mono">{caption}</p>
      ) : null}
      <LightFrame className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0f0f12]">
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full max-h-80 object-contain bg-black/40"
        />
      </LightFrame>
    </div>
  );
}

export function AgentResultCard({ outputs, onSave, saving, saved }: Props) {
  const hasRedirects = (outputs.redirects?.length ?? 0) > 0;
  const hasResults = Object.entries(outputs).some(
    ([key, value]) => key !== "redirects" && value != null
  );
  if (!hasRedirects && !hasResults) return null;

  return (
    <div className="mt-3 space-y-3">
      {outputs.redirects && outputs.redirects.length > 0 && (
        <AgentRedirectCards redirects={outputs.redirects} />
      )}

      {outputs.productPreview != null && (
        <ResultSection title="UGC Produkt-Preview">
          <p className="text-sm text-white/85 font-medium mb-2">
            {outputs.productPreview.productName}
          </p>
          {outputs.productPreview.productDescription ? (
            <p className="text-xs text-white/50 mb-3">
              {outputs.productPreview.productDescription}
            </p>
          ) : null}
          <AgentMediaImage
            src={outputs.productPreview.imageUrl}
            alt={outputs.productPreview.productName}
          />
        </ResultSection>
      )}

      {outputs.image != null && !outputs.productPreview && (
        <ResultSection title="Generiertes Bild">
          <AgentMediaImage
            src={outputs.image.imageUrl}
            alt="Generiertes Bild"
            caption={outputs.image.prompt}
          />
        </ResultSection>
      )}

      {outputs.video != null && (
        <ResultSection title="Generiertes Video">
          <AgentMediaVideo
            src={outputs.video.videoUrl}
            caption={outputs.video.motionPrompt}
          />
        </ResultSection>
      )}

      {outputs.script != null && (
        <ResultSection title="Script">
          <AgentScriptResult data={outputs.script} />
        </ResultSection>
      )}

      {outputs.viralScore != null && (
        <ResultSection title="Viral Score">
          <AgentViralScoreResult data={outputs.viralScore} />
        </ResultSection>
      )}

      {outputs.niche != null && (
        <ResultSection title="Nischen-Analyse">
          <AgentNicheResult data={outputs.niche} />
        </ResultSection>
      )}

      {outputs.thumbnail != null && (
        <ResultSection title="Thumbnail-Konzept">
          <AgentThumbnailResult data={outputs.thumbnail} />
        </ResultSection>
      )}

      {outputs.outliers != null && (
        <ResultSection title="Outlier">
          <AgentGenericJsonResult data={outputs.outliers} />
        </ResultSection>
      )}

      {outputs.competitor != null && (
        <ResultSection title="Konkurrenz-Analyse">
          <AgentGenericJsonResult data={outputs.competitor} />
        </ResultSection>
      )}

      {onSave && hasResults && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className="w-full min-h-[44px] rounded-xl bg-[var(--accent,#B4FF00)] text-[#060608] font-bold text-sm disabled:opacity-80 hover:brightness-105 transition-all"
        >
          {saved
            ? "Gespeichert ✓"
            : saving
              ? "Speichern…"
              : "Alles in einem Klick speichern"}
        </button>
      )}
    </div>
  );
}
