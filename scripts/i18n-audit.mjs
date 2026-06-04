/**
 * Audit translation quality (not just key parity).
 * Run: npm run i18n:audit
 */
import fs from "fs";
import path from "path";

const messagesDir = path.join(process.cwd(), "messages");
const locales = ["en", "el", "tr", "es", "fr", "ar", "pt"];

function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, pathKey));
    } else if (typeof value === "string") {
      out[pathKey] = value;
    }
  }
  return out;
}

/** Likely untranslated German UI copy (audit heuristic for de-identical strings) */
const GERMAN_TEXT_RE =
  /[äöüßÄÖÜ]|\b(Willkommen|Wähle|Zurück|Bitte|Keine|Schließen|Anmelden|Abmelden|Einstellungen|Credits kaufen|Jetzt starten|Häufige Fragen|Für Marken|So funktioniert|Einmaliger|Einstieg)\b/;

function isLoanwordEqual(deVal, locVal) {
  if (deVal !== locVal) return false;
  if (deVal.length < 4) return true;
  if (/^(InfluexAI|Credits|API|FAQ|OK|LIVE|CTR|Hook|Dashboard|Community|Referral|Script|Home|Live|Partner|Blog|Cookies|Features|Starter|Creator|Business|Pro|Agent|Avatar|Gallery|Remix|Trend|Retention|Win|Links|Videos|Niches)$/i.test(deVal)) {
    return true;
  }
  if (/InfluexAI|Engine|LiveSwap|Face Consistency|Master Agent|Viral Score|KI-Ich|Live Creator/i.test(deVal)) {
    return true;
  }
  return false;
}

const de = flatten(JSON.parse(fs.readFileSync(path.join(messagesDir, "de.json"), "utf-8")));
const en = flatten(JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf-8")));

console.log("Locale | keys | missing | germanText | sameAsDE (loanword) | stillEnglish");
console.log("-------|------|---------|------------|-------------------|---------------");

for (const locale of locales) {
  const loc = flatten(
    JSON.parse(fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf-8"))
  );
  const missing = Object.keys(de).filter((k) => !(k in loc)).length;
  // Untranslated: still identical to German source (excluding shared loanwords)
  const germanText = Object.keys(de).filter(
    (k) => locale !== "de" && loc[k] === de[k] && /[äöüßÄÖÜ]/.test(de[k] ?? "")
  ).length;
  const sameAsDeLoan = Object.keys(de).filter((k) =>
    isLoanwordEqual(de[k], loc[k])
  ).length;
  const stillEnglish =
    locale === "en"
      ? 0
      : Object.keys(de).filter(
          (k) => de[k] !== en[k] && loc[k] === en[k]
        ).length;

  console.log(
    `${locale.padEnd(6)} | ${String(Object.keys(loc).length).padStart(4)} | ${String(missing).padStart(7)} | ${String(germanText).padStart(10)} | ${String(sameAsDeLoan).padStart(17)} | ${String(stillEnglish).padStart(13)}`
  );
}

console.log("\nNote: sameAsDE includes intentional product terms (InfluexAI, Script, etc.).");
console.log("Italian (it) is not in this project — Arabic (ar) is the 8th locale.");
