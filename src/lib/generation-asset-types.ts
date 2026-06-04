export type GenerationAssetResult = {
  scene?: string;
  previewPath?: string;
  /** Full-quality source (private until download purchased) */
  sourcePath?: string;
  finalPath?: string;
  upscaledPath?: string;
  paid: boolean;
  downloadPaid?: boolean;
  mode?: "preview" | "final";
  jobId?: string;
  assetKind?: "image" | "video";
  mimeType?: string;
  category?: string;
  model?: string;
  width?: number;
  height?: number;
  generationTimeMs?: number;
  seed?: number;
  highRes?: boolean;
  parentGenerationId?: string;
};

export function parseGenerationAssetResult(
  raw: unknown
): GenerationAssetResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    scene: typeof r.scene === "string" ? r.scene : undefined,
    previewPath: typeof r.previewPath === "string" ? r.previewPath : undefined,
    finalPath: typeof r.finalPath === "string" ? r.finalPath : undefined,
    paid: r.paid === true,
    mode: r.mode === "preview" || r.mode === "final" ? r.mode : undefined,
    jobId: typeof r.jobId === "string" ? r.jobId : undefined,
    assetKind:
      r.assetKind === "image" || r.assetKind === "video" ? r.assetKind : undefined,
    mimeType: typeof r.mimeType === "string" ? r.mimeType : undefined,
    sourcePath: typeof r.sourcePath === "string" ? r.sourcePath : undefined,
    upscaledPath: typeof r.upscaledPath === "string" ? r.upscaledPath : undefined,
    downloadPaid: r.downloadPaid === true,
    category: typeof r.category === "string" ? r.category : undefined,
    model: typeof r.model === "string" ? r.model : undefined,
    width: typeof r.width === "number" ? r.width : undefined,
    height: typeof r.height === "number" ? r.height : undefined,
    generationTimeMs:
      typeof r.generationTimeMs === "number" ? r.generationTimeMs : undefined,
    seed: typeof r.seed === "number" ? r.seed : undefined,
    highRes: r.highRes === true,
    parentGenerationId:
      typeof r.parentGenerationId === "string" ? r.parentGenerationId : undefined,
  };
}
