"use client";

import Link from "next/link";
import { useLang } from "./PreviewLang";
import { PREVIEW_MVP_ROUTES } from "./preview-routes";

export function PreviewCampaigns() {
  const { t } = useLang();

  return (
    <div className="mx-auto min-w-0 max-w-2xl">
      <p className="preview-type-label mb-2">
        <span className="preview-type-label__accent">02</span>
        <span aria-hidden> — </span>
        {t.campaigns.overline}
      </p>
      <h1 className="preview-type-display--compact mb-3">{t.campaigns.headline}</h1>
      <p className="preview-type-body mb-8 max-w-prose">{t.campaigns.subline}</p>
      <Link
        href={PREVIEW_MVP_ROUTES.contentCalendar}
        className="preview-type-btn inline-flex rounded-md px-4 py-3 text-[0.75rem] uppercase tracking-[0.08em]"
        style={{ background: "#b4ff00", color: "#080808" }}
      >
        {t.campaigns.cta}
      </Link>
    </div>
  );
}
