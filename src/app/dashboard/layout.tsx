import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { DashboardLayoutClient } from "./dashboard-layout-client";
import MelodiaWidget from "@/components/melodia/MelodiaWidget";

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
  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
      <MelodiaWidget userName={profile?.full_name ?? user.email?.split("@")[0]} />
    </Suspense>
  );
}
