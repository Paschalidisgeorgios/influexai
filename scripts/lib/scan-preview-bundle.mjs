/**
 * Scan Preview client bundle for Supabase refs (no secrets logged).
 */
import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  STAGING_REF,
  PROD_REF,
  extractSupabaseRefsFromText,
} from "./supabase-env-audit.mjs";

export async function scanPreviewBundle(previewBase) {
  const base = previewBase.replace(/\/$/, "");
  const htmlTmp = join(tmpdir(), `launch-bundle-${Date.now()}.html`);
  try {
    execSync(`npx vercel curl "${base}/auth/sign-in" -s -o "${htmlTmp}"`, {
      stdio: "pipe",
      env: cleanVercelEnv(process.env),
    });
    const html = readFileSync(htmlTmp, "utf8");
    unlinkSync(htmlTmp);

    const jsPaths = new Set();
    for (const m of html.matchAll(/\/_next\/static\/[^\s"'<>]+\.js[^\s"'<>]*/g)) {
      jsPaths.add(m[0].split("?")[0]);
    }

    const merged = { url_refs: new Set(), anon_jwt_refs: new Set() };
    const scanText = (text) => {
      const { url_refs, anon_jwt_refs } = extractSupabaseRefsFromText(text);
      url_refs.forEach((r) => merged.url_refs.add(r));
      anon_jwt_refs.forEach((r) => merged.anon_jwt_refs.add(r));
    };
    scanText(html);

    let scanned = 0;
    for (const jsPath of jsPaths) {
      const chunkTmp = join(tmpdir(), `launch-chunk-${scanned}.js`);
      try {
        execSync(
          `npx vercel curl "${base}${jsPath}" -s -o "${chunkTmp}"`,
          { stdio: "pipe", env: cleanVercelEnv(process.env) }
        );
        scanText(readFileSync(chunkTmp, "utf8"));
        scanned += 1;
      } catch {
        /* skip unreadable chunk */
      } finally {
        try {
          unlinkSync(chunkTmp);
        } catch {
          /* ignore */
        }
      }
    }

    const urlRefs = [...merged.url_refs];
    const anonRefs = [...merged.anon_jwt_refs];
    const urlAnonMismatch =
      urlRefs.length >= 1 &&
      anonRefs.length >= 1 &&
      !anonRefs.some((r) => urlRefs.includes(r));

    return {
      js_chunks_scanned: scanned,
      url_refs: urlRefs,
      anon_jwt_refs: anonRefs,
      staging_url_ref: urlRefs.includes(STAGING_REF),
      production_url_ref: urlRefs.includes(PROD_REF),
      production_anon_ref: anonRefs.includes(PROD_REF),
      staging_anon_ref: anonRefs.includes(STAGING_REF),
      url_anon_mismatch: urlAnonMismatch,
      bundle_gate_pass:
        urlRefs.includes(STAGING_REF) &&
        !urlRefs.includes(PROD_REF) &&
        !anonRefs.includes(PROD_REF) &&
        anonRefs.includes(STAGING_REF) &&
        !urlAnonMismatch,
    };
  } catch (err) {
    return { error: String(err.message ?? err).slice(0, 200) };
  }
}

export function cleanVercelEnv(baseEnv) {
  const env = { ...baseEnv };
  delete env.VERCEL_DEBUG;
  delete env.DEBUG;
  return env;
}
