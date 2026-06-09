import { NextResponse } from "next/server";
import { assertKiToolAccess } from "@/lib/access.server";
import { buildAgentPlanPreview } from "@/lib/agent/plan-preview";

export const dynamic = "force-dynamic";

type PlanPreviewBody = {
  prompt?: string;
  locale?: "de" | "en";
  userConfirmedCost?: boolean;
  userConfirmedConsent?: boolean;
  preferredToolId?: string;
};

export async function POST(request: Request) {
  let body: PlanPreviewBody;
  try {
    body = (await request.json()) as PlanPreviewBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = body.prompt?.trim() ?? "";
  if (!prompt) {
    return NextResponse.json(
      { error: "Bitte gib einen Prompt ein." },
      { status: 400 }
    );
  }

  const access = await assertKiToolAccess(0);
  if (access instanceof NextResponse) return access;

  const { supabase, userId } = access;

  let availableCredits: number | undefined;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    if (typeof data?.credits === "number") {
      availableCredits = data.credits;
    }
  } catch {
    /* read-only preview — ignore profile read errors */
  }

  try {
    const preview = buildAgentPlanPreview({
      prompt,
      locale: body.locale === "en" ? "en" : "de",
      userConfirmedCost: body.userConfirmedCost === true,
      userConfirmedConsent: body.userConfirmedConsent === true,
      availableCredits,
      preferredToolId: body.preferredToolId,
    });

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json(
      { error: "Plan-Vorschau konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}
