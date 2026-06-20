"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCredentialSection } from "@/components/auth/AuthCredentialSection";
import { setLastAuthProvider } from "@/lib/auth-last-used";
import {
  agencyWorkspaceAccessFromRows,
  isTenantAccessibleForAgency,
} from "@/lib/agency-access";
import {
  DEFAULT_ADMIN_EMAIL_ALLOWLIST,
  isEmailInAdminAllowlist,
  parseAdminEmailAllowlist,
} from "@/lib/admin-allowlist";
import { resolvePostAuthRedirect } from "@/lib/auth-redirect";
import { InfluexButton, InfluexInput } from "@/components/shared/influex";
import {
  supabaseAnonKeyRef,
  supabaseUrlRef,
} from "@/lib/supabase/env-guard";

function supabaseEnvMismatch(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const urlRef = supabaseUrlRef(supabaseUrl);
  const keyRef = supabaseAnonKeyRef(anonKey);
  return Boolean(urlRef && keyRef && urlRef !== keyRef);
}

function LoginPageInner() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      setError(t("fill_fields"));
      return;
    }
    setLoading(true);
    setError("");
    if (supabaseEnvMismatch()) {
      setError(
        "Anmeldedienst falsch konfiguriert (Supabase URL/Key mismatch). Preview-Env prüfen und redeployen."
      );
      setLoading(false);
      return;
    }
    const normalizedEmail = email.trim();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (signInError) {
      setError(
        supabaseEnvMismatch()
          ? "Anmeldedienst falsch konfiguriert (Supabase URL/Key mismatch)."
          : t("bad_credentials")
      );
      setLoading(false);
      return;
    }

    setLastAuthProvider("email");

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

      const postAuthAllowlist = parseAdminEmailAllowlist(
        process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST
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
        (candidateEmail) =>
          isEmailInAdminAllowlist(candidateEmail, postAuthAllowlist) ||
          isEmailInAdminAllowlist(candidateEmail, DEFAULT_ADMIN_EMAIL_ALLOWLIST),
        agencyAccess
      );
    }

    window.location.assign(target);
    return;
  };

  return (
    <div className="w-full">
      <h1 className="influex-auth-form__title">{t("login_title")}</h1>
      <p className="influex-auth-form__subtitle">{t("login_subtitle")}</p>

      {error ? <div className="influex-auth-alert influex-auth-alert--error">{error}</div> : null}

      <AuthCredentialSection
        redirectPath={searchParams.get("redirect")}
        onError={(message) => setError(message)}
      >
        <form className="space-y-4" onSubmit={handleLogin}>
          <InfluexInput
            label={t("email")}
            type="email"
            data-testid="auth-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.com"
            autoComplete="email"
          />

          <div>
            <div className="influex-auth-form__label-row">
              <label htmlFor="auth-login-password" className="influex-field__label">
                {t("password")}
              </label>
              <Link href="/forgot-password" className="influex-auth-form__forgot">
                {t("forgot_password")}
              </Link>
            </div>
            <input
              id="auth-login-password"
              type="password"
              data-testid="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="influex-input"
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <InfluexButton type="submit" loading={loading} className="w-full">
            {t("login_button")}
          </InfluexButton>
        </form>
      </AuthCredentialSection>

      <p className="influex-auth-form__footer">
        {t("no_account")}{" "}
        <Link href="/auth/sign-up" className="influex-auth-form__footer-link">
          {t("signup_link")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full text-sm text-[var(--influex-text-muted)]">…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
