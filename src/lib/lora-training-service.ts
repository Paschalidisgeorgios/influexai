import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { addCredits } from "@/lib/credits";
import { sendLoraFailedEmail, sendLoraReadyEmail } from "@/lib/lora-email";
import { invokePushNotification } from "@/lib/push-notifications";

async function getUserEmail(userId: string): Promise<string | null> {
  const service = createServiceSupabaseClient();
  const { data } = await service.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

export async function markLoraReady(
  loraId: string,
  userId: string,
  loraUrl: string
): Promise<void> {
  const service = createServiceSupabaseClient();
  const { data: row } = await service
    .from("lora_models")
    .select("name, trigger_word, status")
    .eq("id", loraId)
    .eq("user_id", userId)
    .single();

  if (!row || row.status === "ready") return;

  await service
    .from("lora_models")
    .update({
      status: "ready",
      lora_url: loraUrl,
      completed_at: new Date().toISOString(),
      progress: 100,
      error_message: null,
    })
    .eq("id", loraId);

  const email = await getUserEmail(userId);
  if (email) {
    void sendLoraReadyEmail(email, row.name, row.trigger_word);
  }

  void invokePushNotification({
    userId,
    type: "LORA_READY",
    variables: { name: row.name },
  });
}

export async function markLoraFailed(
  loraId: string,
  userId: string,
  message: string
): Promise<void> {
  const service = createServiceSupabaseClient();

  const { data: row } = await service
    .from("lora_models")
    .select("name, credits_used, status")
    .eq("id", loraId)
    .eq("user_id", userId)
    .single();

  if (!row || row.status === "failed") return;

  await service
    .from("lora_models")
    .update({
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", loraId);

  const creditsUsed = row.credits_used ?? 0;
  if (creditsUsed > 0) {
    await addCredits(
      service,
      userId,
      creditsUsed,
      `LoRA Training refund — ${row.name}`
    );
  }

  const email = await getUserEmail(userId);
  if (email) {
    void sendLoraFailedEmail(email, row.name);
  }
}
