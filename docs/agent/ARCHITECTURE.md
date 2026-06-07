# Agent-Architektur

## Module

### 1. Requirement Parser
Extrahiert aus Prompt:
- Intent (image_generation, script_generation etc.)
- Output-Typ (text/image/video/campaign/calendar)
- Nische, Plattform, Zielgruppe
- Harte Constraints (Geschlecht, Anzahl Personen etc.)
- Weiche Wünsche (Stil, Ton)

Status: ⚠️ Partial — detectIntent() in router.ts
TODO: GenerationRequirements Parser implementieren

### 2. Hard Constraint Manager
Nicht verhandelbare Anforderungen:
- Geschlecht/Präsentation der Person
- Anzahl Personen
- Kein Text im Bild
- Kein Logo in KI-Bild
- Hände/Finger korrekt
- Format

Status: ❌ Nur als Type dokumentiert
TODO: constraintParser.ts implementieren

### 3. Tool Router
Wählt Tools basierend auf Intent.
Status: ✅ router.ts — routeToTools()

### 4. Execution Engine
Status: ✅ /api/agent/execute + /api/agent/campaign

### 5. Quality Judge
Status: ⚠️ qualityScoring.ts — Text-only, heuristisch
TODO: echte Bild-QA, Video-QA

### 6. Repair Agent
Status: ❌ Noch nicht implementiert
TODO: repair.ts

### 7. Result Packager
Status: ✅ AgentResult Type + mockExecutor

## Datenfluss
User Prompt
  → Requirement Parser (Intent + Constraints)
  → Hard Constraint Manager (lock constraints)
  → Tool Router (select tools)
  → Preflight Check (validate prompt vs constraints)
  → Execution Engine (run tools)
  → Quality Judge (evaluate output)
  → [failed] → Repair Agent → re-evaluate
  → [passed] → Result Packager
  → UI Display + Supabase Persist + Credits deduct
