import { fetchLiveStats } from "@/lib/live-stats";
import { LiveStatsBarClient } from "@/components/live-stats-bar-client";

export const revalidate = 3600;

export async function LiveStatsBar() {
  const stats = await fetchLiveStats();
  return <LiveStatsBarClient stats={stats} />;
}
