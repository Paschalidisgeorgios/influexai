"use client";

import Link from "next/link";
import type { PreviewIntent } from "./preview-intent";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";

const ACCENT = "#b4ff00";
const BORDER = "rgba(255,255,255,0.1)";

export type ContextAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

type PreviewContextActionsProps = {
  intent: PreviewIntent;
  lang: "de" | "en";
  hasImageContext: boolean;
  onFollowUp?: (action: "video" | "hooks" | "campaign" | "variant") => void;
};

function actionsForIntent(
  intent: PreviewIntent,
  lang: "de" | "en",
  hasImageContext: boolean,
  onFollowUp?: PreviewContextActionsProps["onFollowUp"]
): ContextAction[] {
  const de = lang === "de";

  if (intent === "image_generation" || (hasImageContext && intent === "image_to_video")) {
    return [
      {
        id: "video",
        label: de ? "→ Zu Video" : "→ To video",
        onClick: () => onFollowUp?.("video"),
        href: PREVIEW_MVP_ROUTES.imgToVideo,
      },
      {
        id: "hooks",
        label: de ? "→ Hook schreiben" : "→ Write hooks",
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
        id: "download",
        label: de ? "→ Herunterladen" : "→ Download",
      },
      {
        id: "gallery",
        label: de ? "→ In Galerie speichern" : "→ Save to gallery",
        href: PREVIEW_MVP_ROUTES.gallery,
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
      { id: "hooks", label: de ? "→ Hook schreiben" : "→ Write hooks", href: PREVIEW_MVP_ROUTES.viralHook },
      { id: "gallery", label: de ? "→ In Galerie" : "→ To gallery", href: PREVIEW_MVP_ROUTES.gallery },
      { id: "download", label: de ? "→ Herunterladen" : "→ Download" },
    ];
  }

  return [
    { id: "variant", label: de ? "→ Variante erstellen" : "→ Create variant", onClick: () => onFollowUp?.("variant") },
    { id: "gallery", label: de ? "→ In Galerie" : "→ To gallery", href: PREVIEW_MVP_ROUTES.gallery },
  ];
}

export function PreviewContextActions({
  intent,
  lang,
  hasImageContext,
  onFollowUp,
}: PreviewContextActionsProps) {
  const items = actionsForIntent(intent, lang, hasImageContext, onFollowUp);
  const title = lang === "de" ? "Was als Nächstes?" : "What's next?";

  return (
    <div className="min-w-0" data-preview-stagger-item>
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
