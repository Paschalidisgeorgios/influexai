import fs from "fs";
import path from "path";

const messagesDir = "./messages";
const languages = ["de", "en", "el", "tr", "es", "fr", "ar", "pt"];

function getKeys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      return getKeys(value as object, fullKey);
    }
    return [fullKey];
  });
}

const masterKeys = getKeys(
  JSON.parse(fs.readFileSync(path.join(messagesDir, "de.json"), "utf-8"))
);

let hasErrors = false;

for (const lang of languages.filter((l) => l !== "de")) {
  const filePath = path.join(messagesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing: messages/${lang}.json`);
    hasErrors = true;
    continue;
  }

  const langKeys = getKeys(JSON.parse(fs.readFileSync(filePath, "utf-8")));

  const missingKeys = masterKeys.filter((k) => !langKeys.includes(k));
  const extraKeys = langKeys.filter((k) => !masterKeys.includes(k));

  if (missingKeys.length > 0) {
    console.error(`${lang}: Missing keys:`, missingKeys);
    hasErrors = true;
  }
  if (extraKeys.length > 0) {
    console.warn(`${lang}: Extra keys (not in de.json):`, extraKeys);
  }

  if (missingKeys.length === 0) {
    console.log(`${lang}: All ${langKeys.length} keys present`);
  }
}

if (hasErrors) process.exit(1);
console.log("\nAll translation files are complete!");
