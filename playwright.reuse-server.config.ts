import { defineConfig, devices } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import base from "./playwright.config";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/** Local QA against an already running `npm run dev` (G.10-N). */
export default defineConfig({
  ...base,
  webServer: undefined,
  projects: [
    {
      name: "visual-qa",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/generate-image-visual-qa.test.ts",
    },
  ],
  workers: 1,
});
