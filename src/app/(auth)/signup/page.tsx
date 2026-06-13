"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerReferralOnSignup } from "@/app/actions/referral";
import { invokeWelcomeNurtureEmail } from "@/lib/nurture-email";
import { trackAbEvent } from "@/lib/ab-tracking";
import { applyBetaOnSignup } from "@/app/actions/beta";
import { AuthCredentialSection } from "@/components/auth/AuthCredentialSection";
import {
  authInputClass,
  authLabelClass,
  authButtonClass,
  authLinkAccentClass,
  authTitleClass,
} from "@/components/auth/auth-input-classes";
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
    if (password.length < 6) {
      setError(t("password_too_short"));
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

    if (data.user && ref) {
      await registerReferralOnSignup(data.user.id, ref);
      try {
        await fetch("/api/referral/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ref }),
        });
      } catch {
        /* registerReferralOnSignup already ran */
      }
      try {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }

    if (data.user) {
      void invokeWelcomeNurtureEmail(data.user.id);
      if (beta) {
        await applyBetaOnSignup(data.user.id, beta.trim().toUpperCase());
        try {
          localStorage.removeItem(BETA_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }

    if (data.session && data.user) {
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
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ccff00]/25 bg-[#ccff00]/10">
          <span className="text-2xl" aria-hidden>
            ✉
          </span>
        </div>
        <h2 className="mb-3 text-2xl font-semibold text-white">
          {t("verify_email_title")}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-white/75">
          {t("verify_email_body")}{" "}
          <strong className="text-white">{email}</strong>
          {betaCode && (
            <>
              <br />
              <br />
              <span className="text-[#ccff00]">50% Erstkauf-Rabatt</span> und
              Lifetime-Rabatt werden nach der Bestätigung aktiviert.
            </>
          )}
          {referralCode && !betaCode && (
            <>
              <br />
              <br />
              <span className="text-[#ccff00]">5 Bonus-Credits</span> nach
              Bestätigung.
            </>
          )}
        </p>
        <Link href="/auth/sign-in" className={`inline-block ${authButtonClass}`}>
          {t("login_link")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className={authTitleClass}>{t("signup_title")}</h1>

      <p className="mb-6 text-sm text-zinc-400">{t("signup_subtitle")}</p>

      <AuthCredentialSection
        redirectPath={searchParams.get("redirect")}
        onError={(message) => setError(message)}
      >
      {betaCode && (
        <div className="mb-4 rounded-xl border border-[#ccff00]/25 bg-[#ccff00]/10 p-3 text-sm">
          <p className="font-semibold text-[#ccff00]">
            🔥 Beta — 50% Erstkauf + 20% Lifetime
          </p>
          <p className="mt-1 text-xs text-white/60">Code: {betaCode}</p>
        </div>
      )}

      {referralCode && (
        <div className="mb-4 rounded-xl border border-[#ccff00]/25 bg-[#ccff00]/10 p-3 text-sm">
          <p className="font-semibold text-[#ccff00]">
            🎁 5 Bonus-Credits — Einladung
          </p>
          <p className="mt-1 text-xs text-white/60">Code: {referralCode}</p>
        </div>
      )}

      {emailAlreadyExists && (
        <div
          className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25"
          role="alert"
        >
          <p className="text-[#F0EFE8] font-semibold text-sm mb-1.5">
            {t("signup.emailAlreadyExists.title")}
          </p>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            {t("signup.emailAlreadyExists.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/auth/sign-in"
              className="flex-1 rounded-lg bg-[#ccff00] py-2.5 text-center text-sm font-bold text-black transition-transform hover:scale-[1.02]"
            >
              {t("signup.emailAlreadyExists.login")}
            </Link>
            <Link
              href="/forgot-password"
              className="flex-1 rounded-lg border border-zinc-800/60 bg-white/[0.03] py-2.5 text-center text-sm font-semibold text-[#F0EFE8] transition-colors hover:border-[#ccff00]/40"
            >
              {t("signup.emailAlreadyExists.resetPassword")}
            </Link>
          </div>
        </div>
      )}

      {error && !emailAlreadyExists && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSignup}>
        <div>
          <label className={authLabelClass}>{t("name")}</label>
          <input
            type="text"
            data-testid="auth-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            className={authInputClass}
            autoComplete="name"
          />
        </div>

        <div>
          <label className={authLabelClass}>{t("email")}</label>
          <input
            type="email"
            data-testid="auth-email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailAlreadyExists) setEmailAlreadyExists(false);
            }}
            placeholder="deine@email.com"
            className={authInputClass}
            autoComplete="email"
          />
        </div>

        <div>
          <label className={authLabelClass}>{t("password")}</label>
          <input
            type="password"
            data-testid="auth-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={authInputClass}
            autoComplete="new-password"
          />
          <div className="flex gap-1 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < strength && strength > 0
                    ? strengthBarColors[strength - 1]
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
          {password.length > 0 && strength > 0 && (
            <p className="text-xs mt-1 text-white/65">
              {t(strengthLabelKeys[Math.min(strength - 1, 3)])}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "…" : t("signup_button")}
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-white/45">
        {t("terms_text")}{" "}
        <Link
          href="/terms"
          className="text-white/55 underline transition-colors hover:text-[#ccff00]"
        >
          {t("terms_link")}
        </Link>
      </p>
      </AuthCredentialSection>

      <p className="mt-8 text-center text-sm text-zinc-500">
        {t("has_account")}{" "}
        <Link href="/auth/sign-in" className={authLinkAccentClass}>
          {t("login_link")}
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full text-white/60 text-sm">…</div>
      }
    >
      <SignupPageInner />
    </Suspense>
  );
}
