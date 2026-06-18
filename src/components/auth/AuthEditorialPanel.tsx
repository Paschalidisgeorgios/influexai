"use client";

import { useTranslations } from "next-intl";
import { InfluexBadge } from "@/components/shared/influex";

export type AuthEditorialVariant = "login" | "signup" | "forgot";

const HEADLINE_KEYS: Record<AuthEditorialVariant, string> = {
  login: "editorial_login_headline",
  signup: "editorial_signup_headline",
  forgot: "editorial_forgot_headline",
};

const BODY_KEYS: Record<AuthEditorialVariant, string> = {
  login: "editorial_login_body",
  signup: "editorial_signup_body",
  forgot: "editorial_forgot_body",
};

export function AuthEditorialPanel({ variant }: { variant: AuthEditorialVariant }) {
  const t = useTranslations("auth");

  return (
    <div className="influex-auth-editorial">
      <InfluexBadge tone="lime" className="mb-6">
        InfluexAI · Creator OS
      </InfluexBadge>
      <h2 className="influex-auth-editorial__headline">{t(HEADLINE_KEYS[variant])}</h2>
      <p className="influex-auth-editorial__body">{t(BODY_KEYS[variant])}</p>
    </div>
  );
}
