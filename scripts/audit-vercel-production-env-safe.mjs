#!/usr/bin/env node
/**
 * LIVE-2G — secret-safe Vercel Production env audit (stdout = classifications only).
 */
import { auditVercelProductionEnvSafe } from "./lib/audit-vercel-production-env-safe.mjs";
import { probeProductionProviderGuard } from "./lib/production-provider-guard.mjs";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const DOMAIN = "https://www.influexaicreator.com";
const PROD_REF = "hszjafdelcydnppyolkm";

const envAudit = auditVercelProductionEnvSafe(process.env);
const guard = probeProductionProviderGuard(DOMAIN);

const supabaseLinkPath = resolve(process.cwd(), "supabase/.temp/project-ref");
const supabaseCliRef = existsSync(supabaseLinkPath)
  ? readFileSync(supabaseLinkPath, "utf8").trim()
  : "unknown";

console.log(
  JSON.stringify(
    {
      phase: "live-2g-vercel-production-env-audit",
      env_audit: envAudit,
      provider_guard: {
        pass: guard.pass,
        code: guard.code,
        has_generation_id: guard.has_generation_id,
        has_image_url: guard.has_image_url,
      },
      safety: {
        deploy_executed: false,
        provider_runs: 0,
        stripe_checkout_executed: false,
        env_sync_executed: false,
      },
      supabase_cli_link_ref: supabaseCliRef,
      supabase_cli_production: supabaseCliRef === PROD_REF,
      secrets_logged: false,
    },
    null,
    2
  )
);

process.exit(envAudit.ok ? 0 : 1);
