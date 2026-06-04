"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { AGENCY_PLANS, type AgencyPlanId } from "@/lib/agency-plans";
import type { Tenant } from "@/lib/tenant";
import { isTenantAccessible } from "@/lib/tenant";
import { randomBytes } from "crypto";

export type AgencyMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  credits: number;
  created_at: string;
  tenant_role: string | null;
  last_activity: string | null;
  generation_count: number;
};

export type AgencyDashboardData = {
  tenant: Tenant;
  members: AgencyMember[];
  invites: {
    id: string;
    email: string;
    role: string;
    created_at: string;
    accepted_at: string | null;
  }[];
  usedSeats: number;
  plan: (typeof AGENCY_PLANS)[AgencyPlanId];
};

export type AgencyDashboardResult = { error: string } | AgencyDashboardData;

type TenantOwnerContext =
  | { error: string }
  | {
      user: { id: string };
      tenant: Tenant;
      service: ReturnType<typeof createServiceSupabaseClient>;
    };

async function requireTenantOwner(): Promise<TenantOwnerContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt." };

  const service = createServiceSupabaseClient();
  const { data: tenant } = await service
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!tenant) return { error: "Keine Agentur gefunden." };
  return { user, tenant, service };
}

export async function getAgencyDashboard(): Promise<AgencyDashboardResult> {
  const ctx = await requireTenantOwner();
  if ("error" in ctx) return { error: ctx.error };

  const { tenant, service } = ctx;

  const { data: members } = await service
    .from("profiles")
    .select("id, email, full_name, credits, created_at, tenant_role")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const memberRows: AgencyMember[] = [];
  for (const m of members ?? []) {
    const { count } = await service
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", m.id);

    const { data: lastGen } = await service
      .from("generations")
      .select("created_at")
      .eq("user_id", m.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    memberRows.push({
      ...m,
      tenant_role: m.tenant_role,
      last_activity: lastGen?.created_at ?? null,
      generation_count: count ?? 0,
    });
  }

  const { data: invites } = await service
    .from("tenant_invites")
    .select("id, email, role, created_at, accepted_at")
    .eq("tenant_id", tenant.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  const usedSeats = (members ?? []).length;

  return {
    tenant: tenant as Tenant,
    members: memberRows,
    invites: invites ?? [],
    usedSeats,
    plan: AGENCY_PLANS[tenant.plan as AgencyPlanId],
  };
}

export async function inviteTenantMember(
  email: string,
  role: "admin" | "member"
) {
  const ctx = await requireTenantOwner();
  if ("error" in ctx) return { success: false, error: ctx.error };

  const { tenant, service } = ctx;
  const used = await service
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  if ((used.count ?? 0) >= tenant.max_seats) {
    return { success: false, error: "Alle Seats belegt. Upgrade deinen Plan." };
  }

  const token = randomBytes(24).toString("hex");
  const { error } = await service.from("tenant_invites").insert({
    tenant_id: tenant.id,
    email: email.trim().toLowerCase(),
    role,
    token,
  });

  if (error) return { success: false, error: error.message };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://influexaicreator.com";
  const inviteUrl = `${baseUrl}/join?token=${token}`;

  return { success: true, inviteUrl };
}

export async function acceptTenantInvite(token: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Bitte zuerst anmelden." };

  const service = createServiceSupabaseClient();
  const { data: invite } = await service
    .from("tenant_invites")
    .select("id, tenant_id, email, role")
    .eq("token", token)
    .is("accepted_at", null)
    .maybeSingle();

  if (!invite)
    return { success: false, error: "Einladung ungültig oder abgelaufen." };

  const { data: tenantRow } = await service
    .from("tenants")
    .select("name, is_active, deactivated_at, max_seats")
    .eq("id", invite.tenant_id)
    .single();

  const tenant = tenantRow as Pick<
    Tenant,
    "name" | "is_active" | "deactivated_at" | "max_seats"
  >;
  if (!tenant || !isTenantAccessible(tenant as Tenant)) {
    return { success: false, error: "Diese Agentur ist derzeit nicht aktiv." };
  }

  const { count } = await service
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", invite.tenant_id);

  if ((count ?? 0) >= tenant.max_seats) {
    return { success: false, error: "Keine freien Seats mehr." };
  }

  await service
    .from("profiles")
    .update({
      tenant_id: invite.tenant_id,
      tenant_role: invite.role,
    })
    .eq("id", user.id);

  await service
    .from("tenant_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return { success: true, tenantName: tenant.name };
}

export async function getInviteByToken(token: string) {
  const service = createServiceSupabaseClient();
  const { data: invite } = await service
    .from("tenant_invites")
    .select("email, role, tenant_id")
    .eq("token", token)
    .is("accepted_at", null)
    .maybeSingle();

  if (!invite) return null;

  const { data: tenant } = await service
    .from("tenants")
    .select("name, slug, primary_color, logo_url")
    .eq("id", invite.tenant_id)
    .single();

  return { ...invite, tenants: tenant };
}

export async function transferCreditsToMember(
  memberId: string,
  amount: number
) {
  const ctx = await requireTenantOwner();
  if ("error" in ctx) return { success: false, error: ctx.error };
  if (amount <= 0) return { success: false, error: "Ungültiger Betrag." };

  const { tenant, service } = ctx;

  if (tenant.credits_pool < amount) {
    return { success: false, error: "Nicht genug Credits im Pool." };
  }

  const { data: member } = await service
    .from("profiles")
    .select("id, credits, tenant_id")
    .eq("id", memberId)
    .eq("tenant_id", tenant.id)
    .single();

  if (!member) return { success: false, error: "Mitglied nicht gefunden." };

  await service
    .from("tenants")
    .update({ credits_pool: tenant.credits_pool - amount })
    .eq("id", tenant.id);

  await service
    .from("profiles")
    .update({ credits: (member.credits ?? 0) + amount })
    .eq("id", memberId);

  await service.from("credit_transactions").insert([
    {
      user_id: ctx.user.id,
      amount: -amount,
      description: `Credits an Team-Mitglied (${amount})`,
    },
    {
      user_id: memberId,
      amount,
      description: `Credits von Agentur (${tenant.name})`,
    },
  ]);

  return { success: true };
}

export async function removeTenantMember(memberId: string) {
  const ctx = await requireTenantOwner();
  if ("error" in ctx) return { success: false, error: ctx.error };

  if (memberId === ctx.user.id) {
    return { success: false, error: "Du kannst dich nicht selbst entfernen." };
  }

  const { error } = await ctx.service
    .from("profiles")
    .update({ tenant_id: null, tenant_role: null })
    .eq("id", memberId)
    .eq("tenant_id", ctx.tenant.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateTenantBranding(input: {
  name?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  custom_domain?: string;
}) {
  const ctx = await requireTenantOwner();
  if ("error" in ctx) return { success: false, error: ctx.error };

  const updates: Record<string, string | null> = {};
  if (input.name?.trim()) updates.name = input.name.trim();
  if (input.primary_color) updates.primary_color = input.primary_color;
  if (input.secondary_color) updates.secondary_color = input.secondary_color;
  if (input.logo_url !== undefined) updates.logo_url = input.logo_url;
  if (input.custom_domain !== undefined) {
    updates.custom_domain = input.custom_domain.trim() || null;
  }

  const { error } = await ctx.service
    .from("tenants")
    .update(updates)
    .eq("id", ctx.tenant.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getOwnedTenant() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceSupabaseClient();
  const { data } = await service
    .from("tenants")
    .select("id, name, slug, plan, is_active")
    .eq("owner_id", user.id)
    .maybeSingle();

  return data;
}
