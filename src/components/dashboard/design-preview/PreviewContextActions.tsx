"use client";

import Link from "next/link";
import type { PreviewIntent } from "./preview-intent";
import { postGenerationAgentHint } from "./preview-intent";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";

const ACCENT = "#b4ff00";
const BORDER = "rgba(255,255,255,0.1)";

export type ContextAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

export type FollowUpAction =
  | "video"
  | "hooks"
  | "campaign"
  | "variant"
  | "lora"
  | "upscale_image"
  | "upscale_video"
  | "remix";

type PreviewContextActionsProps = {
  intent: PreviewIntent;
  lang: "de" | "en";
  hasImageContext: boolean;
  hasVideoContext?: boolean;
  onFollowUp?: (action: FollowUpAction) => void;
};

function actionsForIntent(
  intent: PreviewIntent,
  lang: "de" | "en",
  hasImageContext: boolean,
  hasVideoContext: boolean,
  onFollowUp?: PreviewContextActionsProps["onFollowUp"]
): ContextAction[] {
  const de = lang === "de";

  if (intent === "image_upscale") {
    return [
      {
        id: "open-upscale",
        label: de ? "→ Upscaler öffnen" : "→ Open upscaler",
        href: PREVIEW_MVP_ROUTES.imageUpscale,
      },
      {
        id: "video",
        label: de ? "→ Zu Video" : "→ To video",
        onClick: () => onFollowUp?.("video"),
        href: PREVIEW_MVP_ROUTES.imgToVideo,
      },
      {
        id: "hooks",
        label: de ? "→ Hooks schreiben" : "→ Write hooks",
        onClick: () => onFollowUp?.("hooks"),
        href: PREVIEW_MVP_ROUTES.viralHook,
      },
      {
        id: "campaign",
        label: de ? "→ In Kampagne" : "→ To campaign",
        onClick: () => onFollowUp?.("campaign"),
        href: PREVIEW_MVP_ROUTES.contentCalendar,
      },
    ];
  }

  if (intent === "video_upscale") {
    return [
      {
        id: "open-video-upscale",
        label: de ? "→ Motion-Upscale öffnen" : "→ Open motion upscale",
        href: PREVIEW_MVP_ROUTES.videoUpscale,
      },
      {
        id: "remix",
        label: de ? "→ Remix" : "→ Remix",
        onClick: () => onFollowUp?.("remix"),
      },
      {
        id: "hooks",
        label: de ? "→ Hooks schreiben" : "→ Write hooks",
        onClick: () => onFollowUp?.("hooks"),
        href: PREVIEW_MVP_ROUTES.viralHook,
      },
      {
        id: "campaign",
        label: de ? "→ In Kampagne" : "→ To campaign",
        onClick: () => onFollowUp?.("campaign"),
        href: PREVIEW_MVP_ROUTES.contentCalendar,
      },
    ];
  }

  if (intent === "ai_influencer") {
    return [
      {
        id: "upscale",
        label: de ? "→ Upscale Bild" : "→ Upscale image",
        onClick: () => onFollowUp?.("upscale_image"),
      },
      {
        id: "lora-train",
        label: de ? "→ Persona trainieren" : "→ Train persona",
        onClick: () => onFollowUp?.("lora"),
      },
      {
        id: "video",
        label: de ? "→ Zu Video" : "→ To video",
        onClick: () => onFollowUp?.("video"),
        href: PREVIEW_MVP_ROUTES.imgToVideo,
      },
      {
        id: "hooks",
        label: de ? "→ Hooks schreiben" : "→ Write hooks",
        onClick: () => onFollowUp?.("hooks"),
        href: PREVIEW_MVP_ROUTES.viralHook,
      },
      {
        id: "campaign",
        label: de ? "→ In Kampagne" : "→ To campaign",
        onClick: () => onFollowUp?.("campaign"),
        href: PREVIEW_MVP_ROUTES.contentCalendar,
      },
    ];
  }

  if (intent === "lora_training") {
    return [
      {
        id: "open-lora",
        label: de ? "→ LoRA-Workflow öffnen" : "→ Open LoRA workflow",
        href: PREVIEW_MVP_ROUTES.loraTraining,
      },
      {
        id: "gallery",
        label: de ? "→ Bilder aus Galerie" : "→ Images from gallery",
        href: PREVIEW_MVP_ROUTES.gallery,
      },
      {
        id: "influencer",
        label: de ? "→ AI Influencer Visual" : "→ AI influencer visual",
        href: PREVIEW_MVP_ROUTES.kiInfluencer,
      },
    ];
  }

  if (
    intent === "image_generation" ||
    intent === "product_visual" ||
    (hasImageContext && intent === "image_to_video")
  ) {
    return [
      {
        id: "video",
        label: de ? "→ Zu Video" : "→ To video",
        onClick: () => onFollowUp?.("video"),
        href: PREVIEW_MVP_ROUTES.imgToVideo,
      },
      {
        id: "hooks",
        label: de ? "→ Hooks schreiben" : "→ Write hooks",
        onClick: () => onFollowUp?.("hooks"),
        href: PREVIEW_MVP_ROUTES.viralHook,
      },
      {
        id: "campaign",
        label: de ? "→ In Kampagne" : "→ To campaign",
        onClick: () => onFollowUp?.("campaign"),
        href: PREVIEW_MVP_ROUTES.contentCalendar,
      },
      {
        id: "upscale",
        label: de ? "→ Upscale Bild" : "→ Upscale image",
        onClick: () => onFollowUp?.("upscale_image"),
      },
    ];
  }

  if (intent === "hook_generation") {
    return [
      {
        id: "campaign",
        label: de ? "→ In Kampagne" : "→ To campaign",
        onClick: () => onFollowUp?.("campaign"),
        href: PREVIEW_MVP_ROUTES.contentCalendar,
      },
      {
        id: "caption",
        label: de ? "→ Als Caption speichern" : "→ Save as caption",
      },
      {
        id: "more-hooks",
        label: de ? "→ Weitere Hooks" : "→ More hooks",
        onClick: () => onFollowUp?.("hooks"),
        href: PREVIEW_MVP_ROUTES.viralHook,
      },
    ];
  }

  if (intent === "campaign_planning") {
    return [
      { id: "execute", label: de ? "Plan ausführen" : "Execute plan" },
      { id: "adjust", label: de ? "Anpassen" : "Adjust" },
    ];
  }

  if (intent === "image_to_video") {
    return [
      {
        id: "upscale-video",
        label: de ? "→ Upscale Video" : "→ Upscale video",
        onClick: () => onFollowUp?.("upscale_video"),
      },
      {
        id: "remix",
        label: de ? "→ Remix" : "→ Remix",
        onClick: () => onFollowUp?.("remix"),
      },
      {
        id: "hooks",
        label: de ? "→ Hooks schreiben" : "→ Write hooks",
        onClick: () => onFollowUp?.("hooks"),
        href: PREVIEW_MVP_ROUTES.viralHook,
      },
      {
        id: "campaign",
        label: de ? "→ In Kampagne" : "→ To campaign",
        onClick: () => onFollowUp?.("campaign"),
        href: PREVIEW_MVP_ROUTES.contentCalendar,
      },
    ];
  }

  if (intent === "asset_reuse") {
    const upscaleAction = hasVideoContext
      ? {
          id: "upscale-video",
          label: de ? "→ Upscale Video" : "→ Upscale video",
          onClick: () => onFollowUp?.("upscale_video"),
        }
      : hasImageContext
        ? {
            id: "upscale",
            label: de ? "→ Upscale Bild" : "→ Upscale image",
            onClick: () => onFollowUp?.("upscale_image"),
          }
        : null;

    return [
      ...(upscaleAction ? [upscaleAction] : []),
      {
        id: "variant",
        label: de ? "→ Variante erstellen" : "→ Create variant",
        onClick: () => onFollowUp?.("variant"),
      },
      {
        id: "gallery",
        label: de ? "→ In Galerie" : "→ To gallery",
        href: PREVIEW_MVP_ROUTES.gallery,
      },
    ];
  }

  return [
    {
      id: "variant",
      label: de ? "→ Variante erstellen" : "→ Create variant",
      onClick: () => onFollowUp?.("variant"),
    },
    {
      id: "gallery",
      label: de ? "→ In Galerie" : "→ To gallery",
      href: PREVIEW_MVP_ROUTES.gallery,
    },
  ];
}

