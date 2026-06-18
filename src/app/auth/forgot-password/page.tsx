import { redirect } from "next/navigation";

/** Alias → canonical forgot-password route (no middleware change). */
export default function AuthForgotPasswordAliasPage() {
  redirect("/forgot-password");
}
