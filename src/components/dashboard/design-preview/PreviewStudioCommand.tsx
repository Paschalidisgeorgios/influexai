"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLang } from "./PreviewLang";
import { CommandComposer } from "./CommandComposer";
import { IntentResolverPreview } from "./IntentResolverPreview";
import {
  DynamicWorkflowResult,
  resolveAssetKind,
  type WorkflowPhase,
} from "./DynamicWorkflowResult";
import { AssetPreviewInline } from "./AssetPreviewInline";
import { PreviewContextActions, type FollowUpAction } from "./PreviewContextActions";
import {
  detectPreviewIntent,
  detectPreviewPlatform,
  buildOptimizedPrompt,
  needsPlatformAsk,
  shouldOpenAiCreatorWorkflow,
  resolveAiCreatorMode,
} from "./preview-intent";
import type { AiCreatorSeed } from "@/lib/ai-creator/types";
import {
  usePreviewDashboardMotion,
  animatePreviewPanel,
  animatePreviewWorkflowItems,
} from "./usePreviewDashboardMotion";

export function PreviewStudioCommand({
  onCommandFocusChange,
  onOpenAiCreator,
}: {
  onCommandFocusChange?: (focused: boolean) => void;
  onOpenAiCreator?: (seed: AiCreatorSeed) => void;
}) {
  const { lang, t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [optimized, setOptimized] = useState("");
  const [phase, setPhase] = useState<WorkflowPhase>("idle");
  const [hasImageContext, setHasImageContext] = useState(false);
  const [hasVideoContext, setHasVideoContext] = useState(false);
  const [forceVideoPanel, setForceVideoPanel] = useState(false);
  const [forceUpscalePanel, setForceUpscalePanel] = useState<"image" | "video" | false>(false);

  const tc = t.studioCommand;
  const chips = tc.chips.map((c) => ({ ...c, prompt: c.prompt[lang] }));
  const loading = phase === "optimizing" || phase === "generating";

  usePreviewDashboardMotion(rootRef, true);

  const intent = useMemo(() => {
    if (forceVideoPanel) return "image_to_video" as const;
    if (forceUpscalePanel === "image") return "image_upscale" as const;
    if (forceUpscalePanel === "video") return "video_upscale" as const;
    return detectPreviewIntent(submitted);
  }, [submitted, forceVideoPanel, forceUpscalePanel]);
  const platform = useMemo(() => detectPreviewPlatform(submitted), [submitted]);
  const platformAsk = needsPlatformAsk(submitted, intent, platform.platform)
    ? tc.platformAsk
    : undefined;

  const assetKind = resolveAssetKind(
    intent,
    phase,
    forceVideoPanel,
    submitted,
    forceUpscalePanel
  );

  useEffect(() => {
    animatePreviewPanel(flowRef, phase !== "idle");
    if (phase !== "idle") {
      animatePreviewWorkflowItems(flowRef);
    }
  }, [phase, intent, forceVideoPanel]);

  const runWorkflow = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const detected = detectPreviewIntent(trimmed);
    if (onOpenAiCreator && shouldOpenAiCreatorWorkflow(detected, trimmed)) {
      onOpenAiCreator({
        prompt: trimmed,
        mode: resolveAiCreatorMode(trimmed),
      });
      setInput("");
      return;
    }

    setSubmitted(trimmed);
    setForceVideoPanel(false);
    setForceUpscalePanel(false);
    setOptimized(buildOptimizedPrompt(trimmed, detected));
    setPhase("optimizing");

    window.setTimeout(() => {
      if (
        detected === "ai_creator" ||
        detected === "lora_training" ||
        detected === "image_upscale" ||
        detected === "video_upscale"
      ) {
        setPhase("complete");
        return;
      }
      setPhase("generating");
      window.setTimeout(() => {
        setPhase("complete");
        if (
          detected === "image_generation" ||
          detected === "ai_influencer" ||
          detected === "product_visual"
        ) {
          setHasImageContext(true);
        }
        if (detected === "image_to_video") {
          setHasVideoContext(true);
        }
      }, 1200);
    }, 700);
  }, [onOpenAiCreator]);

  const handleSubmit = () => runWorkflow(input);

  const handleFollowUp = (action: FollowUpAction) => {
    if (action === "upscale_image") {
      setForceUpscalePanel("image");
      setForceVideoPanel(false);
      setSubmitted(lang === "de" ? "Bild für Export verbessern" : "Improve image for export");
      setOptimized(
        buildOptimizedPrompt(
          lang === "de" ? "Bild für Export verbessern" : "Improve image for export",
          "image_upscale"
        )
      );
      setPhase("optimizing");
      window.setTimeout(() => setPhase("complete"), 700);
      return;
    }
    if (action === "upscale_video") {
      setForceUpscalePanel("video");
      setForceVideoPanel(false);
      setSubmitted(lang === "de" ? "Video in höherer Qualität ausgeben" : "Export video in higher quality");
      setOptimized(
        buildOptimizedPrompt(
          lang === "de" ? "Video in höherer Qualität ausgeben" : "Export video in higher quality",
          "video_upscale"
        )
      );
      setPhase("optimizing");
      window.setTimeout(() => setPhase("complete"), 700);
      return;
    }
    if (action === "remix") {
      const p = lang === "de" ? "remix dieses asset" : "remix this asset";
      setInput(p);
      runWorkflow(p);
      return;
    }
    if (action === "lora") {
      const p =
        lang === "de"
          ? "Trainiere einen KI Influencer mit diesen Bildern"
          : "Train an AI influencer with these images";
      setInput(p);
      runWorkflow(p);
      return;
    }
    if (action === "video") {
      setForceVideoPanel(true);
      setForceUpscalePanel(false);
      setSubmitted(lang === "de" ? "Bild zu Video animieren" : "Animate image to video");
      setPhase("optimizing");
      window.setTimeout(() => {
        setPhase("generating");
        window.setTimeout(() => {
          setPhase("complete");
          setHasVideoContext(true);
        }, 1000);
      }, 500);
      return;
    }
    if (action === "hooks") {
      const p = lang === "de" ? "schreib mir hooks für das bild" : "write hooks for this image";
      setInput(p);
      runWorkflow(p);
      return;
    }
    if (action === "campaign") {
      const p = lang === "de" ? "starte kampagne" : "start campaign";
      setInput(p);
      runWorkflow(p);
    }
  };

  return (
    <div ref={rootRef} className="mx-auto min-w-0 max-w-[52rem]">
      <header className="mb-6 md:mb-8" data-preview-enter>
        <p className="preview-type-label mb-2 md:mb-3">
          <span className="preview-type-label__accent">01</span>
          <span aria-hidden> — </span>
          {tc.overline}
        </p>
        <h1 className="preview-type-display">{tc.headline}</h1>
        <p className="preview-type-body mt-3 max-w-[42ch]">{tc.subline}</p>
      </header>

      <CommandComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        chips={chips}
        placeholder={tc.placeholder}
        rotatingPrompts={tc.rotatingPrompts}
        enterHint={tc.enterHint}
        loadingHint={tc.loadingHint}
        formatLabel={tc.formatChip}
        galleryLabel={tc.galleryChip}
        assetLabel={tc.assetLabel}
        loading={loading}
        onFocusChange={onCommandFocusChange}
      />

      <div ref={flowRef} className="mt-6 min-w-0 space-y-6 md:mt-8 md:space-y-8">
        {phase !== "idle" ? (
          <>
            <section className="preview-section-stack preview-section-stack--loose">
              <p className="preview-type-label">
                <span className="preview-type-label__accent">02</span>
                <span aria-hidden> — </span>
                WORKFLOW
              </p>
              <div className="preview-surface preview-section-stack p-4 md:p-5" data-preview-workflow>
                <IntentResolverPreview
                  intent={intent}
                  input={submitted}
                  lang={lang}
                  platformAsk={platformAsk}
                  hasImageContext={hasImageContext}
                  hasVideoContext={hasVideoContext}
                />

                <DynamicWorkflowResult
                  intent={intent}
                  originalPrompt={submitted}
                  optimizedPrompt={optimized}
                  onOptimizedChange={setOptimized}
                  phase={phase}
                  format={platform.format}
                  lang={lang}
                  hasImageContext={hasImageContext}
                  hasVideoContext={hasVideoContext}
                  forceVideoPanel={forceVideoPanel}
                  forceUpscalePanel={forceUpscalePanel}
                />
              </div>
            </section>

            <section className="preview-section-stack preview-section-stack--loose">
              <p className="preview-type-label">
                <span className="preview-type-label__accent">03</span>
                <span aria-hidden> — </span>
                ASSETS
              </p>
              <div className="preview-surface p-4 md:p-5" data-preview-stagger>
                <AssetPreviewInline
                  intent={intent}
                  kind={assetKind}
                  lang={lang}
                  visible={phase === "complete"}
                  input={submitted}
                />
              </div>
            </section>

            {phase === "complete" ? (
              <PreviewContextActions
                intent={intent}
                lang={lang}
                hasImageContext={hasImageContext}
                hasVideoContext={hasVideoContext}
                onFollowUp={handleFollowUp}
              />
            ) : null}
          </>
        ) : (
          <p className="preview-type-body preview-type-body--muted" data-preview-stagger>
            {tc.idleHint}
          </p>
        )}
      </div>

      <div
        className="mt-10 border-t pt-6"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
        data-preview-stagger
      >
        <p className="preview-type-meta mb-2">
          {tc.mvpLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {tc.mvpLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="preview-type-chip rounded border px-3 py-1.5 text-[var(--studio-text-muted)] transition-colors hover:border-white/15 hover:text-[var(--studio-text-secondary)]"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
