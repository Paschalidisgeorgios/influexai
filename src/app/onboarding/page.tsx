import { redirect } from "next/navigation";

/** Legacy route — onboarding runs as modal on /dashboard */
export default function OnboardingPage() {
  redirect("/dashboard");
}
