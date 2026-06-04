# GitHub CI/CD setup (InfluexAI)

Repository: [Paschalidisgeorgios/influexai](https://github.com/Paschalidisgeorgios/influexai)

## Workflows

| Workflow       | Trigger                      | Purpose                                 |
| -------------- | ---------------------------- | --------------------------------------- |
| `ci.yml`       | Push/PR to `main`, `develop` | Typecheck, lint, unit tests, build, E2E |
| `deploy.yml`   | Push to `main`               | Production deploy to Vercel             |
| `pr-check.yml` | Pull requests                | Bundle size + i18n key parity           |

## Production branch

This repository uses **`master`** as the default branch (not `main`). In Vercel:

**Settings → Git → Production Branch** must be `master`.

## Branch protection (`master`)

In **Settings → Branches → Add rule** for `master`:

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
- `RESEND_API_KEY`, `FAL_API_KEY`

Production branch in Vercel Git settings must be **`master`**.

## Local commands (mirror CI)

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit:coverage
npm run build
npm run i18n:check
npm run test:e2e
```

Copy `.env.test.example` to `.env.test` for local E2E.
