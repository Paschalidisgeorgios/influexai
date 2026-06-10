import type { SupabaseClient } from "@supabase/supabase-js";
import { parseScriptBlocks } from "@/lib/script-format";
import type { ProductAdPlatform } from "@/lib/product-ad-config";
import type { TrendScriptPlatform } from "@/lib/trend-script-tool";
import type { ContentKalenderPlatform } from "@/lib/content-kalender-tool";
import { enhanceImagePromptForAgent } from "@/lib/ai/imagePromptEnhancer";
import { inferImageStyleAndPlatform } from "@/lib/ai/imageStylePresets";
import { runImageGeneratorGeneration } from "@/lib/image-generator-run";
import {
  runContentKalenderTextTool,
  runProductAdTextTool,
  runTrendScriptTextTool,
  runViralHookTextTool,
} from "@/lib/agent/text-tool-runners";
import type { AgentIntent, AgentResult, AgentScores, AgentTextToolRun } from "./types";

type OrchestrateContext = {
  supabase: SupabaseClient;
  userId: string;
};

function detectPlatform(prompt: string): string {
  if (/tiktok/i.test(prompt)) return "TikTok";
  if (/instagram|reels/i.test(prompt)) return "Instagram Reels";
  if (/youtube/i.test(prompt)) return "YouTube";
  if (/linkedin/i.test(prompt)) return "LinkedIn";
  return "TikTok";
}

function detectNische(prompt: string): string {
  if (/immobil/i.test(prompt)) return "Immobilien";
  if (/finance|finanz|steuer|invest/i.test(prompt)) return "Finance";
  if (/beauty|kosmetik|skincare/i.test(prompt)) return "Beauty";
  if (/tech|software|saas|app/i.test(prompt)) return "Tech";
  if (/nachhaltig/i.test(prompt)) return "Nachhaltigkeit";
  return "Content Creation";
}

function mapToContentKalenderPlatform(platform: string): ContentKalenderPlatform {
  if (/instagram|reels/i.test(platform)) return "Instagram";
  if (/youtube/i.test(platform)) return "YouTube";
  if (/linkedin/i.test(platform)) return "LinkedIn";
  return "TikTok";
}

function mapToTrendScriptPlatform(platform: string): TrendScriptPlatform {
  if (/instagram|reels/i.test(platform)) return "Reels";
  if (/youtube/i.test(platform)) return "YouTube";
  return "TikTok";
}

function mapToProductAdPlatform(platform: string): ProductAdPlatform {
  if (/instagram|reels/i.test(platform)) return "instagram";
  if (/youtube/i.test(platform)) return "youtube";
  if (/facebook/i.test(platform)) return "facebook";
  return "tiktok";
}

function trendScriptToOutput(script: string) {
  const blocks = parseScriptBlocks(script);
  const blockText = (tag: "hook" | "main" | "cta") =>
    blocks
      .find((b) => b.tag === tag)
      ?.lines.join("\n")
      .trim() ?? "";

  const hook = blockText("hook");
  const story = blockText("main") || script;
  const cta = blockText("cta");

  return { hook, story, cta, hashtags: [] as string[], script };
}

function mapCalendarEntries(
  entries: Array<{ tag?: string; idee?: string; format?: string; day?: string; idea?: string }>
) {
  return entries.map((entry) => ({
    day: entry.day ?? entry.tag ?? "",
    idea: entry.idea ?? entry.idee ?? "",
    format: entry.format ?? "",
  }));
}

function scoresFromQualityRun(
  runs: AgentTextToolRun[],
  platform: string
): AgentScores {
  const avgScore =
    runs.length > 0
      ? Math.round(
          runs.reduce((sum, run) => sum + run.qualityScore, 0) / runs.length
        )
      : 70;

  const text = JSON.stringify(runs.map((r) => r.output)).toLowerCase();
  const hasRisk = /garantiert|spart.*€|sicher.*rendite|heilt|kuriert/i.test(text);
  const platformFit =
    /tiktok|reels|shorts/i.test(platform)
      ? ("high" as const)
      : /instagram|youtube/i.test(platform)
        ? ("medium" as const)
        : ("low" as const);

  return {
    hookScore: avgScore,
    clarity: avgScore,
    platformFit,
    trendFit: "medium",
    ctaStrength: avgScore,
    riskLevel: hasRisk ? "high" : "low",
  };
}

