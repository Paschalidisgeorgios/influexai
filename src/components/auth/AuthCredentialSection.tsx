"use client";

import { AuthOrDivider } from "@/components/auth/AuthOrDivider";
import { AuthSocialButtons } from "@/components/auth/AuthSocialButtons";

type AuthCredentialSectionProps = {
  redirectPath?: string | null;
  onError?: (message: string) => void;
  children: React.ReactNode;
};

export function AuthCredentialSection({
  redirectPath,
  onError,
  children,
}: AuthCredentialSectionProps) {
  return (
    <div className="w-full">
      <AuthSocialButtons redirectPath={redirectPath} onError={onError} />
      <AuthOrDivider />
      {children}
    </div>
  );
}
