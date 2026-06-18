"use client";

import { useTranslations } from "next-intl";

export function AuthOrDivider() {
  const t = useTranslations("auth");

  return <div className="influex-auth-divider">{t("divider")}</div>;
}
