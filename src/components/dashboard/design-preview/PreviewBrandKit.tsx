"use client";

import { useLang } from "./PreviewLang";

export function PreviewBrandKit() {
  const { t } = useLang();

  return (
    <div className="mx-auto min-w-0 max-w-2xl">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
        {t.brandKit.overline}
      </p>
      <h1 className="mb-3 text-2xl font-extrabold text-white md:text-3xl">{t.brandKit.headline}</h1>
      <p className="max-w-prose text-[15px] leading-relaxed text-neutral-400">{t.brandKit.subline}</p>
    </div>
  );
}
