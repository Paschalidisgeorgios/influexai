"use client";

import Link from "next/link";
import { useLang } from "./PreviewLang";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";

export function PreviewCampaigns() {
  const { t } = useLang();

  return (
    <div className="mx-auto min-w-0 max-w-2xl">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        {t.campaigns.overline}
      </p>
      <h1 className="mb-3 text-2xl font-extrabold text-white md:text-3xl">{t.campaigns.headline}</h1>
      <p className="mb-8 max-w-prose text-[15px] leading-relaxed text-neutral-400">{t.campaigns.subline}</p>
      <Link
        href={PREVIEW_MVP_ROUTES.contentCalendar}
        className="inline-flex rounded-md px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.1em]"
        style={{ background: "#b4ff00", color: "#080808" }}
      >
        {t.campaigns.cta}
      </Link>
    </div>
  );
}
