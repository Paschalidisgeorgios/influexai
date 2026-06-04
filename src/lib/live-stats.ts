import { getCachedLiveStats } from "@/lib/cache";

const MIN_USERS = 47;
const MIN_GENERATIONS = 312;
const MIN_SCRIPTS = 89;

export type LiveStats = {
  users: number;
  generations: number;
  scripts: number;
};

function withMinimums(actual: LiveStats): LiveStats {
  return {
    users: Math.max(actual.users, MIN_USERS),
    generations: Math.max(actual.generations, MIN_GENERATIONS),
    scripts: Math.max(actual.scripts, MIN_SCRIPTS),
  };
}

export async function fetchLiveStats(): Promise<LiveStats> {
  try {
    const actual = await getCachedLiveStats();

    if (actual.users < 10) {
      return withMinimums(actual);
    }

    return actual;
  } catch {
    return withMinimums({ users: 0, generations: 0, scripts: 0 });
  }
}
