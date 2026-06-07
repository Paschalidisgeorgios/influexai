# Auth & Redirect Flow — INFLUEXAI

## Auth Provider

**Supabase Auth** (email + password). No Clerk / NextAuth.

- Sign-up: `src/app/(auth)/signup/page.tsx`
- Sign-in: `src/app/(auth)/login/page.tsx`
- OAuth/email callback: `src/app/auth/callback/route.ts`
- Session: Supabase SSR cookies via `@supabase/ssr`

## Root cause: false Admin Panel access (fixed)

Three issues caused normal users to see or reach admin UI:

1. **`profiles.role === "owner"` was treated as platform admin** in `isAdminUser()` (`src/lib/access.ts`).  
   Agency owners use **`tenant_role: "owner"`** (separate column). The platform `role` value `owner` must not grant `/admin`.

2. **Unvalidated `next` redirect** in `/auth/callback` allowed arbitrary paths (including `/admin`) after email confirmation.

3. **No middleware guard** on `/admin/*` and `/dashboard/admin/*` — protection relied only on layout components.

## Redirect rules (current)

Central helper: `src/lib/auth-redirect.ts`

| Event | Normal user | Platform admin |
|-------|-------------|----------------|
| Login | `/dashboard` (or safe `?redirect=` deep link) | `/admin` (or safe deep link) |
| Email confirmed | `/dashboard` via callback | `/admin` |
| Sign-up (instant session) | `/dashboard` | `/admin` |
| Sign-up (email pending) | Verify screen → user clicks mail link | same |
| Checkout success (plan) | `/dashboard/credits?subscribed=…&checkout=success` | same |
| Checkout success (agency) | `/dashboard/agency?success=true` | same |
| Checkout cancel | `/pricing?checkout=cancelled` or `/agency?checkout=cancelled` | same |
| Open `/admin` without admin | → `/dashboard` (middleware + layout) | allowed |
| Open `/admin` logged out | → `/auth/sign-in?redirect=…` | same |

**Safe redirect prefixes:** `/dashboard`, `/pricing`, `/agency`, `/join`, `/onboarding`, `/community`  
**Blocked:** `/admin`, `/admin/*`, `/dashboard/admin/*`, external URLs

## Admin guard

Platform admin **only** if:

- `profiles.is_admin === true`, or
- `profiles.role === "admin"`, or
- email in `ADMIN_EMAILS` (`src/lib/access.ts`)

**Not admin:**

- `tenant_role` (`owner` / `admin` / `member`) — agency workspace only
- subscription plan (`starter`, `creator`, `business`, agency plans)
- Stripe webhook — updates `plan`, `agency_plan`, credits; **never** `role` or `is_admin`

## Dashboard guard

- Middleware requires auth for `/dashboard/*`
- Plan gating via `src/lib/plan-gating.ts` (tool routes need active plan; meta routes open)
- Dashboard layout redirects unauthenticated users to `/auth/sign-in`

## Stripe checkout

| Flow | API route | Plan slug |
|------|-----------|-----------|
| Platform subscription | `/api/stripe/subscribe` | `starter`, `creator`, `pro`, `business` |
| Agency / White Label | `/api/agency/checkout`, `/api/stripe/agency-checkout` | `starter`, `pro`, `enterprise` |
| Credit packs | `/api/stripe/credits-checkout` | pack id |

White Label env keys (server-side): `STRIPE_AGENCY_{STARTER|PRO|ENTERPRISE}_{MONTHLY|YEARLY}` — see `src/lib/stripe/prices.ts`.

Webhook: `src/app/api/stripe/webhook/route.ts` — handles `checkout.session.completed`, subscription renewals; logs `[stripe webhook]`.

## Email verification

- Template HTML: `supabase/templates/confirm-signup.html` and `docs/auth/email-confirmation-template.html`
- **Production:** Supabase Dashboard → Authentication → Email Templates → Confirm signup  
  - Subject: `Bestätige deine E-Mail für INFLUEXAI`
  - Paste HTML from docs file
  - Redirect URL allowlist must include: `https://influexaicreator.com/auth/callback`
- Sign-up sets `emailRedirectTo`: `/auth/callback?next=/dashboard`

## Server logging

- `[auth redirect]` — middleware, auth callback
- `[checkout]` — subscribe + agency checkout
- `[stripe webhook]` — checkout.session.completed

No secrets or tokens in logs.
