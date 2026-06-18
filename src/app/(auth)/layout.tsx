import { AuthInfluexShell } from "@/components/auth/AuthInfluexShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthInfluexShell>{children}</AuthInfluexShell>;
}
