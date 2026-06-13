"use client";

import { useTranslations } from "next-intl";
import { authDividerClass } from "@/components/auth/auth-input-classes";

export function AuthOrDivider() {
  const t = useTranslations("auth");

  return (
    <div
      className={`my-6 flex items-center before:mr-3 before:flex-1 before:border-t before:border-zinc-800/40 after:ml-3 after:flex-1 after:border-t after:border-zinc-800/40 ${authDividerClass}`}
    >
      {t("divider")}
    </div>
  );
}
