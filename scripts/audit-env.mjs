import fs from "fs";
import { globSync } from "glob";

const envRefs = new Map();
const files = globSync("src/**/*.{ts,tsx}", { nodir: true });
for (const f of files) {
  const c = fs.readFileSync(f, "utf8");
  const re = /process\.env\.([A-Z0-9_]+)/g;
  let m;
  while ((m = re.exec(c)) !== null) {
    const name = m[1];
    if (!envRefs.has(name)) envRefs.set(name, []);
    const line = c.slice(0, m.index).split("\n").length;
    envRefs.get(name).push(`${f}:${line}`);
  }
}

let example = "";
for (const ex of [".env.local.example", ".env.example"]) {
  if (fs.existsSync(ex)) {
    example = fs.readFileSync(ex, "utf8");
    break;
  }
}

for (const [name, locs] of [...envRefs.entries()].sort()) {
  const inExample = example.includes(name);
  console.log(JSON.stringify({ name, count: locs.length, inExample, locs: locs.slice(0, 5) }));
}
