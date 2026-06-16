/**
 * canonical-tools-preview.ts
 *
 * Design-preview mock tools — NOT production truth.
 * Source: PreviewToolsFlow.tsx (hardcoded MOCK data).
 */

import type { CanonicalToolDefinition } from "./canonical-tool-types";

function previewMock(
  id: string,
  label: string,
  category: CanonicalToolDefinition["category"],
  description: string,
  fakeCredits: number,
  status: CanonicalToolDefinition["status"] = "preview"
): CanonicalToolDefinition {
  return {
    id: `preview:${id}`,
    label,
    description,
    category,
    provider: "none",
    model: "none",
    route: null,
    page: "/dashboard/design-preview",
    status,
    isProduction: false,
    requiresPlan: false,
    requiresConsent: false,
    consentType: "none",
    inputTypes: ["prompt"],
    outputTypes: ["mock"],
    uiOptions: [],
    creditPolicy: {
      mode: "none",
      displayedCredits: fakeCredits,
      baseCredits: null,
      chargeTiming: "none",
      refundPolicy: "not_needed",
      runtimeSource: "registry",
    },
    knownMismatches: [
      "Preview-only mock — credits are fictional and do not match production",
    ],
    docsRequired: false,
    notes: "Defined in PreviewToolsFlow.tsx. Must never be used for billing or product planning.",
    aliases: [id],
  };
}

/** All design-preview mock tools from PreviewToolsFlow.tsx */
export const PREVIEW_MOCK_CANONICAL_TOOLS: CanonicalToolDefinition[] = [
  // Foto
  previewMock("img-gen", "Image Generator", "preview_mock", "Mock image gen", 4),
  previewMock("img-to-img", "Image to Image", "preview_mock", "Mock img2img", 6),
  previewMock("ref-edit", "Reference Edit", "preview_mock", "Mock ref edit", 8, "preview"),
  previewMock("prod-shot", "Product Shot", "preview_mock", "Mock product shot", 6),
  previewMock("ugc-look", "UGC Look", "preview_mock", "Mock UGC look", 5, "coming-soon"),
  // Video
  previewMock("img-vid", "Image to Video", "preview_mock", "Mock i2v", 12),
  previewMock("txt-vid", "Text to Video", "preview_mock", "Mock t2v", 16),
  previewMock("reel-gen", "Reel Generator", "preview_mock", "Mock reel", 14, "preview"),
  previewMock("vid-ad", "Video Ad", "preview_mock", "Mock video ad", 18),
  previewMock("motion", "Motion / Loop", "preview_mock", "Mock motion", 10, "coming-soon"),
  // Avatar
  previewMock("talk-avatar", "Talking Avatar", "preview_mock", "Mock talking avatar", 20),
  previewMock("talk-photo", "Talking Photo", "preview_mock", "Mock talking photo", 15),
  previewMock("lip-sync", "Lip Sync", "preview_mock", "Mock lip sync", 12),
  previewMock("ai-voice", "AI Voice", "preview_mock", "Mock AI voice", 8, "preview"),
  // Text
  previewMock("viral-hook", "Viral Hook", "preview_mock", "Mock viral hook", 2),
  previewMock("cont-cal", "Content Calendar", "preview_mock", "Mock calendar", 4),
  previewMock("trend-scr", "Trend Script", "preview_mock", "Mock trend script", 3),
  previewMock("camp-agent", "Campaign Agent", "preview_mock", "Mock campaign agent", 8, "preview"),
  // Brand
  previewMock("brand-kit", "Brand Kit", "preview_mock", "Mock brand kit", 2),
  previewMock("asset-gal", "Asset Gallery", "preview_mock", "Mock asset gallery", 0),
  previewMock("prod-assets", "Product Assets", "preview_mock", "Mock product assets", 6, "coming-soon"),
  // Preview shell views (non-tool-flow)
  {
    id: "preview:studio",
    label: "Preview Studio",
    description: "Design-preview studio home — all mock.",
    category: "preview_mock",
    provider: "none",
    model: "none",
    route: null,
    page: "/dashboard/design-preview",
    status: "preview",
    isProduction: false,
    requiresPlan: false,
    requiresConsent: false,
    consentType: "none",
    inputTypes: [],
    outputTypes: ["mock"],
    uiOptions: [],
    creditPolicy: {
      mode: "none",
      displayedCredits: 0,
      baseCredits: 0,
      chargeTiming: "none",
      refundPolicy: "not_needed",
      runtimeSource: "registry",
    },
    knownMismatches: [],
    docsRequired: false,
    notes: "PreviewStudioHome.tsx — no API calls.",
  },
  {
    id: "preview:agent",
    label: "Preview Agent",
    description: "Design-preview agent view — mock generate only.",
    category: "preview_mock",
    provider: "none",
    model: "none",
    route: null,
    page: "/dashboard/design-preview",
    status: "preview",
    isProduction: false,
    requiresPlan: false,
    requiresConsent: false,
    consentType: "none",
    inputTypes: ["prompt"],
    outputTypes: ["mock"],
    uiOptions: [],
    creditPolicy: {
      mode: "none",
      displayedCredits: 0,
      baseCredits: 0,
      chargeTiming: "none",
      refundPolicy: "not_needed",
      runtimeSource: "registry",
    },
    knownMismatches: [],
    docsRequired: false,
    notes: "PreviewAgentCommand.tsx — no billing.",
  },
  {
    id: "preview:gallery",
    label: "Preview Gallery",
    description: "Design-preview gallery — mock assets.",
    category: "preview_mock",
    provider: "none",
    model: "none",
    route: null,
    page: "/dashboard/design-preview",
    status: "preview",
    isProduction: false,
    requiresPlan: false,
    requiresConsent: false,
    consentType: "none",
    inputTypes: [],
    outputTypes: ["mock"],
    uiOptions: [],
    creditPolicy: {
      mode: "none",
      displayedCredits: 0,
      baseCredits: 0,
      chargeTiming: "none",
      refundPolicy: "not_needed",
      runtimeSource: "registry",
    },
    knownMismatches: [],
    docsRequired: false,
    notes: "PreviewGallery.tsx.",
  },
];
