import { AgencyDashboard } from "@/components/agency/agency-dashboard";

export default async function AgencyPage({
  searchParams,
}: {
  searchParams: Promise<{
    subscribed?: string;
    credits?: string;
    success?: string;
  }>;
}) {
  const sp = await searchParams;
  const checkoutSuccess =
    sp.subscribed === "1" ||
    sp.credits === "1" ||
    sp.success === "true";
  return <AgencyDashboard subscribed={checkoutSuccess} />;
}
