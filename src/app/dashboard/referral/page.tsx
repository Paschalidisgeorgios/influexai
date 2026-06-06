"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  getReferralDashboard,
  type ReferralDashboardData,
} from "@/app/actions/referral";
import { TablerGift } from "@/components/icons/TablerGift";
import {
  REFERRAL_SIGNUP_BONUS_REFERRED,
  REFERRAL_SIGNUP_BONUS_REFERRER,
} from "@/lib/referral-code";

const HOW_IT_WORKS_KEYS = ["step1", "step2", "step3", "step4"] as const;

export default function ReferralPage() {
  const t = useTranslations("referral");
  const locale = useLocale();
  const [data, setData] = useState<ReferralDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const res = await getReferralDashboard(p);
    if ("error" in res) setError(res.error);
    else {
      setData(res);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

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

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-[800px] py-10 text-sm text-white/70">
        {t("loading")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[800px] text-sm text-red-400">
        {error ?? t("error")}
      </div>
    );
  }

  const { pagination } = data;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[800px] pb-12">
      <header className="mb-8 flex items-center gap-3">
        <TablerGift size={32} color="#B4FF00" strokeWidth={2.2} />
        <div>
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl leading-none text-[#F0EFE8]">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-white/75">{t("subtitle")}</p>
        </div>
      </header>

      {/* A) Referral link */}
      <section className="mb-6 rounded-2xl border border-[#B4FF00]/20 bg-[#B4FF00]/5 p-6">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-white/65">
          {t("link_label")}
        </p>
        <div className="mb-4 break-all rounded-xl border border-white/10 bg-[#0f0f12] px-4 py-3.5 font-mono text-sm text-[#B4FF00]">
          {data.referralLink}
        </div>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="mb-4 w-full rounded-xl bg-[#B4FF00] py-4 text-base font-bold text-[#060608] transition-opacity hover:opacity-90 sm:max-w-xs"
        >
          {copied ? t("copied") : t("copy")}
        </button>
        <p className="mb-4 text-xs text-white/65">
          {t("signup_alt")}{" "}
          <span className="break-all text-white/80">{data.signupLink}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {shareUrls && (
            <>
              <a
                href={shareUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-[#F0EFE8] no-underline transition-colors hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
              >
                WhatsApp
              </a>
              <a
                href={shareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-[#F0EFE8] no-underline transition-colors hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
              >
                {t("share_x")}
              </a>
              <a
                href={shareUrls.email}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-[#F0EFE8] no-underline transition-colors hover:border-[#B4FF00]/40 hover:text-[#B4FF00]"
              >
                <Mail size={14} />
                {t("share_email")}
              </a>
            </>
          )}
        </div>
      </section>

      {/* B) Stats */}
      <h2 className="mb-3 font-[family-name:var(--font-bebas)] text-xl text-[#F0EFE8]">
        {t("stats_title")}
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t("stat_invited")} value={data.stats.signedUp} />
        <StatCard label={t("stat_credits")} value={data.stats.creditsEarned} />
        <StatCard
          label={t("stat_active")}
          value={data.stats.activeReferrals}
        />
      </div>

      {/* C) How it works */}
      <section className="mb-8 rounded-2xl border border-white/10 bg-[#0f0f12] p-6">
        <h2 className="mb-4 font-[family-name:var(--font-bebas)] text-xl text-[#F0EFE8]">
          {t("how_title")}
        </h2>
        <ol className="space-y-4">
          {HOW_IT_WORKS_KEYS.map((key, i) => (
            <li key={key} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#B4FF00]/40 bg-[#B4FF00]/10 text-sm font-bold text-[#B4FF00]">
                {i + 1}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-white/65">
                {t(`how_${key}`, {
                  referrerBonus: REFERRAL_SIGNUP_BONUS_REFERRER,
                  friendBonus: REFERRAL_SIGNUP_BONUS_REFERRED,
                })}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* D) History */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12]">
        <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2 border-b border-white/10 px-4 py-3 text-[0.7rem] font-bold uppercase tracking-wider text-white/65">
          <span>{t("col_date")}</span>
          <span>{t("col_status")}</span>
          <span className="text-right">{t("col_credits")}</span>
        </div>
        {loading ? (
          <p className="px-4 py-6 text-sm text-white/70">{t("loading")}</p>
        ) : data.history.length === 0 ? (
          <p className="px-4 py-6 text-sm text-white/70">{t("empty")}</p>
        ) : (
          data.history.map((row) => (
            <div
              key={row.id}
              className="border-b border-white/5 px-4 py-3 text-sm text-[#F0EFE8] last:border-0 sm:grid sm:grid-cols-3 sm:gap-2 sm:items-center"
            >
              <div className="mb-2 sm:mb-0">
                <span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-wider text-white/50 sm:hidden">
                  {t("col_date")}
                </span>
                {formatDate(row.date)}
                <span className="mt-0.5 block text-xs text-white/65">
                  {row.label}
                </span>
              </div>
              <div className="mb-2 sm:mb-0">
                <span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-wider text-white/50 sm:hidden">
                  {t("col_status")}
                </span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                    row.status === "purchased"
                      ? "bg-[#B4FF00]/15 text-[#B4FF00]"
                      : "bg-white/5 text-white/75"
                  }`}
                >
                  {row.status === "purchased"
                    ? t("status_purchased")
                    : t("status_signed_up")}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-wider text-white/50 sm:hidden">
                  {t("col_credits")}
                </span>
                <span className="font-bold text-[#B4FF00]">
                  +{row.creditsEarned}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-h-[44px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-[#F0EFE8] disabled:opacity-40 hover:border-[#B4FF00]/40"
          >
            {t("page_prev")}
          </button>
          <span className="text-xs text-white/70">
            {t("page_info", {
              page: pagination.page,
              total: pagination.totalPages,
            })}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="min-h-[44px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-[#F0EFE8] disabled:opacity-40 hover:border-[#B4FF00]/40"
          >
            {t("page_next")}
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-white/65">
        {t("code_label")}{" "}
        <strong className="text-[#B4FF00]">{data.referralCode}</strong>
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-5">
      <div className="font-[family-name:var(--font-bebas)] text-4xl leading-none text-[#B4FF00]">
        {value}
      </div>
      <div className="mt-2 text-xs text-white/70">{label}</div>
    </div>
  );
}