export function PreviewContextActions({
  intent,
  lang,
  hasImageContext,
  hasVideoContext = false,
  onFollowUp,
}: PreviewContextActionsProps) {
  const items = actionsForIntent(intent, lang, hasImageContext, hasVideoContext, onFollowUp);
  const title = lang === "de" ? "Was als Nächstes?" : "What's next?";
  const agentHint = postGenerationAgentHint(intent, lang, hasImageContext, hasVideoContext);

  return (
    <div className="min-w-0" data-preview-stagger-item>
      {agentHint ? (
        <p
          className="preview-type-body mb-3 text-[0.8125rem]"
          style={{ color: "rgba(244,240,232,0.72)" }}
        >
          {agentHint}
        </p>
      ) : null}
      <p className="preview-type-meta mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const className =
            "preview-type-chip rounded border px-3 py-2 transition-colors hover:border-white/20";
          const style = {
            borderColor: BORDER,
            color: "rgba(245,240,232,0.85)",
            background: "rgba(255,255,255,0.04)",
          };

          if (item.onClick) {
            return (
              <button
                key={item.id}
                type="button"
                className={className}
                style={style}
                onClick={() => item.onClick?.()}
              >
                {item.label}
              </button>
            );
          }

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className={className} style={style}>
                {item.label}
              </Link>
            );
          }

          return (
            <button key={item.id} type="button" className={className} style={style}>
              {item.label}
            </button>
          );
        })}
      </div>
      <p className="preview-type-meta mt-2" style={{ color: ACCENT }}>
        Preview
      </p>
    </div>
  );
}
