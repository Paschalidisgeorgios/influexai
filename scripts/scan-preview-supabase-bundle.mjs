import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  extractSupabaseRefsFromText,
  STAGING_REF,
  PROD_REF,
} from "./lib/supabase-env-audit.mjs";

const preview = (
  process.argv[2] ??
  "https://influexai-iad04g5x8-paschalidisgeorgios-projects.vercel.app"
).replace(/\/$/, "");

const htmlTmp = join(tmpdir(), "vq-scan.html");
execSync(`npx vercel curl "${preview}/auth/sign-in" -s -o "${htmlTmp}"`, {
  stdio: "pipe",
});
const html = readFileSync(htmlTmp, "utf8");
unlinkSync(htmlTmp);

const jsPaths = new Set();
for (const m of html.matchAll(/\/_next\/static\/[^\s"'<>]+\.js[^\s"'<>]*/g)) {
  jsPaths.add(m[0].split("?")[0]);
}

const merged = { url_refs: new Set(), anon_jwt_refs: new Set() };
const scan = (text) => {
  const { url_refs, anon_jwt_refs } = extractSupabaseRefsFromText(text);
  url_refs.forEach((r) => merged.url_refs.add(r));
  anon_jwt_refs.forEach((r) => merged.anon_jwt_refs.add(r));
};
scan(html);

let n = 0;
for (const p of jsPaths) {
  const c = join(tmpdir(), `vq-c-${n}.js`);
  try {
    execSync(`npx vercel curl "${preview}${p}" -s -o "${c}"`, { stdio: "pipe" });
    scan(readFileSync(c, "utf8"));
    n += 1;
  } catch {
    /* skip */
  } finally {
    try {
      unlinkSync(c);
    } catch {
      /* ignore */
    }
  }
}

const urlRefs = [...merged.url_refs];
const anonRefs = [...merged.anon_jwt_refs];
console.log(
  JSON.stringify(
    {
      preview_url: preview,
      js_chunks_scanned: n,
      url_refs: urlRefs,
      anon_jwt_refs: anonRefs,
      staging_url_ref: urlRefs.includes(STAGING_REF),
      production_url_ref: urlRefs.includes(PROD_REF),
      url_anon_mismatch:
        urlRefs.length >= 1 &&
        anonRefs.length >= 1 &&
        !anonRefs.every((r) => urlRefs.includes(r)),
      secrets_logged: false,
    },
    null,
    2
  )
);
