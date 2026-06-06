import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  if (
    !isAdminUser({
      email: user.email,
      is_admin: profile?.is_admin,
      role: profile?.role,
    })
  ) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
