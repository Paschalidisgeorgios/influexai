/**
 * Beta signup + Resend + nurture edge function smoke test.
 * Usage:
 *   node scripts/test-beta-signup.mjs
 *   npx vercel env run --environment=production node scripts/test-beta-signup.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.production.local");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const TEST_EMAIL = process.env.BETA_TEST_EMAIL ?? "test@example.com";
const REAL_EMAIL = process.env.BETA_REAL_TEST_EMAIL;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateBetaCode() {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `BETA-${suffix}`;
}

function log(step, ok, detail = "") {
  const icon = ok ? "OK" : "FAIL";
  console.log(`[${icon}] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function sendBetaWelcomeEmail(to, code, firstName = "Test") {
  if (!RESEND_KEY?.startsWith("re_")) {
    return { ok: false, reason: "RESEND_API_KEY missing or invalid" };
  }
  const signupUrl = `https://influexaicreator.com/signup?beta=${encodeURIComponent(code)}`;
  const html = `<p>Hey ${firstName}, dein Beta-Code: <strong>${code}</strong></p><p><a href="${signupUrl}">Account erstellen</a></p>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "InfluexAI <noreply@influexaicreator.com>",
      to: [to],
      subject: `[Test] InfluexAI Beta-Code: ${code}`,
      html,
    }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function main() {
  console.log("=== Beta Signup Flow Test ===\n");

  if (!SUPABASE_URL || !SERVICE_KEY) {
    log("env:supabase", false, "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  log("env:supabase", true);

  const hasResend = RESEND_KEY?.startsWith("re_");
  log("env:RESEND_API_KEY", hasResend, hasResend ? "re_*" : String(RESEND_KEY ?? "unset"));

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const email = TEST_EMAIL.toLowerCase();
  const code = generateBetaCode();

  const { data: before } = await supabase
    .from("beta_signups")
    .select("id, email, code, status, created_at")
    .eq("email", email)
    .maybeSingle();

  if (before) {
    log("db:existing row", true, `${before.code} (${before.status})`);
  } else {
    const { error: insErr } = await supabase.from("beta_signups").insert({
      email,
      name: "Test User",
      niche: "Tech & AI",
      code,
      status: "active",
    });
    if (insErr) {
      log("db:insert beta_signups", false, `${insErr.code} ${insErr.message}`);
    } else {
      log("db:insert beta_signups", true, email);
    }
  }

  const { data: row } = await supabase
    .from("beta_signups")
    .select("id, email, code, status")
    .eq("email", email)
    .maybeSingle();

  log("db:verify beta_signups", !!row?.id, row ? `${row.code} status=${row.status}` : "no row");

  const useCode = row?.code ?? code;
  if (hasResend) {
    const mail = await sendBetaWelcomeEmail(email, useCode, "Test");
    log("resend:beta welcome", mail.ok, mail.ok ? "sent" : `${mail.status} ${mail.body?.slice(0, 120)}`);
  }

  if (hasResend && REAL_EMAIL && REAL_EMAIL !== email) {
    const realCode = generateBetaCode();
    const mail2 = await sendBetaWelcomeEmail(REAL_EMAIL, realCode, "Beta-Test");
    log("resend:real inbox test", mail2.ok, REAL_EMAIL);
    if (mail2.ok) {
      try {
        const parsed = JSON.parse(mail2.body);
        log("resend:message id", true, parsed.id ?? "(no id in body)");
      } catch {
        /* ignore */
      }
    }
  } else if (!REAL_EMAIL) {
    console.log("\nTip: set BETA_REAL_TEST_EMAIL=you@domain.com for deliverability test");
  }

  const nurtureUrl = `${SUPABASE_URL}/functions/v1/send-nurture-email`;
  const probe = await fetch(nurtureUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: "cron" }),
  });
  const nurtureText = await probe.text();
  if (probe.status === 401) {
    log("edge:send-nurture-email auth", false, "401 — cron Bearer may still be YOUR_SERVICE_ROLE_KEY placeholder");
  } else if (probe.ok) {
    let summary = nurtureText.slice(0, 200);
    try {
      const j = JSON.parse(nurtureText);
      summary = `mode=${j.mode} processed=${j.processed} sent=${j.sent}`;
    } catch {
      /* ignore */
    }
    log("edge:send-nurture-email cron", true, summary);
  } else {
    log("edge:send-nurture-email cron", false, `${probe.status} ${nurtureText.slice(0, 150)}`);
  }

  console.log("\nCron schedule (from migration 011): 0 9 * * *  → daily 09:00 UTC");
  console.log("Nurture sequence days: welcome=0, activation=1, feature_discovery=3, retention=7, upgrade=14");
  console.log("Churn cron (016): 0 10 * * * → daily 10:00 UTC");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
