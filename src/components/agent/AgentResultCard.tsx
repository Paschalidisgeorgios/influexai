"use client";

import { LightFrame } from "@/components/LightFrame";
import { ImageResultActions } from "@/components/image/ImageResultActions";
import { TextResultActions } from "@/components/image/TextResultActions";
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

function extractScriptText(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const s = data as { script?: string; hookVariants?: string[] };
    const parts: string[] = [];
    if (Array.isArray(s.hookVariants) && s.hookVariants.length > 0) {
      parts.push(
        "Hook-Varianten:\n" +
          s.hookVariants.map((hook, index) => `${index + 1}. ${hook}`).join("\n")
      );
    }
    if (typeof s.script === "string" && s.script.trim()) {
      parts.push(s.script);
    }
    if (parts.length > 0) return parts.join("\n\n");
  }
  return JSON.stringify(data, null, 2);
}

function extractJsonText(data: unknown): string {
  if (typeof data === "string") return data;
  return JSON.stringify(data, null, 2);
}

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
          <ImageResultActions
            imageUrl={outputs.productPreview.imageUrl}
            generationId={outputs.productPreview.generationId}
            downloadFilename={`influexai-${outputs.productPreview.productName.slice(0, 32).replace(/\s+/g, "-")}.jpg`}
          />
        </ResultSection>
      )}

      {outputs.image != null && !outputs.productPreview && (
        <ResultSection title="Generiertes Bild">
          {outputs.image.improvedPrompt ? (
            <p className="text-xs text-white/40 leading-relaxed mb-3">
              {outputs.image.improvedPrompt}
            </p>
          ) : null}
          <AgentMediaImage
            src={outputs.image.imageUrl}
            alt="Generiertes Bild"
          />
          <ImageResultActions
            imageUrl={outputs.image.imageUrl}
            prompt={outputs.image.improvedPrompt ?? outputs.image.prompt}
            generationId={outputs.image.generationId}
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
          <TextResultActions
            text={extractScriptText(outputs.script)}
            downloadFilename="influexai-script.txt"
          />
        </ResultSection>
      )}

      {outputs.viralScore != null && (
        <ResultSection title="Viral Score">
          <AgentViralScoreResult data={outputs.viralScore} />
          <TextResultActions
            text={extractJsonText(outputs.viralScore)}
            downloadFilename="influexai-viral-score.txt"
          />
        </ResultSection>
      )}

      {outputs.niche != null && (
        <ResultSection title="Nischen-Analyse">
          <AgentNicheResult data={outputs.niche} />
          <TextResultActions
            text={extractJsonText(outputs.niche)}
            downloadFilename="influexai-niche.txt"
          />
        </ResultSection>
      )}

      {outputs.thumbnail != null && (
        <ResultSection title="Thumbnail-Konzept">
          <AgentThumbnailResult data={outputs.thumbnail} />
          <TextResultActions
            text={extractJsonText(outputs.thumbnail)}
            downloadFilename="influexai-thumbnail.txt"
          />
        </ResultSection>
      )}

      {outputs.outliers != null && (
        <ResultSection title="Outlier">
          <AgentGenericJsonResult data={outputs.outliers} />
          <TextResultActions
            text={extractJsonText(outputs.outliers)}
            downloadFilename="influexai-outlier.txt"
          />
        </ResultSection>
      )}

      {outputs.competitor != null && (
        <ResultSection title="Konkurrenz-Analyse">
          <AgentGenericJsonResult data={outputs.competitor} />
          <TextResultActions
            text={extractJsonText(outputs.competitor)}
            downloadFilename="influexai-competitor.txt"
          />
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
