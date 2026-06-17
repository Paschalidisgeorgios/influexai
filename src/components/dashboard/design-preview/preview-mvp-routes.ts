/**
 * MVP workflow routes — preview links to existing production tools only.
 * /dashboard/design-preview
 */

import type { PreviewIntentId } from "./preview-intent";

export type PreviewMvpWorkflow = {
  id: string;
  label: string;
  desc: string;
  engine: string;
  href: string;
};

export const PREVIEW_MVP_WORKFLOWS: PreviewMvpWorkflow[] = [
  {
    id: "image-gen",
    label: "Bild erstellen",
    desc: "Kampagnenvisuals, Produktbilder und Feed-Assets.",
    engine: "InfluexAI Image Engine",
    href: "/dashboard/image-generator",
  },
  {
    id: "img-to-video",
    label: "Bild zu Video",
    desc: "Standbild in Motion-Clips und Reels verwandeln.",
    engine: "InfluexAI Motion Engine",
    href: "/dashboard/szenen-generator",
  },
  {
    id: "text-to-video",
    label: "Text zu Video",
    desc: "Video direkt aus Briefing und Motion Prompt.",
    engine: "InfluexAI Motion Engine",
    href: "/dashboard/text-to-video",
  },
  {
    id: "viral-hook",
    label: "Hooks & Kampagne",
    desc: "Hook-Richtungen und Kampagnenideen strukturieren.",
    engine: "InfluexAI Campaign Engine",
    href: "/dashboard/viral-hook",
  },
  {
    id: "content-calendar",
    label: "Content Kalender",
    desc: "Content-Ideen und Veröffentlichungsplan.",
    engine: "InfluexAI Campaign Engine",
    href: "/dashboard/content-kalender",
  },
];

export const PREVIEW_PREP_WORKFLOWS = [
  "Avatar Studio",
  "Voice Clone",
  "Live Portrait",
  "UGC Video",
  "E-Commerce Ads",
  "Video Editor",
] as const;

export function mvpRouteForIntent(intent: PreviewIntentId): string {
  switch (intent) {
    case "image_generation":
      return "/dashboard/image-generator";
    case "image_to_video":
      return "/dashboard/szenen-generator";
    case "campaign_planning":
      return "/dashboard/viral-hook";
    case "asset_reuse":
      return "/dashboard/gallery";
    default:
      return "/dashboard/image-generator";
  }
}
