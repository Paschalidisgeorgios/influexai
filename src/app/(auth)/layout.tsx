import "@/styles/auth-glass.css";

import { AuthTwoColumnShell } from "@/components/auth/AuthTwoColumnShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthTwoColumnShell>{children}</AuthTwoColumnShell>;
}
