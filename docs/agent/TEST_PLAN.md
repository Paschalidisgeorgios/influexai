# Testplan

## 1. Frau bleibt Frau
Prompt: "Erstelle ein Bild von einer Frau für eine Beauty-Ad."
Erwartung:
- subjectGenderPresentation = 'female'
- Prompt enthält 'female-presenting'
- Negative Prompt enthält 'man', 'male', 'beard'
- QA akzeptiert keinen männlichen Output

## 2. Kein Text / kein Logo
Prompt: "Erstelle ein Bild ohne Text und ohne Logo."
Erwartung:
- mustAvoidTextInImage = true
- mustAvoidLogoInGeneratedImage = true
- overlayInstructions gesetzt

## 3. Firmenkunde Monatscontent
Prompt: "1 Monat Content für Immobilienfirma."
Erwartung:
- Campaign Mode: monthly
- Brand DNA mit Annahmen
- Keine garantierten Verkaufsversprechen
- claimRisk = low

## 4. Landingpage führt nichts aus
Erwartung:
- AgentPreviewDemo: keine echten API-Calls
- StickyUIDemo: nur Demo-Daten
- Keine Credits auf Landingpage

## 5. Credits nur Dashboard
- /api/agent/execute: Credits abbuchen ✅
- Landingpage-Komponenten: kein Credit-Call ✅

## 6. Quality Retry
- QA failed → Repair → Retry
- Max 3 Versuche
- Failed result = nicht als final markiert
