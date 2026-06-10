import type { SupabaseClient } from "@supabase/supabase-js";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export type AgentJob = {
  id: string;
  type: "campaign" | "agent";
  userId: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  createdAt: string;
  estimatedDuration?: number;
};

export const JOB_QUEUE_THRESHOLD_CREDITS = 30;
export const JOB_QUEUE_THRESHOLD_ITEMS = 15;

export function needsJobQueue(
  estimatedCredits: number,
  itemCount?: number
): boolean {
  return (
    estimatedCredits >= JOB_QUEUE_THRESHOLD_CREDITS ||
    (itemCount ?? 0) >= JOB_QUEUE_THRESHOLD_ITEMS
  );
}

export async function enqueueJob(
  supabase: SupabaseClient,
  job: {
    type: string;
    userId: string;
    payload: Record<string, unknown>;
    estimatedDuration?: number;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from("agent_jobs")
    .insert({
      type: job.type,
      user_id: job.userId,
      status: "queued",
      payload: job.payload,
      estimated_duration: job.estimatedDuration ?? 60,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateJobProgress(
  supabase: SupabaseClient,
  jobId: string,
  progress: {
    steps: unknown[];
    currentStep: number;
    itemsCount?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("agent_jobs")
    .update({
      status: "running",
      result: { progress },
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateJobStatus(
  supabase: SupabaseClient,
  jobId: string,
  status: JobStatus,
  result?: unknown,
  error?: string
): Promise<void> {
  const patch: Record<string, unknown> = {
    status,
    result: result ?? null,
    error: error ?? null,
    updated_at: new Date().toISOString(),
  };

  if (status === "running") {
    patch.started_at = new Date().toISOString();
  }

  if (status === "completed" || status === "failed") {
    patch.completed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("agent_jobs")
    .update(patch)
    .eq("id", jobId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function getJob(
  supabase: SupabaseClient,
  jobId: string,
  userId: string
): Promise<unknown> {
  const { data } = await supabase
    .from("agent_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function runJobSync(
  job: AgentJob,
  handler: (job: AgentJob) => Promise<unknown>
): Promise<unknown> {
  if (needsJobQueue((job.payload.estimatedCredits as number) ?? 0)) {
    console.warn(
      "[jobQueue] Job überschreitet Schwellenwert.",
      "Nutze enqueueJob für große Kampagnen."
    );
  }
  return handler(job);
}
