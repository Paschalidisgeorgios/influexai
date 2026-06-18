"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthShell } from "@/components/shared/influex";
import {
  AuthEditorialPanel,
  type AuthEditorialVariant,
} from "@/components/auth/AuthEditorialPanel";

function resolveVariant(pathname: string): AuthEditorialVariant {
  if (pathname.includes("signup") || pathname.includes("sign-up")) {
    return "signup";
  }
  if (pathname.includes("forgot-password")) {
    return "forgot";
  }
  return "login";
}

type AuthInfluexShellProps = {
  children: React.ReactNode;
};

export function AuthInfluexShell({ children }: AuthInfluexShellProps) {
  const pathname = usePathname();
  const variant = resolveVariant(pathname);

  return (
    <AuthShell
      editorial={<AuthEditorialPanel variant={variant} />}
      frameClassName="influex-auth-shell__frame--wide"
    >
      <div className="influex-auth-form-wrap">
        <div className="influex-auth-form-wrap__toolbar">
          <Link href="/" className="influex-auth-form-wrap__home">
            ← InfluexAI
          </Link>
          <LanguageSwitcher compact />
        </div>
        {children}
      </div>
    </AuthShell>
  );
}
