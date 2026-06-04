import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(async () => ({
    get: vi.fn(),
  })),
}));

vi.mock("@/lib/activity-log", () => ({
  logGeneration: vi.fn().mockResolvedValue(undefined),
  logCreditTransaction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/push-notifications", () => ({
  invokePushNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/cache", () => ({
  invalidateUserCredits: vi.fn(),
  invalidateUserGenerations: vi.fn(),
}));
