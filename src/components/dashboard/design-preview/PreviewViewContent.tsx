"use client";

import type { PreviewView } from "./PreviewLang";
import { PreviewCommandOs } from "./PreviewCommandOs";
import { PreviewToolsFlow } from "./PreviewToolsFlow";
import { PreviewGallery } from "./PreviewGallery";
import { PreviewSettings } from "./PreviewSettings";

/** Single render switch — view IDs must match PreviewLang nav keys exactly. */
export function PreviewViewContent({
  active,
  onNavigate,
}: {
  active: PreviewView;
  onNavigate: (view: PreviewView) => void;
}) {
  switch (active) {
    case "studio":
    case "agent":
      return <PreviewCommandOs onNavigate={onNavigate} variant={active} />;
    case "tools":
      return <PreviewToolsFlow />;
    case "gallery":
      return <PreviewGallery />;
    case "settings":
      return <PreviewSettings />;
    default: {
      const _exhaustive: never = active;
      return _exhaustive;
    }
  }
}
