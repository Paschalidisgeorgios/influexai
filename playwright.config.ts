import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  testDir: "./tests/e2e",
  globalTeardown: require.resolve("./tests/e2e/global-teardown-hook.ts"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  timeout: 60000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/global.setup.ts",
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: [
        "**/global.setup.ts",
        "**/global.teardown.ts",
        "**/logout.test.ts",
        "**/flows/**",
        "**/dashboard/**",
      ],
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
      testIgnore: [
        "**/global.setup.ts",
        "**/global.teardown.ts",
        "**/logout.test.ts",
        "**/flows/**",
        "**/dashboard/**",
      ],
    },
    {
      name: "flows",
      use: {
        ...devices["Desktop Chrome"],
        permissions: ["clipboard-read", "clipboard-write"],
      },
      dependencies: ["setup"],
      testMatch: ["**/flows/**/*.test.ts", "**/dashboard/**/*.test.ts"],
      workers: 1,
    },
    {
      name: "logout",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup", "chromium", "mobile-chrome", "flows"],
      testMatch: "**/logout.test.ts",
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      E2E_TEST_API: "1",
      E2E_MOCK_GENERATIONS: "1",
      PLAYWRIGHT: "1",
    },
  },
});
