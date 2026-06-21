/**
 * Child of `vercel env run -e production` — emits classifications only (no raw secrets).
 */
import {
  REQUIRED_SUBSCRIPTION_PRICE_KEYS,
  REQUIRED_CREDIT_PRICE_KEYS,
} from "./production-live-env.mjs";
import { buildProductionEnvAudit } from "./audit-vercel-production-env-safe.mjs";

const audit = buildProductionEnvAudit(process.env, []);
const nonEmpty = Object.entries(process.env).filter(
  ([, v]) => String(v ?? "").trim() !== ""
).length;
console.log(JSON.stringify({ audit, non_empty_key_count: nonEmpty, secrets_logged: false }));
