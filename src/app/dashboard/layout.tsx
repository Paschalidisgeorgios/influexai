import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAgencyOnlyDashboardAccess } from "@/lib/agency-access.server";
import { hasActivePlan } from "@/lib/access";
import { isPlatformAdminServer } from "@/lib/platform-admin.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { DashboardLayoutClient } from "./dashboard-layout-client";

export const dynamic = "force-dynamic";

/** Claude flows (Outlier, Niche, Script) can exceed 10s — requires Vercel Pro (60s+) */
export const maxDuration = 60;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, role, is_admin")
    .eq("id", user.id)
    .single();

  const accessUser = {
    email: user.email,
    plan: profile?.plan,
    role: profile?.role,
    is_admin: profile?.is_admin,
  };

  if (
    !isPlatformAdminServer(accessUser) &&
    !hasActivePlan(accessUser)
  ) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/dashboard";
    const agencyDecision = await resolveAgencyOnlyDashboardAccess(
      user.id,
      pathname
    );

    if (agencyDecision.action === "redirect") {
      redirect(agencyDecision.target);
    }
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </Suspense>
  );
}
