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
| `STRIPE_SECRET_KEY` | Secret API key (`sk_live_` or `sk_test_`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (client checkout UI if needed) |

**Mode:** Live key + live Price IDs, or test + test — never mix.

## Stripe — platform subscriptions (client + server fallback)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_STARTER_MONTHLY` | Starter monthly Price ID |
| `NEXT_PUBLIC_STRIPE_STARTER_YEARLY` | Starter yearly Price ID |
| `NEXT_PUBLIC_STRIPE_CREATOR_MONTHLY` | Creator monthly |
| `NEXT_PUBLIC_STRIPE_CREATOR_YEARLY` | Creator yearly |
| `NEXT_PUBLIC_STRIPE_PRO_MONTHLY` | Pro monthly |
| `NEXT_PUBLIC_STRIPE_PRO_YEARLY` | Pro yearly |
| `NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY` | Business monthly |
| `NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY` | Business yearly |

## Stripe — credit packs (server only)

| Variable | Description |
|----------|-------------|
| `STRIPE_CREDITS_100` | Small pack (50 credits) one-time Price ID |
| `STRIPE_CREDITS_300` | Medium pack (150 credits) |
| `STRIPE_CREDITS_700` | Large pack (350 credits) |
| `STRIPE_CREDITS_1500` | XL pack (800 credits) |

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
