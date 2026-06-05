import { redirect } from "next/navigation";

/** Onboarding entry — KI-Avatar lives under KI-Ich */
export default async function AvatarOnboardingRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const q = topic?.trim()
    ? `?topic=${encodeURIComponent(topic.trim())}`
    : "";
  redirect(`/dashboard/ki-ich${q}`);
}
