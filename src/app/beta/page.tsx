import { getBetaPublicStats } from "@/app/actions/beta";
import { BetaPageClient } from "@/components/beta/beta-page-client";

export const revalidate = 60;

export default async function BetaPage() {
  const stats = await getBetaPublicStats();
  return <BetaPageClient initialStats={stats} />;
}
