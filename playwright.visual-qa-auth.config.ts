import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const previewBase =
  process.env.PREVIEW_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://influexai-iad04g5x8-paschalidisgeorgios-projects.vercel.app";

/** Preview visual QA auth probe — no local webServer (G.10-O0F). */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: previewBase.replace(/\/$/, ""),
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "visual-qa-auth",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/visual-qa-auth-truth.test.ts",
    },
  ],
});
