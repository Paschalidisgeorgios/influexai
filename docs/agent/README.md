# INFLUEXAI Agent — Übersicht

## Was ist der Agent?
KI-gestützter Content-Stratege der Nutzer-Prompts
versteht, passende Tools wählt und Outputs erstellt.

## Wo läuft er?
NUR im Dashboard. Landingpage = Demo/Preview only.

## Landingpage vs Dashboard
| | Landingpage | Dashboard |
|---|---|---|
| Agent-Ausführung | ❌ Nie | ✅ Ja |
| API-Calls | ❌ Nie | ✅ Ja |
| Credits | ❌ Nie | ✅ Ja |
| DB-Writes | ❌ Nie | ✅ Ja |
| User-Prompts | ❌ Demo-Daten | ✅ Echt |

## Aktueller Status
- ✅ UI: KI Agent Dashboard, Campaign Autopilot
- ✅ Types: agent/types.ts
- ✅ Router: agent/router.ts
- ✅ Persistenz: agent_executions, campaign_results, agent_feedback
- ✅ Credits: server-side in /api/agent/execute
- ⚠️ Tool-Calls: toolOrchestrator.ts (Route-Mapping läuft)
- ❌ Quality Gate Loop: nur dokumentiert, nicht implementiert
- ❌ Visual QA: Mock only
- ❌ Hard Constraints: Types vorbereitet, Parser fehlt
