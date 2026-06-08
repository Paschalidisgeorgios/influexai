"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthGreetingLine } from "@/components/auth/auth-greeting-line";
import {
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-input-classes";
import {
  agencyWorkspaceAccessFromRows,
  isTenantAccessibleForAgency,
} from "@/lib/agency-access";
import { resolvePostAuthRedirect } from "@/lib/auth-redirect";

function LoginPageInner() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      setError(t("fill_fields"));
      return;
    }
    setLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(t("bad_credentials"));
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let target = "/dashboard";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role, plan, agency_plan")
        .eq("id", user.id)
        .single();

      const { data: tenant } = await supabase
        .from("tenants")
        .select("is_active, deactivated_at")
        .eq("owner_id", user.id)
        .maybeSingle();

      const agencyAccess = agencyWorkspaceAccessFromRows(
        profile?.agency_plan,
        tenant && isTenantAccessibleForAgency(tenant) ? tenant : null
      );

      target = resolvePostAuthRedirect(
        {
          email: user.email,
          is_admin: profile?.is_admin,
          role: profile?.role,
          plan: profile?.plan,
          id: user.id,
        },
        searchParams.get("redirect"),
        undefined,
        agencyAccess
      );
    }

    router.replace(target);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto relative">
      <div className="absolute top-0 right-0 lg:-top-2">
        <LanguageSwitcher compact />
      </div>

      <div className="lg:hidden text-[#B4FF00] font-bold text-xl mb-8 font-[family-name:var(--font-bebas)] tracking-wide">
        InfluexAI
      </div>

      <AuthGreetingLine />

      <h1 className="text-white text-2xl font-semibold mb-2">
        {t("login_title")}
      </h1>
      <p className="text-white/70 text-sm mb-8">{t("login_subtitle")}</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className={authLabelClass}>{t("email")}</label>
          <input
            type="email"
            data-testid="auth-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.com"
            className={authInputClass}
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className={authLabelClass}>{t("password")}</label>
            <Link
              href="/forgot-password"
              className="text-white/65 text-xs hover:text-[#B4FF00] transition-colors"
            >
              {t("forgot_password")}
            </Link>
          </div>
          <input
            type="password"
            data-testid="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={authInputClass}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B4FF00] text-black font-semibold py-3 rounded-xl hover:bg-[#c8ff33] active:scale-[0.98] transition-all text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "…" : t("login_button")}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/20 text-xs">{t("divider")}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <p className="text-center text-white/70 text-sm">
        {t("no_account")}{" "}
        <Link href="/auth/sign-up" className="text-[#B4FF00] hover:underline">
          {t("signup_link")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm mx-auto text-white/70 text-sm">…</div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
