import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

config({ path: resolve(process.cwd(), ".env.local") });

const BASE = "http://localhost:3000";
const EMAIL = process.env.TEST_USER_EMAIL ?? "test@influexai.test";
const PASSWORD = process.env.TEST_USER_PASSWORD ?? "TestPassword123!";

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const uid = users.users.find((u) => u.email === EMAIL)?.id;
  const before = (
    await admin.from("profiles").select("credits").eq("id", uid).single()
  ).data;
  console.log("Credits before:", before?.credits);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByTestId("auth-email").fill(EMAIL);
  await page.getByTestId("auth-password").fill(PASSWORD);
  await page.getByRole("button", { name: /anmelden|sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });

  const result = await page.evaluate(async () => {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Erstelle einen kompletten Short über Morgenroutinen",
        history: [],
      }),
    });
    if (!res.ok) {
      return { error: true, status: res.status, body: await res.text() };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    const events = [];
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data: ")) continue;
        try {
          events.push(JSON.parse(line.slice(6)));
        } catch {}
      }
    }
    return { error: false, events };
  });

  if (result.error) {
    console.log("HTTP ERROR", result.status, result.body);
  } else {
    const types = result.events.map((e) => e.type);
    const toolStarts = result.events.filter((e) => e.type === "tool_start");
    const toolDone = result.events.filter((e) => e.type === "tool_done");
    const toolErr = result.events.filter((e) => e.type === "tool_error");
    const errors = result.events.filter((e) => e.type === "error");
    const creditsEv = result.events.filter((e) => e.type === "credits");
    const textDeltas = result.events.filter((e) => e.type === "text_delta");
    const done = result.events.find((e) => e.type === "done");

    console.log("Event types:", [...new Set(types)].join(", "));
    console.log("tool_start:", toolStarts.length, toolStarts.map((e) => e.tool));
    console.log("tool_done:", toolDone.length, toolDone.map((e) => e.tool));
    if (toolErr.length) console.log("tool_error:", JSON.stringify(toolErr, null, 2));
    if (errors.length) console.log("errors:", JSON.stringify(errors, null, 2));
    if (creditsEv.length) console.log("credits events:", creditsEv);
    console.log("text_delta chunks:", textDeltas.length);
    if (done) console.log("done:", JSON.stringify(done).slice(0, 500));
    const fullText = textDeltas.map((e) => e.text).join("");
    console.log("Assistant text preview:", fullText.slice(0, 600));
  }

  const after = (
    await admin.from("profiles").select("credits").eq("id", uid).single()
  ).data;
  console.log("Credits after:", after?.credits, `(−${(before?.credits ?? 0) - (after?.credits ?? 0)})`);

  await browser.close();
}

main().catch(console.error);
