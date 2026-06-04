"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthGreetingLine } from "@/components/auth/auth-greeting-line";
import {
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-input-classes";

export default function LoginPage() {
  const t = useTranslations("auth");
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
    } else {
      router.push("/dashboard");
      router.refresh();
    }
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
      <p className="text-white/40 text-sm mb-8">{t("login_subtitle")}</p>

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
              className="text-white/30 text-xs hover:text-[#B4FF00] transition-colors"
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

      <p className="text-center text-white/40 text-sm">
        {t("no_account")}{" "}
        <Link href="/signup" className="text-[#B4FF00] hover:underline">
          {t("signup_link")}
        </Link>
      </p>
    </div>
  );
}
