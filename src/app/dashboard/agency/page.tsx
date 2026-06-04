import { AgencyDashboard } from "@/components/agency/agency-dashboard";

export default async function AgencyPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; credits?: string }>;
}) {
  const sp = await searchParams;
  return (
    <AgencyDashboard subscribed={sp.subscribed === "1" || sp.credits === "1"} />
  );
}
