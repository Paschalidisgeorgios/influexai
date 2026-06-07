# Auth & Billing — Manual Test Plan

Use staging or production with test Stripe keys where noted.

## 1. New user registration

**Steps:** `/auth/sign-up` → fill form → submit  
**Expected:**

- Verify-email screen (if confirmations enabled) or redirect to `/dashboard`
- Confirmation email uses branded template
- After confirm link → `/dashboard`, **not** `/admin`
- `profiles.role` = `user`, `is_admin` = false

## 2. Normal user login

**Steps:** `/auth/sign-in` → credentials  
**Expected:** `/dashboard`  
**Not expected:** `/admin`, admin sidebar unless user is platform admin

## 3. Platform admin login

**Steps:** Sign in with allowlisted admin email or `is_admin=true` profile  
**Expected:** `/admin` (or safe deep link if `?redirect=/dashboard/…`)

## 4. Normal user opens `/admin`

**Steps:** While logged in as normal user, navigate to `/admin`  
**Expected:** Redirect to `/dashboard` (middleware)

## 5. Guest opens `/admin`

**Steps:** Logged out → `/admin`  
**Expected:** Redirect to `/auth/sign-in`

## 6. Starter plan checkout

**Steps:** `/pricing` → Starter → checkout → pay (test card)  
**Expected:**

- Correct Price ID server-side (`[checkout]` log `priceIdExists: true`)
- Success → `/dashboard/credits?subscribed=starter&checkout=success`
- Webhook updates `profiles.plan`, not `role`

## 7. White Label monthly

**Steps:** `/agency` or `/dashboard/white-label` → agency form → plan checkout  
**Expected:**

- No “Price ID missing” for configured envs
- Success → `/dashboard/agency?success=true`
- No admin redirect
- `agency_plan` set; `tenant_role` may be `owner`; `profiles.role` stays `user`

## 8. Plan upgrade

**Steps:** Existing subscriber → higher tier checkout  
**Expected:** Plan updated; role unchanged

## 9. Checkout cancel

**Steps:** Start checkout → cancel on Stripe  
**Expected:** `/pricing?checkout=cancelled` or `/agency?checkout=cancelled`

## 10. Webhook test event

**Steps:** Stripe CLI or Dashboard → `checkout.session.completed`  
**Expected:**

- `[stripe webhook]` log with plan metadata
- Subscription/plan fields updated
- No write to `is_admin` or `role=admin`

## 11. Confirmation email

**Check:**

- Subject: „Bestätige deine E-Mail für INFLUEXAI“
- Dark premium layout, lime CTA button
- Fallback link under button
- Mobile readable (~560px)
- Link opens `/auth/callback` → `/dashboard`

## 12. Unsafe redirect blocked

**Steps:** `/auth/callback?code=…&next=/admin` (after valid session exchange)  
**Expected:** Normal user lands on `/dashboard`, not `/admin`

## Regression: agency tenant owner

**Steps:** User with `tenant_role=owner`, `role=user`  
**Expected:** Full dashboard access, **no** admin nav, **no** `/admin` access
