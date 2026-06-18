# Environment Safety & Staging Setup

This document describes how to develop and test mutating features without touching production data, billing, or provider costs.

## Problem

Local `.env.local` must not point at:

- Production Supabase (`NEXT_PUBLIC_SUPABASE_URL` with the production project ref)
- Stripe **live** keys (`sk_live_` / `pk_live_`)
- Production provider keys (FAL, Akool) without explicit disable flags
- Production `SUPABASE_SERVICE_ROLE_KEY`

Mutating API routes (POST/DELETE/PATCH) can otherwise insert rows, charge credits, call providers, or start Stripe checkouts against real production resources.

## Development Write Guard

Server-only helper: `src/lib/environment-safety.server.ts`

### When it blocks

Blocking applies only when **all** of the following are true:

1. Runtime is non-production (`VERCEL_ENV=production` is the only exempt runtime; includes `next dev`, Vercel preview, and local `next start` without `VERCEL_ENV`)
2. At least one production-like signal is detected
3. No explicit override is set (both override env vars required)

### Production-like signals

| Signal | Detection |
|--------|-----------|
| Supabase production ref | `NEXT_PUBLIC_SUPABASE_URL` matches known production ref |
| Stripe live secret | `STRIPE_SECRET_KEY` starts with `sk_live_` |
| Stripe live publishable | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_` |
| Active provider keys | `FAL_API_KEY` / `FAL_KEY` or Akool credentials set (unless `PROVIDERS_DISABLED=true`) |
| Service role present | `SUPABASE_SERVICE_ROLE_KEY` is set |

### Response when blocked

- HTTP **403**
- `code`: `DEV_WRITE_GUARD_BLOCKED`
- No secrets in the response body

### Override (local/preview only)

Both variables are **required**:

```env
ALLOW_PRODUCTION_DEV_WRITES=true
I_UNDERSTAND_PRODUCTION_WRITES=true
```

Setting only one variable leaves the guard active and logs a partial-override warning.

When override is active, a server log warning is emitted (no secret values).

**Production deployments (`VERCEL_ENV=production`) are never blocked.**

### Webhooks (not dev-write-guarded)

External callbacks must remain reachable. Do **not** apply the dev write guard to:

- `/api/lora/webhook` — validates `FAL_WEBHOOK_SECRET` (header or query)
- `/api/stripe/webhook` — validates Stripe signature via `STRIPE_WEBHOOK_SECRET`

These use their own secret/signature checks instead of the dev write guard.

### Usage in API routes

At the start of mutating handlers (POST/DELETE/PATCH), before storage, DB writes, credits, providers, or Stripe:

```typescript
import { developmentWriteGuardResponse } from "@/lib/environment-safety.server";

export async function POST(request: NextRequest) {
  const writeGuard = developmentWriteGuardResponse();
  if (writeGuard) return writeGuard;
  // ... existing handler
}
```

GET/read-only routes are intentionally **not** guarded.

## Recommended local setup

1. Copy `.env.staging.example` → `.env.local` (or maintain a separate `.env.staging` and load manually).
2. Create a **dedicated Supabase staging project** (not in scope of this repo phase).
3. Use Stripe **test** keys only (`sk_test_` / `pk_test_`).
4. Set `PROVIDERS_DISABLED=true` until sandbox/test provider keys exist.
5. Do **not** set override variables for day-to-day development.

## UI hint (development only)

`AiCreatorEnvironmentHint` on `/dashboard/ai-creator` lists non-secret warnings when risky configuration is detected (Supabase, Stripe live, providers, service role, guard active).

## QA checklist (no production mutations)

- GET `/api/ai-creator/characters` → 200/401 (not 403)
- POST `/api/ai-creator/characters` with dummy body → 403 `DEV_WRITE_GUARD_BLOCKED` when production-like env is loaded
- No DB insert, provider call, or Stripe session when guard blocks

## Files

| File | Purpose |
|------|---------|
| `.env.local.example` | Safe local template + safety notes |
| `.env.staging.example` | Staging-oriented placeholders |
| `src/lib/environment-safety.server.ts` | Guard implementation |
