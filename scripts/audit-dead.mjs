import fs from "fs";
import path from "path";
import { globSync } from "glob";

const srcFiles = globSync("src/**/*.{ts,tsx}", { nodir: true });
let allSrc = "";
for (const f of srcFiles) {
  allSrc += fs.readFileSync(f, "utf8") + "\n";
}

const components = globSync("src/components/**/*.{tsx,ts}", { nodir: true });
const unused = [];
for (const f of components) {
  const base = path.basename(f, path.extname(f));
  if (base === "index") continue;
  const rel = f.replace(/^src\//, "@/").replace(/\.tsx?$/, "");
  const used = allSrc.includes(rel) || allSrc.includes(`/${base}"`) || allSrc.includes(`/${base}'`);
  if (!used && !f.includes(".test.")) unused.push(f);
}
console.log("UNUSED_COUNT", unused.length);
for (const u of unused) console.log(u);

const todos = [];
for (const f of srcFiles) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/TODO|FIXME|HACK|XXX/.test(line)) {
      todos.push(`${f}:${i + 1}:${line.trim().slice(0, 120)}`);
    }
  });
}
console.log("TODOS", todos.length);
for (const t of todos) console.log(t);

const logs = [];
for (const f of srcFiles) {
  const lines = fs.readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (/console\.log\(/.test(line)) logs.push(`${f}:${i + 1}`);
  });
}
console.log("CONSOLE_LOGS", logs.length);
for (const l of logs) console.log(l);
