"use client";

import { useTranslations } from "next-intl";

export function AuthOrDivider() {
  const t = useTranslations("auth");

  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-[1px] flex-1 bg-zinc-800/60" />
      <span className="font-mono text-xs uppercase text-zinc-500">
        {t("divider")}
      </span>
      <div className="h-[1px] flex-1 bg-zinc-800/60" />
    </div>
  );
}
