# Implementierungsstatus

## ✅ Implementiert und live
- AgentExecution + CampaignExecution Types
- detectIntent() + routeToTools()
- /api/agent/execute (Auth, Credits, Persist)
- /api/agent/campaign (Auth, Credits, JobQueue)
- /api/agent/job/[id] (Status Polling)
- /api/agent/publish (Guard vorbereitet)
- Supabase: agent_executions, campaign_results, agent_feedback, agent_jobs
- GuardModal + guards.ts
- Campaign Autopilot UI (4 Modi, Polling). Live — charges real credits per
  CAMPAIGN_SPECS (weekly: ~81, monthly: ~293). UI shows cost estimate before
  start (fixed in Sprint 2 Wave A).
- KI Agent Dashboard UI
- toolOrchestrator.ts (Route-Mapping)
- jobQueue.ts (Schwellenwert + async)
- persistExecution.ts

## ⚠️ Teilweise implementiert
- toolOrchestrator.ts: Routes gemappt, Body-Keys
  müssen nach ersten Tests noch angepasst werden
- qualityScoring.ts: Text-only, heuristisch
- ElevenLabs: Key vorhanden, COMING_SOON Flag
- Akool/Live Creator: Key vorhanden, COMING_SOON Flag

## Auth & Billing (2026-06)

- Admin redirect bug fixed — see `docs/auth/AUTH_FLOW.md`
- Confirmation email template: `docs/auth/email-confirmation-template.html` → paste in **Supabase Dashboard → Auth → Email Templates → Confirm signup**
- Test plan: `docs/auth/AUTH_AND_BILLING_TEST_PLAN.md`

- Visual QA: kein echtes Vision-Modell
- Hard Constraint Parser: Types da, Parser fehlt
- Prompt Builder mit Constraint Lock: fehlt
- Preflight Check: fehlt
- Repair Agent: fehlt
- Video QA: fehlt
- Social Media Publishing: Route vorbereitet, kein API

## Bekannte Risiken
- toolOrchestrator Body-Keys können beim ersten
  echten Aufruf falsch sein → Tests nötig
- COMING_SOON Flags müssen manuell entfernt werden
- Logo Intro: Darstellungsproblem läuft
