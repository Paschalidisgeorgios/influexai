"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  authInputClass,
  authLabelClass,
  authButtonClass,
  authLinkAccentClass,
} from "@/components/auth/auth-input-classes";

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
      <h1 className="mb-2 text-2xl font-semibold text-white">
        {t("forgot_title")}
      </h1>
      <p className="mb-8 text-sm text-white/60">{t("forgot_subtitle")}</p>

      {sent ? (
        <div className="mb-6 rounded-xl border border-[#ccff00]/25 bg-[#ccff00]/10 p-4 text-sm text-[#ccff00]">
          {t("forgot_sent")}
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading ? "…" : t("forgot_submit")}
            </button>
          </form>
        </>
      )}

      <p className="mt-8 text-center text-sm text-white/50">
        <Link href="/auth/sign-in" className={authLinkAccentClass}>
          {t("login_link")}
        </Link>
      </p>
    </div>
  );
}
