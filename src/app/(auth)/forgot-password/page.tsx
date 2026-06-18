"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InfluexButton, InfluexInput } from "@/components/shared/influex";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("fill_fields"));
      return;
    }
    setLoading(true);
    setError("");
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="w-full">
      <h1 className="influex-auth-form__title">{t("forgot_title")}</h1>
      <p className="influex-auth-form__subtitle">{t("forgot_subtitle")}</p>

      {sent ? (
        <div className="influex-auth-alert influex-auth-alert--success">{t("forgot_sent")}</div>
      ) : (
        <>
          {error ? (
            <div className="influex-auth-alert influex-auth-alert--error">{error}</div>
          ) : null}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <InfluexInput
              label={t("email")}
              type="email"
              data-testid="auth-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.com"
              autoComplete="email"
            />
            <InfluexButton type="submit" loading={loading} className="w-full">
              {t("forgot_submit")}
            </InfluexButton>
          </form>
        </>
      )}

      <p className="influex-auth-form__footer">
        <Link href="/auth/sign-in" className="influex-auth-form__footer-link">
          {t("login_link")}
        </Link>
      </p>
    </div>
  );
}
