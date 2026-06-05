/**
 * Generates landing-page example images for all tools via fal.ai.
 *
 * Usage: node --env-file=.env.local scripts/generate-example-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT_DIR = path.join(root, "public/images/examples");
const MODEL = "fal-ai/flux-pro";

const NEGATIVE_PROMPT = `
blurry, out of focus, low quality, low resolution,
pixelated, jpeg artifacts, compression artifacts,
bad anatomy, bad proportions, deformed, mutated,
extra limbs, missing limbs, floating limbs,
bad hands, extra fingers, missing fingers, fused fingers,
ugly, disfigured, malformed, distorted face,
text errors, gibberish text, wrong text, blurry text,
watermark, signature, logo, username, artist name,
cropped, cut off, out of frame,
oversaturated, overexposed, underexposed,
draft, sketch, unfinished, amateur,
noise, grain, film grain,
duplicate, clone, multiple people (unless requested),
bad composition, cluttered background
`
  .trim()
  .replace(/\n/g, ", ");

const QUALITY_PROMPT_PREFIX = `
masterpiece, best quality, ultra high resolution,
8K, photorealistic, hyperrealistic,
sharp focus, perfect lighting, cinematic,
professional photography, studio quality,
`
  .trim()
  .replace(/\n/g, ", ");

const TOOLS = [
  {
    id: "script",
    tool: "Script Generator",
    file: "script.jpg",
    prompt:
      "Young content creator at dark desk writing on laptop, neon green accent light, professional setup, cinematic dark mood, viral youtube shorts aesthetic",
    negativeExtra: "",
  },
  {
    id: "avatar",
    tool: "KI Avatar",
    file: "avatar.jpg",
    prompt:
      "Hyperrealistic AI digital avatar, perfect symmetrical face, professional headshot, studio lighting, photorealistic skin, dark background with subtle green glow, 8K portrait",
    negativeExtra: "cartoon, anime, CGI obvious",
  },
  {
    id: "thumbnail",
    tool: "Thumbnail Konzept",
    file: "thumbnail.jpg",
    prompt:
      "Eye-catching YouTube thumbnail, high contrast, bold neon colors, dramatic expression person holding phone, viral clickbait aesthetic but professional, dark background, bright green and yellow accents",
    negativeExtra: "boring, low contrast, flat",
  },
  {
    id: "faceswap",
    tool: "Face Swap",
    file: "faceswap.jpg",
    prompt:
      "Split screen showing two faces morphing together, digital transformation effect, dark cinematic background, neon green light accents, futuristic tech aesthetic",
    negativeExtra: "uncanny valley, distorted",
  },
  {
    id: "niche",
    tool: "Niche Analyzer",
    file: "niche.jpg",
    prompt:
      "Analytics dashboard on dark screen showing viral metrics, youtube growth charts, neon green numbers, person analyzing data on multiple monitors, dark office setup, cinematic lighting",
    negativeExtra: "boring, corporate, white background",
  },
  {
    id: "outlier",
    tool: "Outlier Detector",
    file: "outlier.jpg",
    prompt:
      "YouTube viral video metrics exploding upward, millions of views counter, dark UI dashboard, neon green glow on screen, dramatic data visualization, cinematic tech aesthetic",
    negativeExtra: "",
  },
  {
    id: "remix",
    tool: "Video Remix",
    file: "remix.jpg",
    prompt:
      "Video editing timeline on dark screen, split screen showing before and after transformation, neon green and purple light effects, cinematic, professional video production aesthetic",
    negativeExtra: "",
  },
  {
    id: "live",
    tool: "Live Creator",
    file: "live.jpg",
    prompt:
      "Person live streaming with AI avatar overlay, split screen webcam bottom right and AI character top, dark studio setup, red LIVE badge, neon green accents, futuristic streaming aesthetic",
    negativeExtra: "boring, low energy",
  },
  {
    id: "voice",
    tool: "Stimme und Musik",
    file: "voice.jpg",
    prompt:
      "Audio waveform visualization on dark background, neon green sound waves, professional microphone setup, music production aesthetic, cinematic dark mood, studio recording environment",
    negativeExtra: "",
  },
  {
    id: "product",
    tool: "Produkt Werbung",
    file: "product.jpg",
    prompt:
      "Luxury product on dark background with dramatic lighting, commercial photography style, neon green accent light, professional product advertisement, 8K studio shot, cosmetics or tech product floating in dark space",
    negativeExtra: "fake product, distorted",
  },
  {
    id: "viralscore",
    tool: "Viral Score",
    file: "viralscore.jpg",
    prompt:
      "Large 91 score displayed on dark screen, circular progress indicator in neon green, person celebrating viral success, confetti, dark background with glowing metrics",
    negativeExtra: "",
  },
  {
    id: "agent",
    tool: "KI Agent",
    file: "agent.jpg",
    prompt:
      "Futuristic AI brain network visualization, dark background with neon green neural connections, digital intelligence aesthetic, sci-fi tech art, abstract AI consciousness visualization",
    negativeExtra: "",
  },
];

function buildNegative(extra) {
  const parts = [NEGATIVE_PROMPT];
  if (extra?.trim()) parts.push(extra.trim());
  return parts.join(", ");
}

function buildPositive(prompt) {
  return `${QUALITY_PROMPT_PREFIX}${prompt.trim()}`;
}

function extractImageUrl(result) {
  return (
    result?.data?.images?.[0]?.url ??
    result?.data?.image?.url ??
    result?.images?.[0]?.url ??
    result?.image?.url ??
    null
  );
}

async function downloadToFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}): ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

async function main() {
  const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY;
  if (!key) {
    console.error("Set FAL_KEY or FAL_API_KEY in .env.local");
    process.exit(1);
  }

  const { fal } = await import("@fal-ai/client");
  fal.config({ credentials: key });

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const index = {
    generatedAt: new Date().toISOString(),
    model: MODEL,
    images: [],
  };

  for (const item of TOOLS) {
    const dest = path.join(OUT_DIR, item.file);
    const publicPath = `/images/examples/${item.file}`;

    console.log(`\n[${item.id}] Generating ${item.tool} → ${item.file}`);

    const result = await fal.subscribe(MODEL, {
      input: {
        prompt: buildPositive(item.prompt),
        negative_prompt: buildNegative(item.negativeExtra),
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 7.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs?.length) {
          const last = update.logs[update.logs.length - 1];
          if (last?.message) console.log(" ", last.message);
        }
      },
    });

    const url = extractImageUrl(result);
    if (!url) {
      console.error(`  ✗ No image URL for ${item.id}`);
      continue;
    }

    await downloadToFile(url, dest);
    const stat = fs.statSync(dest);
    console.log(`  ✓ Saved ${dest} (${Math.round(stat.size / 1024)} KB)`);

    index.images.push({
      id: item.id,
      tool: item.tool,
      path: publicPath,
      file: item.file,
      prompt: item.prompt,
      negativeExtra: item.negativeExtra || null,
      falUrl: url,
      bytes: stat.size,
    });
  }

  const indexPath = path.join(OUT_DIR, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
  console.log(`\nWrote ${indexPath} (${index.images.length}/${TOOLS.length} images)`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
