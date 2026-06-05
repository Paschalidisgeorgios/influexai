import { getCachedLiveStats } from "@/lib/cache";

export type LiveStats = {
  users: number;
  generations: number;
  scripts: number;
};

export async function fetchLiveStats(): Promise<LiveStats> {
  try {
    return await getCachedLiveStats();
  } catch {
    return { users: 0, generations: 0, scripts: 0 };
  }
}
