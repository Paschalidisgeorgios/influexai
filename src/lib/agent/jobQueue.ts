// Job Queue Vorbereitung für lange Kampagnen
// Aktuell synchron — später: Vercel Background Functions
// oder Supabase Edge Functions

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

// TODO: Vercel Background Functions anbinden
// https://vercel.com/docs/functions/background-functions
// export async function enqueueJob(job: AgentJob): Promise<string>

// TODO: Supabase Realtime für Job-Status-Updates nutzen
// Client pollt /api/agent/job/[id] für Status

export async function runJobSync(
  job: AgentJob,
  handler: (job: AgentJob) => Promise<unknown>
): Promise<unknown> {
  if (needsJobQueue((job.payload.estimatedCredits as number) ?? 0)) {
    console.warn(
      "[jobQueue] Job überschreitet Schwellenwert.",
      "Job Queue noch nicht implementiert.",
      "Führe synchron aus — kann bei großen Kampagnen langsam sein."
    );
  }
  return handler(job);
}
