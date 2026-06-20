import { test, expect } from "@playwright/test";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { emailInput, passwordInput } from "../helpers/auth";

const EMAIL = "visualqa@influexai.test";
const PASSWORD = process.env.VISUAL_QA_PASSWORD ?? "";
const RESULT_PATH = resolve(
  process.cwd(),
  "scripts/visual-qa-auth-truth-ui.json"
);

type UiProbe = {
  ui_login_ok: boolean;
  final_url: string | null;
  error_text: string | null;
  auth_request_host: string | null;
  auth_request_status: number | null;
  auth_response_error: string | null;
  session_cookie_set: boolean;
  local_storage_session: boolean;
  dashboard_reachable: boolean;
  image_generator_reachable: boolean;
  credits_visible: string | null;
  provider_disabled_banner: boolean;
  secrets_logged: false;
};

test.describe("Visual QA auth truth (G.10-O0F)", () => {
  test("preview login probe read-only", async ({ page, context }) => {
    test.skip(!PASSWORD, "VISUAL_QA_PASSWORD required");

    const probe: UiProbe = {
      ui_login_ok: false,
      final_url: null,
      error_text: null,
      auth_request_host: null,
      auth_request_status: null,
      auth_response_error: null,
      session_cookie_set: false,
      local_storage_session: false,
      dashboard_reachable: false,
      image_generator_reachable: false,
      credits_visible: null,
      provider_disabled_banner: false,
      secrets_logged: false,
    };

    let tokenResponse: { status: number; body: string } | null = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/auth/v1/token") && response.request().method() === "POST") {
        probe.auth_request_host = new URL(url).host;
        probe.auth_request_status = response.status();
        try {
          tokenResponse = {
            status: response.status(),
            body: await response.text(),
          };
          const parsed = JSON.parse(tokenResponse.body) as {
            error?: string;
            error_description?: string;
            msg?: string;
          };
          probe.auth_response_error =
            parsed.error ??
            parsed.error_description ??
            parsed.msg ??
            null;
        } catch {
          probe.auth_response_error = `http_${response.status()}`;
        }
      }
    });

    await page.goto("/auth/sign-in");
    const accept = page.getByRole("button", { name: /^Akzeptieren$/i });
    if (await accept.isVisible({ timeout: 3000 }).catch(() => false)) {
      await accept.click();
    }

    await emailInput(page).fill(EMAIL);
    await passwordInput(page).fill(PASSWORD);

    const signIn = page.getByRole("button", {
      name: /anmelden|sign in|jetzt anmelden/i,
    });
    await signIn.click();

    await page.waitForTimeout(5000);
    probe.final_url = page.url();

    const alert = page.locator(".influex-auth-alert--error");
    if (await alert.isVisible({ timeout: 2000 }).catch(() => false)) {
      probe.error_text = (await alert.textContent())?.trim() ?? null;
    }

    const cookies = await context.cookies();
    probe.session_cookie_set = cookies.some(
      (c) => c.name.includes("auth-token") || c.name.startsWith("sb-")
    );

    probe.local_storage_session = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) ?? "";
        if (key.includes("auth-token") || key.startsWith("sb-")) return true;
      }
      return false;
    });

    probe.ui_login_ok =
      !probe.error_text &&
      (probe.final_url?.includes("/dashboard") ||
        probe.session_cookie_set ||
        probe.local_storage_session);

    if (probe.ui_login_ok) {
      await page.goto("/dashboard");
      probe.dashboard_reachable = page.url().includes("/dashboard");
      await page.goto("/dashboard/image-generator");
      probe.image_generator_reachable =
        /\/dashboard(\/image-generator|\?tool=image-gen)/.test(page.url()) ||
        page.url().includes("/dashboard/image-generator");

      const credits = page.getByTestId("credits-display");
      if (await credits.isVisible({ timeout: 8000 }).catch(() => false)) {
        probe.credits_visible = (await credits.textContent())?.trim() ?? null;
      }

      const disabledHint = page.getByText(
        /Provider.*deaktiviert|PROVIDERS_DISABLED|5 Credits pro Bild/i
      );
      probe.provider_disabled_banner = await disabledHint
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);
    }

    writeFileSync(RESULT_PATH, JSON.stringify(probe, null, 2));

    if (probe.error_text) {
      console.log("[ui-probe] error_text:", probe.error_text);
    }
    console.log("[ui-probe]", JSON.stringify(probe, null, 2));

    expect(
      probe.auth_request_host,
      "expected Supabase auth/v1/token request"
    ).toContain("supabase.co");
    expect(probe.ui_login_ok, probe.error_text ?? "login failed").toBe(true);
  });
});