function inferProductAdFields(prompt: string, nische: string) {
  const trimmed = prompt.trim();
  const productName =
    trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed || "Produkt";
  return {
    productName,
    productDescription: trimmed,
    audience: nische,
  };
}

export async function orchestrate(
  intent: AgentIntent,
  prompt: string,
  ctx: OrchestrateContext
): Promise<AgentResult> {
  const platform = detectPlatform(prompt);
  const nische = detectNische(prompt);
  const toolRuns: AgentTextToolRun[] = [];

  switch (intent) {
    case "hook_generation": {
      const run = await runViralHookTextTool(prompt);
      toolRuns.push(run);
      const hooks = run.output;
      return {
        type: "hooks",
        title: "Hooks bereit",
        summary: `${hooks.length} virale Hooks generiert.`,
        outputs: hooks,
        scores: scoresFromQualityRun(toolRuns, platform),
        toolRuns,
        nextActions: ["mehr_varianten", "in_kalender_uebernehmen", "exportieren"],
      };
    }

    case "script_generation": {
      const run = await runTrendScriptTextTool({
        thema: prompt,
        plattform: mapToTrendScriptPlatform(platform),
        region: "DE",
      });
      toolRuns.push(run);
      return {
        type: "script",
        title: "Script bereit",
        summary: "Script generiert.",
        outputs: [{ script: run.output.script, sources: run.output.sources }],
        scores: scoresFromQualityRun(toolRuns, platform),
        toolRuns,
        nextActions: [
          "mehr_varianten",
          "thumbnail_erstellen",
          "in_kalender_uebernehmen",
          "exportieren",
        ],
      };
    }

    case "product_ad": {
      const { productName, productDescription, audience } =
        inferProductAdFields(prompt, nische);
      const run = await runProductAdTextTool({
        productName,
        productDescription,
        audience,
        platform: mapToProductAdPlatform(platform),
        style: "lifestyle",
        language: "de",
        ctaText: "Jetzt entdecken",
      });
      toolRuns.push(run);
      return {
        type: "ad",
        title: "Ad Script bereit",
        summary: "Reel-Ad generiert.",
        outputs: [run.output],
        scores: scoresFromQualityRun(toolRuns, platform),
        toolRuns,
        nextActions: ["mehr_varianten", "caption_schreiben", "exportieren"],
      };
    }

    case "content_calendar": {
      const run = await runContentKalenderTextTool({
        nische,
        plattform: mapToContentKalenderPlatform(platform),
        frequenz: "5x_woche",
      });
      toolRuns.push(run);
      const entries = mapCalendarEntries(run.output);
      return {
        type: "calendar",
        title: "Content-Kalender bereit",
        summary: `Wochenplan für ${nische} auf ${mapToContentKalenderPlatform(platform)} erstellt.`,
        outputs: entries,
        scores: scoresFromQualityRun(toolRuns, platform),
        toolRuns,
        nextActions: ["exportieren", "mehr_varianten"],
      };
    }

    case "video_briefing": {
      const [scriptRes, hooksRes] = await Promise.allSettled([
        runTrendScriptTextTool({
          thema: prompt,
          plattform: mapToTrendScriptPlatform(platform),
          region: "DE",
        }),
        runViralHookTextTool(prompt),
      ]);

      const outputs: unknown[] = [];
      if (scriptRes.status === "fulfilled") {
        toolRuns.push(scriptRes.value);
        outputs.push({
          script: scriptRes.value.output.script,
          sources: scriptRes.value.output.sources,
        });
      }
      if (hooksRes.status === "fulfilled") {
        toolRuns.push(hooksRes.value);
        outputs.push({ hooks: hooksRes.value.output });
      }

      if (!outputs.length) {
        const reason =
          scriptRes.status === "rejected"
            ? scriptRes.reason
            : hooksRes.status === "rejected"
              ? hooksRes.reason
              : "Unbekannter Fehler";
        throw new Error(
          reason instanceof Error
            ? reason.message
            : "Video-Briefing konnte nicht generiert werden."
        );
      }

      return {
        type: "video_briefing",
        title: "Video-Briefing bereit",
        summary: "Script und Hooks für Video generiert.",
        outputs,
        scores: scoresFromQualityRun(toolRuns, platform),
        toolRuns,
        nextActions: ["exportieren", "mehr_varianten"],
      };
    }

    case "multi_tool_content_package": {
      const [hooksRes, scriptRes, calRes] = await Promise.allSettled([
        runViralHookTextTool(prompt),
        runTrendScriptTextTool({
          thema: prompt,
          plattform: mapToTrendScriptPlatform(platform),
          region: "DE",
        }),
        runContentKalenderTextTool({
          nische,
          plattform: mapToContentKalenderPlatform(platform),
          frequenz: "5x_woche",
        }),
      ]);

      const outputs: unknown[] = [];
      if (hooksRes.status === "fulfilled") {
        toolRuns.push(hooksRes.value);
        outputs.push({ hooks: hooksRes.value.output });
      }
      if (scriptRes.status === "fulfilled") {
        toolRuns.push(scriptRes.value);
        outputs.push(trendScriptToOutput(scriptRes.value.output.script));
      }
      if (calRes.status === "fulfilled") {
        toolRuns.push(calRes.value);
        outputs.push({ entries: mapCalendarEntries(calRes.value.output) });
      }

      if (!outputs.length) {
        throw new Error("Content-Paket konnte nicht generiert werden.");
      }

      return {
        type: "content_package",
        title: "Content-Paket bereit",
        summary: `${toolRuns.length} Tools erfolgreich ausgeführt.`,
        outputs,
        scores: scoresFromQualityRun(toolRuns, platform),
        toolRuns,
        nextActions: ["exportieren", "in_kalender_uebernehmen", "mehr_varianten"],
      };
    }

    case "image_generation": {
      const { styleId, platform: imagePlatform } =
        inferImageStyleAndPlatform(prompt);
      const enhanced = await enhanceImagePromptForAgent(prompt, {
        styleId,
        platform: imagePlatform,
      });

      console.log("[agent-image]", {
        styleId: enhanced.styleId,
        platform: enhanced.platform,
        model: "flux",
        source: "toolOrchestrator",
      });

      const result = await runImageGeneratorGeneration(ctx.supabase, ctx.userId, {
        prompt,
        category: "creator",
        styleId: enhanced.styleId,
        platform: enhanced.platform,
        preEnhanced: {
          enhancedPrompt: enhanced.prompt,
          negativePrompt: enhanced.negative_prompt,
          category: "creator",
          styleId: enhanced.styleId,
          platform: enhanced.platform,
        },
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      return {
        type: "image",
        title: "Bild-Konzept bereit",
        summary: `Visual für "${prompt.slice(0, 50)}..." generiert.`,
        outputs: [
          {
            imageUrl: result.imageUrl,
            generationId: result.generationId,
            prompt,
            styleId: enhanced.styleId,
            platform: enhanced.platform,
          },
        ],
        scores: { platformFit: "high", riskLevel: "low" },
        nextActions: ["exportieren", "thumbnail_erstellen"],
      };
    }

    default: {
      const run = await runViralHookTextTool(prompt);
      toolRuns.push(run);
      const hooks = run.output;
      return {
        type: "hooks",
        title: "Output bereit",
        summary: "Generierung abgeschlossen.",
        outputs: hooks,
        scores: scoresFromQualityRun(toolRuns, platform),
        toolRuns,
        nextActions: ["mehr_varianten", "exportieren"],
      };
    }
  }
}
