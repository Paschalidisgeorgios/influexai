/**
 * Canvas tools whose API routes already insert into `generations` after success
 * (via createGenerationRecord or an explicit insert). For these, the canvas
 * analytics POST would create a duplicate row and double-count credits.
 */
const CANVAS_TOOLS_WITH_SERVER_GENERATION_LOG = new Set<string>([
  "viral-hook",
  "content-kalender",
  "trend-script",
  "script-generator",
  "flux-image",
  "ki-ich",
  "seedance-video",
  "video-transformer",
  "video-uebersetzer",
  "avatar-studio",
  "lipsync-studio",
]);

export function shouldPostCanvasAnalytics(toolId: string): boolean {
  return !CANVAS_TOOLS_WITH_SERVER_GENERATION_LOG.has(toolId);
}
