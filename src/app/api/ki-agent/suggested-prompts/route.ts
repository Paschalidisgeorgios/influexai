import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import {
  createAnthropicMessage,
  parseClaudeJson,
  SCRIPT_GENERATOR_MODEL,
} from "@/lib/anthropic";
import { assertKiToolAccess } from "@/lib/access.server";
import {
  formatCreatorProfileForPrompt,
  getCreatorProfile,
  type CreatorProfile,
} from "@/lib/agent/creatorMemory";

export const dynamic = "force-dynamic";

const FALLBACK_PROMPTS = [
  "Erstelle 10 virale Hooks für mein Fitness-Business auf TikTok",
  "Plane 7 Tage Content für mein lokales Café",
  "Schreibe ein Reels-Script für mein neues Produkt",
];

function profileCacheKey(profile: CreatorProfile | null): string {
  if (!profile) return "default";
  return JSON.stringify({
    nische: profile.nische ?? "",
    zielgruppe: profile.zielgruppe ?? "",
    tonalitaet: profile.tonalitaet ?? "",
    plattformen: profile.plattformen ?? [],
    produkte: profile.produkte ?? [],
  });
}

const getCachedSuggestions = unstable_cache(
  async (_userId: string, _contextKey: string, creatorContext: string) => {
    const system = `Du generierst 3 kurze, konkrete Prompt-Vorschläge für AGENT AUTOPILOT.
Antworte NUR als JSON: { "prompts": ["...", "...", "..."] }
Regeln:
- Deutsch
- Jeder Prompt max. 90 Zeichen
- Spezifisch für die Creator-Nische
- Actionable — was soll erstellt werden?`;

    const user = creatorContext
      ? `${creatorContext}\n\nGeneriere 3 personalisierte Prompt-Vorschläge für diesen Creator.`
      : "Generiere 3 allgemeine Content-Prompts für Social-Media-Creator.";

    const claude = await createAnthropicMessage({
      system,
      user,
      maxTokens: 400,
      model: SCRIPT_GENERATOR_MODEL,
    });

    if (!claude.ok) {
      return FALLBACK_PROMPTS;
    }

    try {
      const parsed = parseClaudeJson<{ prompts?: string[] }>(claude.text);
      const prompts = (parsed.prompts ?? [])
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (prompts.length >= 3) {
        return prompts;
      }
    } catch {
      /* fallback */
    }

    return FALLBACK_PROMPTS;
  },
  ["ki-agent-suggested-prompts"],
  { revalidate: 86400 }
);

export async function GET() {
  const access = await assertKiToolAccess(0);
  if (access instanceof NextResponse) {
    if (access.status === 402) {
      return NextResponse.json({ prompts: FALLBACK_PROMPTS });
    }
    return access;
  }

  const { userId, supabase } = access;
  const profile = await getCreatorProfile(supabase, userId);
  const creatorContext = formatCreatorProfileForPrompt(profile);
  const contextKey = profileCacheKey(profile);

  const prompts = await getCachedSuggestions(userId, contextKey, creatorContext);

  return NextResponse.json({ prompts });
}
