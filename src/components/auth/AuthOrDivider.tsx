"use client";

import { useTranslations } from "next-intl";

export function AuthOrDivider() {
  const t = useTranslations("auth");

  return (
    <div className="my-6 flex items-center text-xs font-mono uppercase text-zinc-600 before:mr-3 before:flex-1 before:border-t before:border-zinc-800/60 after:ml-3 after:flex-1 after:border-t after:border-zinc-800/60">
      {t("divider")}
    </div>
  );
}
