import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { isAdminUser } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminLayout({
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

  return (
    <div className="min-h-dvh bg-[#050506] text-[#F0EFE8]">
      <nav className="flex items-center justify-between gap-4 border-b border-white/[0.07] bg-[#0a0a0c] px-4 py-3.5 md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sm font-bold text-white/85">
            I
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide text-white/90">
              Influex<span className="text-white/50">AI</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
              Admin
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/admin/blog"
            className="hidden rounded-lg px-2.5 py-1.5 text-[0.82rem] font-medium text-white/55 no-underline transition-colors hover:bg-white/[0.04] hover:text-white/80 sm:inline"
          >
            Blog
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-2.5 py-1.5 text-[0.82rem] font-medium text-white/55 no-underline transition-colors hover:bg-white/[0.04] hover:text-white/80"
          >
            Studio
          </Link>
          <AdminSignOutButton />
        </div>
      </nav>
      <main className="px-4 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
