"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  getReferralDashboard,
  type ReferralDashboardData,
} from "@/app/actions/referral";
import {
  REFERRAL_SIGNUP_BONUS_REFERRED,
  REFERRAL_SIGNUP_BONUS_REFERRER,
} from "@/lib/referral-code";

export default function ReferralPage() {
  const t = useTranslations("referral");
  const locale = useLocale();
  const [data, setData] = useState<ReferralDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getReferralDashboard().then((res) => {
      if ("error" in res) setError(res.error);
      else setData(res);
      setLoading(false);
    });
  }, []);

  const shareMessage = useMemo(() => {
    if (!data) return "";
    return t("share_message", {
      link: data.referralLink,
      bonus: REFERRAL_SIGNUP_BONUS_REFERRED,
    });
  }, [data, t]);

  const shareUrls = useMemo(() => {
    if (!data) return null;
    const subject = encodeURIComponent(t("email_subject"));
    const body = encodeURIComponent(shareMessage);
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
      email: `mailto:?subject=${subject}&body=${body}`,
    };
  }, [data, shareMessage, t]);

  const copyLink = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto py-10 text-white/40 text-sm">
        {t("loading")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[800px] mx-auto text-red-400 text-sm">
        {error ?? t("error")}
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto pb-12">
      <header className="flex items-center gap-3 mb-8">
        <Gift className="text-[#B4FF00]" size={32} strokeWidth={2} />
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl text-[#F0EFE8] leading-none">
            {t("title")}
          </h1>
          <p className="text-white/45 text-sm mt-1">{t("subtitle")}</p>
        </div>
      </header>

      <section className="rounded-2xl border border-[#B4FF00]/20 bg-[#B4FF00]/5 p-6 mb-6">
        <h2 className="font-[family-name:var(--font-bebas)] text-2xl text-[#F0EFE8] mb-2">
          {t("hero_title")}
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-5">
          {t("hero_body", {
            referrerBonus: REFERRAL_SIGNUP_BONUS_REFERRER,
            friendBonus: REFERRAL_SIGNUP_BONUS_REFERRED,
          })}
        </p>

        <p className="text-[0.7rem] font-bold uppercase tracking-wider text-white/35 mb-2">
          {t("link_label")}
        </p>
        <div className="rounded-xl border border-white/10 bg-[#0f0f12] px-4 py-3 font-mono text-sm text-[#B4FF00] break-all mb-3">
          {data.referralLink}
        </div>
        <p className="text-white/35 text-xs mb-4">
          {t("signup_alt")}{" "}
          <span className="text-white/55 break-all">{data.signupLink}</span>
        </p>

        <button
          type="button"
          onClick={() => void copyLink()}
          className="w-full sm:w-auto rounded-xl bg-[#B4FF00] px-6 py-3 text-sm font-bold text-[#060608] hover:opacity-90 transition-opacity"
        >
          {copied ? t("copied") : t("copy")}
        </button>
      </section>

      <div className="flex flex-wrap gap-2 mb-8">
        {shareUrls && (
          <>
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-[#F0EFE8] no-underline hover:border-[#B4FF00]/40 hover:text-[#B4FF00] transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-[#F0EFE8] no-underline hover:border-[#B4FF00]/40 hover:text-[#B4FF00] transition-colors"
            >
              {t("share_x")}
            </a>
            <a
              href={shareUrls.email}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-[#F0EFE8] no-underline hover:border-[#B4FF00]/40 hover:text-[#B4FF00] transition-colors"
            >
              <Mail size={14} />
              {t("share_email")}
            </a>
          </>
        )}
      </div>

      <h2 className="font-[family-name:var(--font-bebas)] text-xl text-[#F0EFE8] mb-3">
        {t("stats_title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <StatCard label={t("stat_invited")} value={data.stats.signedUp} />
        <StatCard label={t("stat_credits")} value={data.stats.creditsEarned} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f12] overflow-hidden">
        <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-white/10 text-[0.7rem] font-bold uppercase tracking-wider text-white/35">
          <span>{t("col_date")}</span>
          <span>{t("col_status")}</span>
          <span className="text-right">{t("col_credits")}</span>
        </div>
        {data.history.length === 0 ? (
          <p className="px-4 py-6 text-sm text-white/40">{t("empty")}</p>
        ) : (
          data.history.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-white/5 text-sm text-[#F0EFE8] last:border-0"
            >
              <span>
                {formatDate(row.date)}
                <span className="block text-xs text-white/35">{row.label}</span>
              </span>
              <span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                    row.status === "purchased"
                      ? "bg-[#B4FF00]/15 text-[#B4FF00]"
                      : "bg-white/5 text-white/45"
                  }`}
                >
                  {row.status === "purchased"
                    ? t("status_purchased")
                    : t("status_signed_up")}
                </span>
              </span>
              <span className="text-right font-bold text-[#B4FF00]">
                +{row.creditsEarned}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-xs text-white/35">
        {t("code_label")}{" "}
        <strong className="text-[#B4FF00]">{data.referralCode}</strong>
      </p>

    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-5">
      <div className="font-[family-name:var(--font-bebas)] text-4xl text-[#B4FF00] leading-none">
        {value}
      </div>
      <div className="text-xs text-white/40 mt-2">{label}</div>
    </div>
  );
}
