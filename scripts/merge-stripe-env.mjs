#!/usr/bin/env node
/**
 * Merge Stripe setup script output into .env.local (keys only, no secret logging).
 * Usage: node scripts/merge-stripe-env.mjs < stripe-env-lines.txt
 * Or: node scripts/stripe-setup-plans.mjs 2>/dev/null | node scripts/merge-stripe-env.mjs
 */
import fs from "fs";
import path from "path";
import readline from "readline";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");

function parseEnvLines(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

async function readStdinUpdates() {
  const updates = {};
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    updates[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return updates;
}

const existing = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
const updates = await readStdinUpdates();
const keys = Object.keys(updates);

if (keys.length === 0) {
  console.error("No KEY=value lines on stdin.");
  process.exit(1);
}

const lines = existing.split("\n");
const seen = new Set();

const out = lines.map((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return line;
  const eq = trimmed.indexOf("=");
  if (eq === -1) return line;
  const key = trimmed.slice(0, eq).trim();
  if (updates[key]) {
    seen.add(key);
    return `${key}=${updates[key]}`;
  }
  return line;
});

for (const key of keys) {
  if (!seen.has(key)) {
    out.push(`${key}=${updates[key]}`);
    seen.add(key);
  }
}

fs.writeFileSync(ENV_PATH, out.join("\n").replace(/\n?$/, "\n"), { encoding: "utf8" });
console.log(`Updated ${keys.length} Stripe env keys in .env.local (values not printed).`);
