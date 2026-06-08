import { redirect } from "next/navigation";

/** Legacy /auth → canonical sign-in (middleware also redirects). */
export default function LegacyAuthPage() {
  redirect("/auth/sign-in");
}
