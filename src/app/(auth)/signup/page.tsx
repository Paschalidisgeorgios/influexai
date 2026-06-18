"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { validateBetaCode } from "@/app/actions/beta";
import { trackAbEvent } from "@/lib/ab-tracking";
import { AuthCredentialSection } from "@/components/auth/AuthCredentialSection";
import { setLastAuthProvider } from "@/lib/auth-last-used";
import { resolvePostAuthRedirect } from "@/lib/auth-redirect";
import {
  agencyWorkspaceAccessFromRows,
  isTenantAccessibleForAgency,
} from "@/lib/agency-access";
import {
  getPasswordStrength,
  strengthBarColors,
} from "@/lib/password-strength";
import { isSignupEmailAlreadyRegistered } from "@/lib/signup-email-exists";
import { InfluexButton, InfluexInput, InfluexSurface } from "@/components/shared/influex";

const REFERRAL_STORAGE_KEY = "referral_code";
const BETA_STORAGE_KEY = "beta_code";

function SignupPageInner() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [betaCode, setBetaCode] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const strength = getPasswordStrength(password);
  const strengthLabelKeys = [
    "password_too_short",
    "password_weak",
    "password_medium",
    "password_strong",
  ] as const;

  useEffect(() => {
    const beta = searchParams.get("beta");
    if (beta) {
      const code = beta.trim().toUpperCase();
      setBetaCode(code);
      try {
        localStorage.setItem(BETA_STORAGE_KEY, code);
      } catch {
        /* ignore */
      }
    } else {
      try {
        const stored = localStorage.getItem(BETA_STORAGE_KEY);
        if (stored) setBetaCode(stored.trim().toUpperCase());
      } catch {
        /* ignore */
      }
    }

    const refFromUrl = searchParams.get("ref")?.trim();
    const refFromCookie =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((c) => c.startsWith("influexai_ref="))
            ?.split("=")[1]
        : undefined;
    const ref = refFromUrl || refFromCookie;
    if (ref) {
      const stored = decodeURIComponent(ref);
      setReferralCode(stored);
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, stored);
      } catch {
        /* ignore */
      }
    } else {
      try {
        const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
        if (stored) setReferralCode(stored);
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password || !name) {
      setError(t("fill_fields"));
      return;
    }
    if (password.length < 8) {
      setError(t("password_too_short"));
      return;
    }
    if (getPasswordStrength(password) < 2) {
      setError(t("password_weak"));
      return;
    }
    setLoading(true);
    setError("");
    setEmailAlreadyExists(false);

    const ref =
      referralCode ||
      (typeof window !== "undefined"
        ? localStorage.getItem(REFERRAL_STORAGE_KEY)
        : null);

    const beta =
      betaCode ||
      (typeof window !== "undefined"
        ? localStorage.getItem(BETA_STORAGE_KEY)
        : null);

    if (beta) {
      const betaValidation = await validateBetaCode(beta.trim().toUpperCase());
      if (!betaValidation.valid) {
        setError(betaValidation.error ?? t("signup.generic_error"));
        setLoading(false);
        return;
      }
    }

    const redirectAfterConfirm =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectAfterConfirm,
        data: {
          full_name: name,
          ...(ref ? { referred_by: ref } : {}),
          ...(beta ? { beta_code: beta.trim().toUpperCase() } : {}),
        },
      },
    });

    if (
      isSignupEmailAlreadyRegistered({
        error: signUpError,
        user: data.user,
        session: data.session,
      })
    ) {
      setEmailAlreadyExists(true);
      setLoading(false);
      return;
    }

    if (signUpError) {
      setError(t("signup.generic_error"));
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      try {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        localStorage.removeItem(BETA_STORAGE_KEY);
      } catch {
        /* ignore */
      }

      setLastAuthProvider("email");
      void trackAbEvent("signup_complete");
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role, plan, agency_plan")
        .eq("id", data.user.id)
        .single();

      const { data: tenant } = await supabase
        .from("tenants")
        .select("is_active, deactivated_at")
        .eq("owner_id", data.user.id)
        .maybeSingle();

      const agencyAccess = agencyWorkspaceAccessFromRows(
        profile?.agency_plan,
        tenant && isTenantAccessibleForAgency(tenant) ? tenant : null
      );

      const target = resolvePostAuthRedirect(
        {
          email: data.user.email,
          is_admin: profile?.is_admin,
          role: profile?.role,
          plan: profile?.plan,
          id: data.user.id,
        },
        searchParams.get("redirect"),
        undefined,
        agencyAccess
      );

      router.replace(target);
      router.refresh();
      setLoading(false);
      return;
    }

    void trackAbEvent("signup_complete");
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="influex-auth-success-icon" aria-hidden>
          ✉
        </div>
        <h2 className="influex-auth-form__title">{t("verify_email_title")}</h2>
        <p className="influex-auth-form__subtitle">
          {t("verify_email_body")}{" "}
          <strong className="text-[var(--influex-text)]">{email}</strong>
          {betaCode && (
            <>
              <br />
              <br />
              <span className="text-[var(--influex-lime)]">50% Erstkauf-Rabatt</span> und
              Lifetime-Rabatt werden nach der Bestätigung aktiviert.
            </>
          )}
          {referralCode && !betaCode && (
            <>
              <br />
              <br />
              <span className="text-[var(--influex-lime)]">5 Bonus-Credits</span> nach
              Bestätigung.
            </>
          )}
        </p>
        <InfluexButton href="/auth/sign-in">{t("login_link")}</InfluexButton>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="influex-auth-form__title">{t("signup_title")}</h1>
      <p className="influex-auth-form__subtitle">{t("signup_subtitle")}</p>

      <AuthCredentialSection
        redirectPath={searchParams.get("redirect")}
        onError={(message) => setError(message)}
      >
        {betaCode ? (
          <InfluexSurface variant="muted" className="mb-4 p-3 text-sm">
            <p className="font-semibold text-[var(--influex-lime)]">
              Beta — 50% Erstkauf + 20% Lifetime
            </p>
            <p className="mt-1 text-xs text-[var(--influex-text-muted)]">Code: {betaCode}</p>
          </InfluexSurface>
        ) : null}

        {referralCode ? (
          <InfluexSurface variant="muted" className="mb-4 p-3 text-sm">
            <p className="font-semibold text-[var(--influex-lime)]">
              5 Bonus-Credits — Einladung
            </p>
            <p className="mt-1 text-xs text-[var(--influex-text-muted)]">Code: {referralCode}</p>
          </InfluexSurface>
        ) : null}

        {emailAlreadyExists ? (
          <div className="influex-auth-alert influex-auth-alert--warning" role="alert">
            <p className="mb-1.5 font-semibold">{t("signup.emailAlreadyExists.title")}</p>
            <p className="mb-4 text-sm leading-relaxed opacity-90">
              {t("signup.emailAlreadyExists.description")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <InfluexButton href="/auth/sign-in" className="flex-1">
                {t("signup.emailAlreadyExists.login")}
              </InfluexButton>
              <InfluexButton href="/forgot-password" variant="secondary" className="flex-1">
                {t("signup.emailAlreadyExists.resetPassword")}
              </InfluexButton>
            </div>
          </div>
        ) : null}

        {error && !emailAlreadyExists ? (
          <div className="influex-auth-alert influex-auth-alert--error">{error}</div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSignup}>
          <InfluexInput
            label={t("name")}
            type="text"
            data-testid="auth-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            autoComplete="name"
          />

          <InfluexInput
            label={t("email")}
            type="email"
            data-testid="auth-email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailAlreadyExists) setEmailAlreadyExists(false);
            }}
            placeholder="deine@email.com"
            autoComplete="email"
          />

          <div>
            <InfluexInput
              label={t("password")}
              type="password"
              data-testid="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <div className="influex-auth-strength">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`influex-auth-strength__bar ${
                    i < strength && strength > 0 ? strengthBarColors[strength - 1] : ""
                  }`}
                />
              ))}
            </div>
            {password.length > 0 && strength > 0 ? (
              <p className="influex-auth-strength__hint">
                {t(strengthLabelKeys[Math.min(strength - 1, 3)])}
              </p>
            ) : null}
          </div>

          <InfluexButton type="submit" loading={loading} className="w-full">
            {t("signup_button")}
          </InfluexButton>
        </form>

        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--influex-text-muted)]">
          {t("terms_text")}{" "}
          <Link
            href="/agb"
            className="text-[var(--influex-text-secondary)] underline transition-colors hover:text-[var(--influex-lime)]"
          >
            {t("terms_link")}
          </Link>
        </p>
      </AuthCredentialSection>

      <p className="influex-auth-form__footer">
        {t("has_account")}{" "}
        <Link href="/auth/sign-in" className="influex-auth-form__footer-link">
          {t("login_link")}
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="w-full text-sm text-[var(--influex-text-muted)]">…</div>}>
      <SignupPageInner />
    </Suspense>
  );
}
