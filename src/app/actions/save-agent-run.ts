"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AgentOutputs } from "@/lib/agent/types";

export async function saveAgentRun(
  userGoal: string,
  outputs: AgentOutputs,
  totalCreditsUsed: number
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Nicht eingeloggt." };
  }

  const { error } = await supabase.from("generations").insert({
    user_id: user.id,
    type: "master-agent",
    prompt: userGoal.slice(0, 500),
    credits_used: totalCreditsUsed,
    result: outputs,
  });

  if (error) {
    console.error("[save-agent-run]", error.message);
    return { success: false, error: "Speichern fehlgeschlagen." };
  }

  return { success: true };
}
