# GitHub CI/CD setup (InfluexAI)

Repository: [Paschalidisgeorgios/influexai](https://github.com/Paschalidisgeorgios/influexai)

## Workflows

| Workflow       | Trigger                      | Purpose                                 |
| -------------- | ---------------------------- | --------------------------------------- |
| `ci.yml`       | Push/PR to `main`, `master` | Typecheck, lint, unit tests, build |
| `deploy.yml`   | Push to `main`               | Production deploy to Vercel             |
| `pr-check.yml` | Pull requests                | Bundle size + i18n key parity           |

## Production branch

This repository uses **`main`** as the default branch. In Vercel:

**Settings → Git → Production Branch** must be `main`.

## Branch protection (`main`)

In **Settings → Branches → Add rule** for `main`:

- Require status checks: **TypeScript**, **ESLint**, **Unit Tests**, **Build**
- Require branches to be up to date before merging
- Require at least 1 approving review (when the team grows)
- Restrict who can push to `main`

Run **Deploy** only after CI is green (deploy does not `needs` CI jobs; rely on branch protection + merge order).

## Repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret                               | Notes                                                     |
| ------------------------------------ | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Public anon key                                           |
| `SUPABASE_SERVICE_ROLE_KEY`          | E2E cleanup / admin                                       |
| `ANTHROPIC_API_KEY`                  | Build / E2E (mocked in E2E when `E2E_MOCK_GENERATIONS=1`) |
| `STRIPE_SECRET_KEY`                  | Build                                                     |
| `STRIPE_WEBHOOK_SECRET`              | Build                                                     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Build                                                     |
| `VERCEL_TOKEN`                       | Vercel → Settings → Tokens                                |
| `VERCEL_ORG_ID`                      | `.vercel/project.json` after `vercel link`                |
| `VERCEL_PROJECT_ID`                  | `.vercel/project.json`                                    |
| `TEST_USER_EMAIL`                    | e.g. `test@influexai.test`                                |
| `TEST_USER_PASSWORD`                 | e.g. `TestPassword123!`                                   |

### Vercel project env (Production)

In **Vercel → Project → Settings → Environment Variables** (Production):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://influexaicreator.com`
- `ANTHROPIC_API_KEY` = `sk-ant-api03-…` (must start with `sk-ant-`; redeploy after change)
- `RESEND_API_KEY`, `FAL_API_KEY` (or `FAL_KEY`)

### Beta signup + nurture emails (Supabase)

1. **SQL:** Run `scripts/apply-beta-nurture-sql-editor.sql` in [SQL Editor](https://supabase.com/dashboard/project/hszjafdelcydnppyolkm/sql/new) (creates `beta_signups`, cron jobs).
2. **Vault:** `vault.create_secret('<SERVICE_ROLE_KEY>', 'supabase_service_role_key', 'cron auth')` then re-run the cron section if jobs had empty Bearer.
3. **Edge Function:** `supabase login` → `supabase functions deploy send-nurture-email --project-ref hszjafdelcydnppyolkm` and set secrets: `RESEND_API_KEY`, `NURTURE_UNSUBSCRIBE_SECRET`.
4. **Test:** `node scripts/test-beta-signup.mjs` (local needs `RESEND_API_KEY` in `.env.local`) or `POST /api/beta/signup` on production after deploy.

### Creator Growth Agent (daily 07:00 UTC)

1. **SQL:** `scripts/apply-growth-agent-sql-editor.sql` in SQL Editor.
2. **Deploy:** `supabase functions deploy growth-agent --project-ref hszjafdelcydnppyolkm`
3. **Secrets (Edge):** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `YOUTUBE_API_KEY` (optional, richer trends), `DAILY_SUGGESTIONS_UNSUBSCRIBE_SECRET` (optional).
4. **Vercel:** `YOUTUBE_API_KEY` for Video Remix; Growth Agent reads it from **Supabase function secrets**.
5. **Manual test:** `POST …/functions/v1/growth-agent` with service role + `{ "userId": "<uuid>" }`.

### Churn Prevention (daily 10:00 UTC)

1. **SQL:** `scripts/apply-churn-prevention-sql-editor.sql` (creates `churn_prevention` log + cron).
2. **Deploy:** `supabase functions deploy churn-prevention --project-ref hszjafdelcydnppyolkm`
3. **Secrets:** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `NURTURE_UNSUBSCRIBE_SECRET` (optional).
4. **Sequence:** day3 = Video-Idee, day7 = 3 Trends, day14 = +10 Bonus Credits.
5. **Test:** `POST …/functions/v1/churn-prevention` + `{ "userId": "<uuid>" }`.

Note: Migration `015_churn_prevention.sql` adds `profiles.last_active_at`, `dismissed_nudges`, etc. — the email log table is **`035_churn_prevention_log.sql`**.
- `ELEVENLABS_API_KEY` (optional — Stimme & Musik; hidden until set)

After adding or changing env vars in Vercel, **redeploy Production** (Deployments → Redeploy) or push to `main`.

Production branch in Vercel Git settings must be **`main`**.

## Local commands (mirror CI)

```bash
npm run typecheck
npm run lint
npm run test:unit:run
npm run build
npm run format:check
npm run test:unit:coverage
npm run i18n:check
npm run test:e2e
```

Copy `.env.test.example` to `.env.test` for local E2E.
