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
import { PreviewContextActions } from "./PreviewContextActions";
import {
  detectPreviewIntent,
  detectPreviewPlatform,
  buildOptimizedPrompt,
  needsPlatformAsk,
} from "./preview-intent";
import {
  usePreviewDashboardMotion,
  animatePreviewPanel,
  animatePreviewWorkflowItems,
} from "./usePreviewDashboardMotion";

export function PreviewStudioCommand() {
  const { lang, t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [optimized, setOptimized] = useState("");
  const [phase, setPhase] = useState<WorkflowPhase>("idle");
  const [hasImageContext, setHasImageContext] = useState(false);
  const [forceVideoPanel, setForceVideoPanel] = useState(false);

  const tc = t.studioCommand;
  const chips = tc.chips.map((c) => ({ ...c, prompt: c.prompt[lang] }));
  const loading = phase === "optimizing" || phase === "generating";

  usePreviewDashboardMotion(rootRef, true);

  const intent = useMemo(
    () => detectPreviewIntent(forceVideoPanel ? "video animieren" : submitted),
    [submitted, forceVideoPanel]
  );
  const platform = useMemo(() => detectPreviewPlatform(submitted), [submitted]);
  const platformAsk = needsPlatformAsk(submitted, intent, platform.platform)
    ? tc.platformAsk
    : undefined;

  const assetKind = resolveAssetKind(intent, phase, forceVideoPanel, submitted);

  useEffect(() => {
    animatePreviewPanel(flowRef, phase !== "idle");
    if (phase !== "idle") {
      animatePreviewWorkflowItems(flowRef);
    }
  }, [phase, intent, forceVideoPanel]);

  const runWorkflow = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setSubmitted(trimmed);
    setForceVideoPanel(false);
    const detected = detectPreviewIntent(trimmed);
    setOptimized(buildOptimizedPrompt(trimmed, detected));
    setPhase("optimizing");

    window.setTimeout(() => {
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
      }, 1200);
    }, 700);
  }, []);

  const handleSubmit = () => runWorkflow(input);

  const handleFollowUp = (action: "video" | "hooks" | "campaign" | "variant") => {
    if (action === "video") {
      setForceVideoPanel(true);
      setSubmitted(lang === "de" ? "Bild zu Video animieren" : "Animate image to video");
      setPhase("optimizing");
      window.setTimeout(() => {
        setPhase("generating");
        window.setTimeout(() => setPhase("complete"), 1000);
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
        <p className="preview-type-label mb-2">
          <span className="preview-type-label__accent">01</span>
          <span aria-hidden> — </span>
          {tc.overline}
        </p>
        <h1 className="preview-type-display">{tc.headline}</h1>
        <p className="preview-type-body mt-3 max-w-[48ch]">{tc.subline}</p>
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
      />

      <div ref={flowRef} className="mt-6 min-w-0 space-y-5 md:mt-8">
        {phase !== "idle" ? (
          <>
            <IntentResolverPreview
              intent={intent}
              input={submitted}
              lang={lang}
              platformAsk={platformAsk}
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
              forceVideoPanel={forceVideoPanel}
            />

            <AssetPreviewInline
              intent={intent}
              kind={assetKind}
              lang={lang}
              visible={phase === "complete"}
              input={submitted}
            />

            {phase === "complete" ? (
              <PreviewContextActions
                intent={forceVideoPanel ? "image_to_video" : intent}
                lang={lang}
                hasImageContext={hasImageContext}
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
