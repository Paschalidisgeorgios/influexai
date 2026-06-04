"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  authInputClass,
  authLabelClass,
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
    const redirectTo = `${window.location.origin}/auth/callback?next=/login`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="w-full max-w-sm mx-auto relative">
      <div className="absolute top-0 right-0 lg:-top-2">
        <LanguageSwitcher compact />
      </div>

      <h1 className="text-white text-2xl font-semibold mb-2">
        {t("forgot_title")}
      </h1>
      <p className="text-white/40 text-sm mb-8">{t("forgot_subtitle")}</p>

      {sent ? (
        <div className="p-4 rounded-xl bg-[#B4FF00]/10 border border-[#B4FF00]/25 text-[#B4FF00] text-sm mb-6">
          {t("forgot_sent")}
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B4FF00] text-black font-semibold py-3 rounded-xl hover:bg-[#c8ff33] active:scale-[0.98] transition-all text-sm disabled:opacity-60"
            >
              {loading ? "…" : t("forgot_submit")}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-white/40 text-sm mt-8">
        <Link href="/login" className="text-[#B4FF00] hover:underline">
          {t("login_link")}
        </Link>
      </p>
    </div>
  );
}
