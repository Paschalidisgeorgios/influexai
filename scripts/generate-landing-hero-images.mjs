/**
 * Generates landing hero images via fal.ai (category darknoir).
 * Requires FAL_KEY or FAL_API_KEY in env.
 *
 * Usage: node --env-file=.env.local scripts/generate-landing-hero-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PROMPTS = [
  {
    out: "public/images/hero.jpg",
    prompt:
      "female content creator at dark desk, green neon light, MacBook, professional setup",
  },
  {
    out: "public/images/hero-2.jpg",
    prompt:
      "split screen AI avatar and real person, dark background, neon green glow",
  },
  {
    out: "public/images/hero-3.jpg",
    prompt:
      "phone with viral metrics display, millions of views, dark UI, neon numbers",
  },
];

const PREFIX =
  "dark noir aesthetic, black background, neon green or acid yellow accent lighting, high contrast, cinematic dark mood, professional photography, ";
const NEGATIVE =
  "blurry, low quality, watermark, bright cheerful, white background, flat lighting, daytime";

async function main() {
  const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY;
  if (!key) {
    console.error("Set FAL_KEY or FAL_API_KEY");
    process.exit(1);
  }

  const { fal } = await import("@fal-ai/client");
  fal.config({ credentials: key });

  for (const { out, prompt } of PROMPTS) {
    console.log("Generating", out, "…");
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: PREFIX + prompt,
        negative_prompt: NEGATIVE,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "jpeg",
      },
      logs: true,
    });

    const url =
      result?.data?.images?.[0]?.url ??
      result?.images?.[0]?.url;
    if (!url) {
      console.error("No image URL for", out);
      continue;
    }

    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const dest = path.join(root, out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    console.log("Saved", dest);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
