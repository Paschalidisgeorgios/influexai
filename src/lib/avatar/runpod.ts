type SubmitRunPodJobInput = {
  jobId: string;
  sourceImageUrl: string;
  drivingVideoUrl: string;
  options: Record<string, unknown>;
};

export function isRunPodConfigured(): boolean {
  return Boolean(
    process.env.RUNPOD_API_KEY?.trim() &&
      process.env.RUNPOD_ENDPOINT_ID?.trim()
  );
}

export async function submitRunPodJob(
  input: SubmitRunPodJobInput
): Promise<{ runpodJobId: string }> {
  const apiKey = process.env.RUNPOD_API_KEY;
  const endpointId = process.env.RUNPOD_ENDPOINT_ID;

  if (!apiKey || !endpointId) {
    throw new Error("RunPod ist nicht konfiguriert.");
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const callbackUrl = `${baseUrl}/api/avatar/runpod-callback`;

  const res = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        jobId: input.jobId,
        sourceImageUrl: input.sourceImageUrl,
        drivingVideoUrl: input.drivingVideoUrl,
        options: input.options,
        callbackUrl,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RunPod API error: ${text}`);
  }

  const data = (await res.json()) as { id?: string };
  if (!data.id) {
    throw new Error("RunPod API returned no job id");
  }

  return { runpodJobId: data.id };
}
