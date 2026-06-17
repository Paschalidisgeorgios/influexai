"use client";

import { useLang } from "./PreviewLang";

export function PreviewBrandKit() {
  const { t } = useLang();

  return (
    <div className="mx-auto min-w-0 max-w-2xl">
      <p className="preview-type-label mb-2">
        <span className="preview-type-label__accent">03</span>
        <span aria-hidden> — </span>
        {t.brandKit.overline}
      </p>
      <h1 className="preview-type-display--compact mb-3">{t.brandKit.headline}</h1>
      <p className="preview-type-body max-w-prose">{t.brandKit.subline}</p>
    </div>
  );
}
