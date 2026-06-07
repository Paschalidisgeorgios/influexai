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
- Campaign Autopilot UI (4 Modi, Polling)
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

## ❌ Mock / TODO
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
