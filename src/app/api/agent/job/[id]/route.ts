
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JobProgress = {
  steps?: unknown[];
  currentStep?: number;
  itemsCount?: number;
  complete?: boolean;
};

function extractProgress(result: unknown): JobProgress | null {
  if (!result || typeof result !== "object") return null;
  const row = result as Record<string, unknown>;
  if (row.progress && typeof row.progress === "object") {
    return row.progress as JobProgress;
  }
  return null;
}

/** Map DB statuses to user-facing aliases without breaking existing UI checks. */
function displayStatus(status: string): string {
  if (status === "queued") return "pending";
  if (status === "completed") return "done";
  return status;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("agent_jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 });
  }

  const progress = extractProgress(data.result);
  const campaignResult =
    data.result &&
    typeof data.result === "object" &&
    !("progress" in (data.result as Record<string, unknown>))
      ? data.result
      : (data.result as Record<string, unknown> | null)?.partialResult ??
        (data.status === "completed" ? data.result : null);

  return NextResponse.json({
    job: {
      ...data,
      displayStatus: displayStatus(data.status),
      progress,
      result: data.status === "completed" ? campaignResult ?? data.result : data.result,
    },
  });
}
