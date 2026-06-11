/**
 * Generates PWA icons (192, 512, maskable) — Acid Noir logo on #060608.
 * Optional: set FAL_KEY and RUN_FAL=1 to fetch from fal.ai flux schnell.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#060608"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#B4FF00" stroke-width="8" opacity="0.25"/>
  <path d="M148 340 L256 120 L364 340" fill="none" stroke="#B4FF00" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="256" y="400" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="56" font-weight="900" fill="#B4FF00" letter-spacing="4">IX</text>
</svg>`;

async function fromSvg() {
  const base = sharp(Buffer.from(SVG));
  await base.resize(192, 192).png().toFile(join(publicDir, "icon-192.png"));
  await base.resize(512, 512).png().toFile(join(publicDir, "icon-512.png"));
  const maskableSvg = SVG.replace(
    'viewBox="0 0 512 512"',
    'viewBox="0 0 512 512"'
  );
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: "#060608",
    })
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, "icon-maskable.png"));
  console.log("Generated icon-192.png, icon-512.png, icon-maskable.png from SVG");
}

async function fromFal() {
  const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!key) throw new Error("FAL_KEY missing");

  const prompt =
    "App icon, minimalist logo mark for InfluexAI, black background #060608, neon acid green #B4FF00 lightning bolt and letter IX, flat vector, no text clutter, centered, high contrast";

  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "square",
      num_images: 1,
    }),
  });

  if (!res.ok) throw new Error(`fal.ai ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const url = json.images?.[0]?.url;
  if (!url) throw new Error("No image URL from fal");

  const imgRes = await fetch(url);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const base = sharp(buf);
  await base.resize(192, 192).png().toFile(join(publicDir, "icon-192.png"));
  await base.resize(512, 512).png().toFile(join(publicDir, "icon-512.png"));
  await base
    .resize(384, 384)
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: "#060608",
    })
    .png()
    .toFile(join(publicDir, "icon-maskable.png"));
  console.log("Generated icons from fal.ai");
}

async function main() {
  if (process.env.RUN_FAL === "1") {
    try {
      await fromFal();
      return;
    } catch (e) {
      console.warn("fal failed, falling back to SVG:", e.message);
    }
  }
  await fromSvg();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
