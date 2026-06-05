import fs from "fs";
import path from "path";

const messagesDir = path.join(process.cwd(), "messages");

function patchFile(filePath) {
  let s = fs.readFileSync(filePath, "utf8");
  const before = s;
  s = s.replace(/€4,99/g, "€9,99");
  s = s.replace(/€4\.99/g, "€9.99");
  s = s.replace(/4,99'dan/g, "9,99'dan");
  if (s !== before) {
    fs.writeFileSync(filePath, s);
    console.log("updated", path.relative(messagesDir, filePath));
  }
}

for (const name of fs.readdirSync(messagesDir)) {
  if (name.endsWith(".json")) patchFile(path.join(messagesDir, name));
}

const patchesDir = path.join(messagesDir, "patches");
if (fs.existsSync(patchesDir)) {
  for (const name of fs.readdirSync(patchesDir)) {
    if (name.endsWith(".json")) patchFile(path.join(patchesDir, name));
  }
}
