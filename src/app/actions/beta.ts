"use server";

import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  BETA_MAX_SPOTS,
  firstNameOnly,
  generateBetaCode,
  relativeTimeDe,
} from "@/lib/beta";
import { sendBetaWelcomeEmail } from "@/lib/beta-email";
import {
  getOrCreateBetaFirstPurchaseCouponId,
  getOrCreateBetaLifetimeCouponId,
} from "@/lib/beta-stripe";

export type BetaRecentSignup = {
  displayName: string;
  niche: string;
  relativeTime: string;
};

export type BetaPublicStats = {
  taken: number;
  total: number;
  spotsLeft: number;
  recent: BetaRecentSignup[];
};

async function getAdminSupabase() {
  try {
    return createServiceSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

export async function getBetaPublicStats(): Promise<BetaPublicStats> {
  const supabase = await getAdminSupabase();

  const { count } = await supabase
    .from("beta_signups")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const taken = count ?? 0;
  const spotsLeft = Math.max(0, BETA_MAX_SPOTS - taken);

  const { data: recentRows } = await supabase
    .from("beta_signups")
    .select("name, niche, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  const recent: BetaRecentSignup[] = (recentRows ?? []).map((r) => ({
    displayName: firstNameOnly(r.name),
    niche: (r.niche?.split("&")[0] ?? r.niche ?? "Creator").trim(),
    relativeTime: relativeTimeDe(r.created_at),
  }));

  return {
    taken,
    total: BETA_MAX_SPOTS,
    spotsLeft,
    recent,
  };
}

type JoinSuccess = {
  success: true;
  code: string;
  waitlisted?: false;
};

type JoinWaitlisted = {
  success: true;
  waitlisted: true;
};

type JoinFailure = { success: false; error: string };

export async function joinBeta(input: {
  email: string;
  name?: string;
  niche: string;
}): Promise<JoinSuccess | JoinWaitlisted | JoinFailure> {
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Bitte gib eine gültige E-Mail ein." };
  }

  const supabase = await getAdminSupabase();

  const { data: existing } = await supabase
    .from("beta_signups")
    .select("code, status")
    .eq("email", email)
    .maybeSingle();

  if (existing?.status === "active" && existing.code) {
    await sendBetaWelcomeEmail(email, existing.code, firstNameOnly(input.name));
    return { success: true, code: existing.code };
  }

  const { count } = await supabase
    .from("beta_signups")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if ((count ?? 0) >= BETA_MAX_SPOTS) {
    return { success: false, error: "FULL" };
  }

  const code = generateBetaCode();

  const { error } = await supabase.from("beta_signups").insert({
    email,
    name: input.name?.trim() || null,
    niche: input.niche,
    code,
    status: "active",
  });

  if (error) {
    if (error.code === "23505") {
      const { data: row } = await supabase
        .from("beta_signups")
        .select("code")
        .eq("email", email)
        .single();
      if (row?.code) return { success: true, code: row.code };
    }
    console.error("joinBeta:", error.message);
    return {
      success: false,
      error: "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
    };
  }

  await sendBetaWelcomeEmail(email, code, firstNameOnly(input.name));

  return { success: true, code };
}

export async function joinBetaWaitlist(input: {
  email: string;
  name?: string;
  niche: string;
}): Promise<{ success: true } | JoinFailure> {
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Bitte gib eine gültige E-Mail ein." };
  }

  const supabase = await getAdminSupabase();

  const { data: existing } = await supabase
    .from("beta_signups")
    .select("status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { success: true };
  }

  const { error } = await supabase.from("beta_signups").insert({
    email,
    name: input.name?.trim() || null,
    niche: input.niche,
    code: generateBetaCode(),
    status: "waitlisted",
  });

  if (error && error.code !== "23505") {
    return { success: false, error: "Warteliste fehlgeschlagen." };
  }

  return { success: true };
}

/** Apply beta perks when user completes signup with ?beta=CODE */
export async function applyBetaOnSignup(
  userId: string,
  codeRaw: string
): Promise<{ ok: boolean; error?: string }> {
  const code = codeRaw.trim().toUpperCase();
  if (!code.startsWith("BETA-")) {
    return { ok: false, error: "Ungültiger Beta-Code." };
  }

  const supabase = await getAdminSupabase();

  const { data: beta } = await supabase
    .from("beta_signups")
    .select("*")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();

  if (!beta) {
    return { ok: false, error: "Beta-Code nicht gefunden." };
  }

  if (beta.converted_to_user && beta.user_id && beta.user_id !== userId) {
    return { ok: false, error: "Code wurde bereits verwendet." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, email, full_name")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { ok: false, error: "Profil nicht gefunden." };
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      is_beta: true,
      beta_code: code,
      ...(beta.name && !profile.full_name ? { full_name: beta.name } : {}),
    })
    .eq("id", userId);

  if (profileErr) {
    console.error("applyBetaOnSignup profile:", profileErr.message);
    return { ok: false, error: "Beta konnte nicht aktiviert werden." };
  }

  await supabase
    .from("beta_signups")
    .update({
      converted_to_user: true,
      user_id: userId,
    })
    .eq("id", beta.id);

  await getOrCreateBetaFirstPurchaseCouponId();
  await getOrCreateBetaLifetimeCouponId();

  return { ok: true };
}
