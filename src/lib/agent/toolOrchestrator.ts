import { parseScriptBlocks } from "@/lib/script-format";
import type { ProductAdPlatform } from "@/lib/product-ad-config";
import type { TrendScriptPlatform } from "@/lib/trend-script-tool";
import type { ContentKalenderPlatform } from "@/lib/content-kalender-tool";
import type { AgentIntent, AgentResult, AgentScores } from "./types";

type ToolErrorBody = { error?: string; success?: boolean };

async function callTool(
  route: string,
  body: Record<string, unknown>,
  authCookie: string
): Promise<unknown> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as ToolErrorBody &
    Record<string, unknown>;

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : `${route} fehlgeschlagen`
    );
  }

  if (data.success === false) {
    throw new Error(
      typeof data.error === "string" ? data.error : `${route} fehlgeschlagen`
    );
  }

  return data;
}

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

function scoreOutput(data: unknown, platform: string): AgentScores {
  const text = JSON.stringify(data).toLowerCase();
  const hasRisk = /garantiert|spart.*€|sicher.*rendite|heilt|kuriert/i.test(text);
  const platformFit =
    /tiktok|reels|shorts/i.test(platform)
      ? ("high" as const)
      : /instagram|youtube/i.test(platform)
        ? ("medium" as const)
        : ("low" as const);

  let hookScore = 65;
  if (/hook/i.test(text)) hookScore += 15;
  if (/\?|—|\.\.\./i.test(text)) hookScore += 10;
  if (text.length > 200) hookScore += 10;

  return {
    hookScore: Math.min(hookScore, 100),
    clarity: 80,
    platformFit,
    trendFit: "medium",
    ctaStrength: 75,
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
  authCookie: string
): Promise<AgentResult> {
  const platform = detectPlatform(prompt);
  const nische = detectNische(prompt);

  switch (intent) {
    case "hook_generation": {
      const data = (await callTool(
        "/api/viral-hook",
        { input: prompt },
        authCookie
      )) as { hooks?: string[] };
      const hooks = data.hooks ?? [];
      return {
        type: "hooks",
        title: "Hooks bereit",
        summary: `${hooks.length} virale Hooks generiert.`,
        outputs: hooks,
        scores: scoreOutput(data, platform),
        nextActions: ["mehr_varianten", "in_kalender_uebernehmen", "exportieren"],
      };
    }

    case "script_generation": {
      const data = (await callTool(
        "/api/trend-script",
        {
          thema: prompt,
          plattform: mapToTrendScriptPlatform(platform),
          region: "DE",
        },
        authCookie
      )) as { script?: string };
      const scriptOutput = trendScriptToOutput(data.script ?? "");
      return {
        type: "script",
        title: "Script bereit",
        summary: `Script für "${prompt.slice(0, 50)}..." generiert.`,
        outputs: [scriptOutput],
        scores: scoreOutput(scriptOutput, platform),
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
      const data = (await callTool(
        "/api/product-ad/script",
        {
          productName,
          productDescription,
          audience,
          platform: mapToProductAdPlatform(platform),
          style: "lifestyle",
          language: "de",
          ctaText: "Jetzt entdecken",
        },
        authCookie
      )) as {
        script?: {
          hook?: string;
          story?: string;
          proof?: string;
          cta?: string;
        };
      };
      const script = data.script ?? {};
      const adOutput = {
        hook: script.hook ?? "",
        body: [script.story, script.proof].filter(Boolean).join("\n\n"),
        spot: script.story ?? "",
        cta: script.cta ?? "",
        hashtags: [] as string[],
      };
      return {
        type: "ad",
        title: "Ad Script bereit",
        summary: `Reel-Ad für "${prompt.slice(0, 50)}..." generiert.`,
        outputs: [adOutput],
        scores: scoreOutput(adOutput, platform),
        nextActions: ["mehr_varianten", "exportieren"],
      };
    }

    case "content_calendar": {
      const data = (await callTool(
        "/api/content-kalender",
        {
          nische,
          plattform: mapToContentKalenderPlatform(platform),
          frequenz: "5x_woche",
        },
        authCookie
      )) as {
        entries?: Array<{ tag: string; idee: string; format: string }>;
      };
      const entries = mapCalendarEntries(data.entries ?? []);
      return {
        type: "calendar",
        title: "Content-Kalender bereit",
        summary: `Wochenplan für ${nische} auf ${mapToContentKalenderPlatform(platform)} erstellt.`,
        outputs: entries,
        scores: { platformFit: "high", riskLevel: "low" },
        nextActions: ["exportieren", "mehr_varianten"],
      };
    }

    case "video_briefing": {
      const [scriptRes, adRes] = await Promise.allSettled([
        callTool(
          "/api/trend-script",
          {
            thema: prompt,
            plattform: mapToTrendScriptPlatform(platform),
            region: "DE",
          },
          authCookie
        ),
        callTool(
          "/api/product-ad/script",
          {
            ...inferProductAdFields(prompt, nische),
            platform: mapToProductAdPlatform(platform),
            style: "lifestyle",
            language: "de",
            ctaText: "Jetzt entdecken",
          },
          authCookie
        ),
      ]);

      const scriptData =
        scriptRes.status === "fulfilled"
          ? trendScriptToOutput(
              ((scriptRes.value as { script?: string }).script ?? "") as string
            )
          : null;
      const adData =
        adRes.status === "fulfilled"
          ? (() => {
              const script = (adRes.value as { script?: Record<string, string> })
                .script;
              return {
                hook: script?.hook ?? "",
                body: [script?.story, script?.proof].filter(Boolean).join("\n\n"),
                hashtags: [] as string[],
              };
            })()
          : null;

      const outputs = [scriptData, adData].filter(Boolean);
      if (!outputs.length) {
        throw new Error("Video-Briefing konnte nicht generiert werden.");
      }

      return {
        type: "video_briefing",
        title: "Video-Briefing bereit",
        summary: "Script und Ad-Copy für Video generiert.",
        outputs,
        scores: scoreOutput(outputs[0] ?? {}, platform),
        nextActions: ["exportieren", "mehr_varianten"],
      };
    }

    case "multi_tool_content_package": {
      const [hooksRes, scriptRes, calRes] = await Promise.allSettled([
        callTool("/api/viral-hook", { input: prompt }, authCookie),
        callTool(
          "/api/trend-script",
          {
            thema: prompt,
            plattform: mapToTrendScriptPlatform(platform),
            region: "DE",
          },
          authCookie
        ),
        callTool(
          "/api/content-kalender",
          {
            nische,
            plattform: mapToContentKalenderPlatform(platform),
            frequenz: "5x_woche",
          },
          authCookie
        ),
      ]);

      const outputs: unknown[] = [];
      if (hooksRes.status === "fulfilled") {
        outputs.push(hooksRes.value);
      }
      if (scriptRes.status === "fulfilled") {
        outputs.push(
          trendScriptToOutput(
            ((scriptRes.value as { script?: string }).script ?? "") as string
          )
        );
      }
      if (calRes.status === "fulfilled") {
        const entries = (calRes.value as { entries?: unknown[] }).entries ?? [];
        outputs.push({ entries: mapCalendarEntries(entries as never[]) });
      }

      if (!outputs.length) {
        throw new Error("Content-Paket konnte nicht generiert werden.");
      }

      return {
        type: "content_package",
        title: "Content-Paket bereit",
        summary: `${outputs.length} Tools erfolgreich ausgeführt.`,
        outputs,
        scores: { platformFit: "high", riskLevel: "low" },
        nextActions: ["exportieren", "in_kalender_uebernehmen", "mehr_varianten"],
      };
    }

    case "image_generation": {
      const data = (await callTool(
        "/api/generate-image",
        { prompt, category: "creator" },
        authCookie
      )) as { imageUrl?: string; generationId?: string; prompt?: string };
      return {
        type: "image",
        title: "Bild-Konzept bereit",
        summary: `Visual für "${prompt.slice(0, 50)}..." generiert.`,
        outputs: [
          {
            imageUrl: data.imageUrl,
            generationId: data.generationId,
            prompt,
          },
        ],
        scores: { platformFit: "high", riskLevel: "low" },
        nextActions: ["exportieren", "thumbnail_erstellen"],
      };
    }

    default: {
      const data = (await callTool(
        "/api/viral-hook",
        { input: prompt },
        authCookie
      )) as { hooks?: string[] };
      const hooks = data.hooks ?? [];
      return {
        type: "hooks",
        title: "Output bereit",
        summary: "Generierung abgeschlossen.",
        outputs: hooks,
        scores: scoreOutput(data, platform),
        nextActions: ["mehr_varianten", "exportieren"],
      };
    }
  }
}
