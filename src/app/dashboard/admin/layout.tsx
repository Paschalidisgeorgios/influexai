import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  if (!(await isAdminUser())) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
