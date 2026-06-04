import sharp from "sharp";

const PREVIEW_MAX_PX = 512;
const WATERMARK_TEXT = "InfluexAI";

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Bild konnte nicht geladen werden (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/** Low-res JPEG preview with diagonal watermark (never expose original URL to client). */
export async function buildProtectedPreviewBuffer(source: Buffer): Promise<Buffer> {
  const resized = await sharp(source)
    .resize(PREVIEW_MAX_PX, PREVIEW_MAX_PX, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const width = meta.width ?? PREVIEW_MAX_PX;
  const height = meta.height ?? PREVIEW_MAX_PX;
  const fontSize = Math.round(Math.min(width, height) * 0.14);

  const watermarkSvg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        transform="rotate(-32, ${width / 2}, ${height / 2})"
        font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fontSize}"
        fill="white" fill-opacity="0.15">${WATERMARK_TEXT}</text>
    </svg>`
  );

  return sharp(resized)
    .composite([{ input: watermarkSvg, blend: "over" }])
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();
}

export async function buildFinalStorageBuffer(source: Buffer): Promise<Buffer> {
  return sharp(source)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}
