import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildDailySuggestionsEmailHtml,
  sendDailySuggestionsEmail,
} from "./email.ts";
import type { DailyVideoIdea, ProfileRow, TrendingVideo } from "./types.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-opus-4-5";
const SITE = "https://influexaicreator.com";

const SYSTEM_PROMPT = `Du bist ein YouTube Shorts Stratege.
Basierend auf diesen Trending Videos generiere 3 einzigartige Video-Ideen mit Hook + Script-Outline.
Antworte NUR als JSON:
{
  "ideas": [
    {
      "title": "string",
      "hook": "string",
      "outline": "string (3-5 Sätze Script-Gliederung)",
      "why_viral": "string"
    }
  ]
}`;

export function startOfUtcDayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function firstName(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "Creator";
  return fullName.trim().split(/\s+/)[0];
}

async function unsubscribeToken(userId: string): Promise<string> {
  const secret =
    Deno.env.get("DAILY_SUGGESTIONS_UNSUBSCRIBE_SECRET") ??
    Deno.env.get("NURTURE_UNSUBSCRIBE_SECRET") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "daily-suggestions-unsubscribe-dev";
  const data = new TextEncoder().encode(`daily-suggestions:${userId}:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function unsubscribeUrl(userId: string): Promise<string> {
  const token = await unsubscribeToken(userId);
  return `${SITE}/api/unsubscribe-daily-suggestions?uid=${encodeURIComponent(userId)}&token=${token}`;
}

export async function resolveUserNiche(
  supabase: SupabaseClient,
  userId: string,
  profileNiche: string | null
): Promise<string | null> {
  if (profileNiche?.trim()) return profileNiche.trim();

  const { data: saves } = await supabase
    .from("niche_saves")
    .select("niche_data, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const row = saves?.[0];
  if (!row?.niche_data || typeof row.niche_data !== "object") return null;

  const data = row.niche_data as { title?: string };
  return data.title?.trim() || null;
}

export async function fetchTrendingVideos(
  niche: string
): Promise<TrendingVideo[]> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY")?.trim();
  if (!apiKey) {
    console.log("[growth-agent] YOUTUBE_API_KEY not set — skipping YouTube fetch");
    return [];
  }

  const publishedAfter = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", `${niche} shorts`);
  url.searchParams.set("order", "viewCount");
  url.searchParams.set("publishedAfter", publishedAfter);
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("relevanceLanguage", "de");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error("[growth-agent] YouTube API:", res.status, await res.text());
      return [];
    }

    const data = (await res.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          description?: string;
          channelTitle?: string;
        };
      }>;
    };

    return (data.items ?? [])
      .map((item) => {
        const id = item.id?.videoId;
        const sn = item.snippet;
        if (!id || !sn?.title) return null;
        return {
          videoId: id,
          title: sn.title,
          channel: sn.channelTitle ?? "",
          description: (sn.description ?? "").slice(0, 500),
        };
      })
      .filter((v): v is TrendingVideo => v !== null);
  } catch (e) {
    console.error("[growth-agent] YouTube fetch:", e);
    return [];
  }
}

function stripClaudeJson(raw: string): string {
  let text = raw.trim();
  text = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = text.search(/[[{]/);
  if (start > 0) text = text.slice(start);
  return text.trim();
}

function parseIdeas(raw: string): DailyVideoIdea[] {
  const parsed = JSON.parse(stripClaudeJson(raw)) as {
    ideas?: unknown;
  };
  if (!Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
    throw new Error("Invalid ideas JSON");
  }
  return parsed.ideas.slice(0, 3).map((item, i) => {
    const row = item as Record<string, unknown>;
    return {
      title: String(row.title ?? `Video-Idee ${i + 1}`).trim(),
      hook: String(row.hook ?? "").trim(),
      outline: String(row.outline ?? "").trim(),
      why_viral: String(row.why_viral ?? row.whyViral ?? "").trim(),
    };
  });
}

export async function generateIdeasWithClaude(
  niche: string,
  trending: TrendingVideo[]
): Promise<DailyVideoIdea[]> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY")?.trim();
  if (!apiKey?.startsWith("sk-ant-")) {
    throw new Error("ANTHROPIC_API_KEY missing or invalid");
  }

  const trendingBlock =
    trending.length > 0
      ? trending
          .map(
            (v, i) =>
              `${i + 1}. "${v.title}" (${v.channel})\n   ${v.description.slice(0, 200)}`
          )
          .join("\n")
      : "Keine Live-Daten — nutze aktuelle Shorts-Trends für diese Nische.";

  const userPrompt = `Nische: ${niche}

Trending Videos (letzte 48h):
${trendingBlock}

Generiere genau 3 einzigartige Short-Ideen auf Deutsch.`;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  return parseIdeas(text);
}

export type ProcessUserResult = {
  userId: string;
  ok: boolean;
  skipped?: string;
  emailSent?: boolean;
};

export async function processUser(
  supabase: SupabaseClient,
  profile: ProfileRow
): Promise<ProcessUserResult> {
  if (!profile.email) {
    return { userId: profile.id, ok: false, skipped: "no_email" };
  }

  const niche = await resolveUserNiche(
    supabase,
    profile.id,
    profile.creator_niche
  );
  if (!niche) {
    return { userId: profile.id, ok: false, skipped: "no_niche" };
  }

  const dayStart = startOfUtcDayIso();
  const { data: existing } = await supabase
    .from("daily_suggestions")
    .select("id")
    .eq("user_id", profile.id)
    .gte("created_at", dayStart)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return { userId: profile.id, ok: false, skipped: "already_today" };
  }

  const trending = await fetchTrendingVideos(niche);
  let ideas: DailyVideoIdea[];
  try {
    ideas = await generateIdeasWithClaude(niche, trending);
  } catch (e) {
    console.error("[growth-agent] Claude:", profile.id, e);
    return { userId: profile.id, ok: false, skipped: "claude_failed" };
  }

  const { error: insertErr } = await supabase.from("daily_suggestions").insert({
    user_id: profile.id,
    niche,
    suggestions: { ideas },
  });

  if (insertErr) {
    console.error("[growth-agent] insert:", insertErr.message);
    return { userId: profile.id, ok: false, skipped: "db_failed" };
  }

  let emailSent = false;
  if (profile.daily_suggestions_email !== false) {
    const unsub = await unsubscribeUrl(profile.id);
    const html = buildDailySuggestionsEmailHtml(
      firstName(profile.full_name),
      niche,
      ideas,
      unsub
    );
    emailSent = await sendDailySuggestionsEmail(
      profile.email,
      "Deine 3 Video-Ideen für heute 🎬",
      html
    );
  }

  return { userId: profile.id, ok: true, emailSent };
}

export async function runGrowthAgentCron(
  supabase: SupabaseClient
): Promise<ProcessUserResult[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, creator_niche, daily_suggestions_email, onboarding_completed"
    )
    .eq("onboarding_completed", true)
    .not("email", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const results: ProcessUserResult[] = [];
  for (const row of profiles ?? []) {
    if (!row.onboarding_completed) continue;
    results.push(await processUser(supabase, row as ProfileRow));
  }
  return results;
}
