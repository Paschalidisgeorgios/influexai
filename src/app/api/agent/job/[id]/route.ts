
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
  if (status === "running") return "running";
  if (status === "failed") return "failed";
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

  const status = displayStatus(data.status);
  const progress = extractProgress(data.result);

  let executionResult: unknown = null;
  const payload = (data.payload ?? {}) as Record<string, unknown>;
  const executionId =
    typeof payload.executionId === "string" ? payload.executionId : null;

  if (status === "done" && executionId) {
    const { data: execution } = await supabase
      .from("agent_executions")
      .select("id, result, status, intent, used_credits, created_at")
      .eq("id", executionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (execution?.result) {
      executionResult = execution.result;
    }
  }

  const campaignResult =
    status === "done"
      ? executionResult ??
        (data.result &&
        typeof data.result === "object" &&
        !("progress" in (data.result as Record<string, unknown>))
          ? data.result
          : (data.result as Record<string, unknown> | null)?.partialResult ??
            data.result)
      : null;

  return NextResponse.json({
    job: {
      ...data,
      status,
      displayStatus: status,
      progress,
      result: campaignResult,
      executionResult,
      error: status === "failed" ? data.error ?? "Job fehlgeschlagen" : null,
    },
  });
}
