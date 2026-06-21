# Required environment variables — Auth & Billing

Do **not** commit secret values. Set in `.env.local` (dev) and Vercel **Production**.

## App URLs

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Canonical site URL for Stripe redirects and email links (e.g. `https://influexaicreator.com`) |

## Supabase Auth

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server/webhook only) |

## Platform admin (server only)

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL_ALLOWLIST` | Comma-separated emails with platform `/admin` access (case-insensitive, trimmed). Example: `paschalidis.georgio38@gmail.com`. **Not** `NEXT_PUBLIC_*`. Set in Vercel **Production**. Falls back to the default in `src/lib/admin-allowlist.ts` when unset. |

**Supabase Dashboard (not env):**

- Site URL → production domain
- Redirect URLs → include `/auth/callback`
- Email template → see `docs/auth/email-confirmation-template.html`

## Stripe — core

| Variable | Description |
|----------|-------------|
| `STRIPE_MODE` | Declared mode: `test` (Safe-Dev/Staging) or `live` (Production only). Runtime-enforced — see `src/lib/stripe-runtime-mode.server.ts`. |
| `STRIPE_SECRET_KEY` | Secret API key — **`sk_test_` in Safe-Dev/Staging**, `sk_live_` in Production only |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (`pk_test_` / `pk_live_`) |

**Safe-Dev/Staging:** `STRIPE_MODE=test`, `VERCEL_ENV=development` (or local), `sk_test_` / `pk_test_` only. Live keys and live webhook events are blocked at runtime.

**Production:** `STRIPE_MODE=live`, live keys, test webhook events blocked.

Never mix declared mode and key prefix (e.g. `STRIPE_MODE=test` + `sk_live_`).

## Stripe — platform subscriptions (client + server fallback)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_MONTHLY` | InfluExAi Starter monthly Price ID |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_STARTER_YEARLY` | InfluExAi Starter yearly Price ID |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_MONTHLY` | InfluexAI Creator monthly |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_CREATOR_YEARLY` | InfluexAI Creator yearly |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_MONTHLY` | InfluexAI Pro monthly |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_PRO_YEARLY` | InfluexAI Pro yearly |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_MONTHLY` | InfluexAI Business monthly |
| `NEXT_PUBLIC_STRIPE_INFLUEXAI_BUSINESS_YEARLY` | InfluexAI Business yearly |

## Stripe — credit packs (server only)

| Variable | Description |
|----------|-------------|
| `STRIPE_CREDITS_25` | Micro pack (25 credits) one-time Price ID |
| `STRIPE_CREDITS_50` | Small pack (50 credits) one-time Price ID |
| `STRIPE_CREDITS_150` | Medium pack (150 credits) one-time Price ID |
| `STRIPE_CREDITS_350` | Large pack (350 credits) one-time Price ID |
| `STRIPE_CREDITS_800` | XL pack (800 credits) one-time Price ID |

## Stripe — Agency / White Label (server only)

| Variable | Description |
|----------|-------------|
| `STRIPE_AGENCY_STARTER_MONTHLY` | Agency Starter monthly |
| `STRIPE_AGENCY_STARTER_YEARLY` | Agency Starter yearly |
| `STRIPE_AGENCY_PRO_MONTHLY` | Agency Pro monthly |
| `STRIPE_AGENCY_PRO_YEARLY` | Agency Pro yearly |
| `STRIPE_AGENCY_ENTERPRISE_MONTHLY` | Agency Enterprise monthly |
| `STRIPE_AGENCY_ENTERPRISE_YEARLY` | Agency Enterprise yearly |

Optional legacy aliases: `NEXT_PUBLIC_STRIPE_AGENCY_*` (resolved in `src/lib/stripe/prices.ts`).

## After env changes

Redeploy Vercel **Production** — env vars apply only on new deployments.

## Email template

HTML lives in repo; must be pasted into **Supabase Auth → Email Templates → Confirm signup**.  
Preview text (set in Supabase if supported):  
`Nur noch ein Schritt, um dein INFLUEXAI Konto zu aktivieren.`
