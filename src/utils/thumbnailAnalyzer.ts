/** 2026 mobile feed CTR success matrix (research-backed heuristics). */
export const MOBILE_CTR_MATRIX_2026 = {
  brightness: { min: 0.38, max: 0.78, optimal: 0.58, weight: 0.28 },
  contrast: { min: 0.32, max: 0.88, optimal: 0.62, weight: 0.34 },
  ruleOfThirds: { optimal: 0.72, weight: 0.22 },
  saturation: { min: 0.25, max: 0.75, optimal: 0.48, weight: 0.16 },
  baselineCtr: 50,
} as const;

export type ThumbnailMetrics = {
  brightness: number;
  contrast: number;
  saturation: number;
  ruleOfThirdsScore: number;
  focalX: number;
  focalY: number;
};

export type ThumbnailCtrRating = {
  score: number;
  deltaPercent: number;
  highlights: string[];
};

export type ThumbnailCompareResult = {
  winnerId: string;
  loserId: string;
  deltaPercent: number;
  reason: string;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function gaussianProximity(value: number, optimal: number, spread: number): number {
  const d = Math.abs(value - optimal);
  return clamp01(1 - d / spread);
}

function inRangeScore(value: number, min: number, max: number, optimal: number): number {
  if (value < min || value > max) return clamp01(0.35 - Math.min(Math.abs(value - min), Math.abs(value - max)) * 0.5);
  return gaussianProximity(value, optimal, (max - min) / 2);
}

/** Pure pixel analysis — safe for worker or main thread (use downscaled ImageData). */
export function analyzeThumbnailFromImageData(data: ImageData): ThumbnailMetrics {
  const { width, height, data: px } = data;
  const n = width * height;
  if (n === 0) {
    return {
      brightness: 0.5,
      contrast: 0.5,
      saturation: 0.5,
      ruleOfThirdsScore: 0.5,
      focalX: 0.5,
      focalY: 0.5,
    };
  }

  let sumL = 0;
  let sumL2 = 0;
  let sumSat = 0;
  let maxEdge = 0;
  let focalX = 0;
  let focalY = 0;
  let maxContrast = 0;

  const thirdX = [width / 3, (2 * width) / 3];
  const thirdY = [height / 3, (2 * height) / 3];
  let thirdsEnergy = 0;
  let totalEnergy = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = px[i] / 255;
      const g = px[i + 1] / 255;
      const b = px[i + 2] / 255;
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;

      sumL += l;
      sumL2 += l * l;
      sumSat += sat;

      const edge =
        x > 0 && y > 0
          ? Math.abs(l - (px[((y - 1) * width + x) * 4] / 255)) +
            Math.abs(l - (px[(y * width + (x - 1)) * 4] / 255))
          : 0;
      maxEdge = Math.max(maxEdge, edge);

      if (edge > maxContrast) {
        maxContrast = edge;
        focalX = x / width;
        focalY = y / height;
      }

      const energy = edge + sat * 0.3;
      totalEnergy += energy;
      const nearThird =
        Math.abs(x - thirdX[0]) < width * 0.08 ||
        Math.abs(x - thirdX[1]) < width * 0.08 ||
        Math.abs(y - thirdY[0]) < height * 0.08 ||
        Math.abs(y - thirdY[1]) < height * 0.08;
      if (nearThird) thirdsEnergy += energy;
    }
  }

  const meanL = sumL / n;
  const variance = Math.max(0, sumL2 / n - meanL * meanL);
  const contrast = clamp01(Math.sqrt(variance) * 3.2 + maxEdge * 0.15);
  const saturation = clamp01(sumSat / n);
  const ruleOfThirdsScore = clamp01(totalEnergy > 0 ? thirdsEnergy / totalEnergy : 0.5);

  return {
    brightness: clamp01(meanL),
    contrast,
    saturation,
    ruleOfThirdsScore,
    focalX,
    focalY,
  };
}

export function rateThumbnailCtr(metrics: ThumbnailMetrics): ThumbnailCtrRating {
  const m = MOBILE_CTR_MATRIX_2026;
  const brightnessScore = inRangeScore(
    metrics.brightness,
    m.brightness.min,
    m.brightness.max,
    m.brightness.optimal
  );
  const contrastScore = inRangeScore(
    metrics.contrast,
    m.contrast.min,
    m.contrast.max,
    m.contrast.optimal
  );
  const saturationScore = inRangeScore(
    metrics.saturation,
    m.saturation.min,
    m.saturation.max,
    m.saturation.optimal
  );
  const thirdsScore = gaussianProximity(metrics.ruleOfThirdsScore, m.ruleOfThirds.optimal, 0.35);

  const weighted =
    brightnessScore * m.brightness.weight +
    contrastScore * m.contrast.weight +
    thirdsScore * m.ruleOfThirds.weight +
    saturationScore * m.saturation.weight;

  const score = Math.round(clamp01(weighted) * 100);
  const deltaPercent = score - m.baselineCtr;

  const highlights: string[] = [];
  if (contrastScore > 0.75) highlights.push("optimaler Kontrast");
  if (brightnessScore > 0.7) highlights.push("Mobile-Helligkeit ideal");
  if (thirdsScore > 0.65) highlights.push("Drittel-Regel stark");
  if (saturationScore > 0.65) highlights.push("Feed-Sättigung on-point");
  if (highlights.length === 0) highlights.push("CTR-Potenzial verbesserbar");

  return { score, deltaPercent, highlights };
}

export function compareThumbnailRatings(
  idA: string,
  ratingA: ThumbnailCtrRating,
  idB: string,
  ratingB: ThumbnailCtrRating
): ThumbnailCompareResult {
  const delta = ratingA.score - ratingB.score;
  if (Math.abs(delta) < 3) {
    return {
      winnerId: idA,
      loserId: idB,
      deltaPercent: 0,
      reason: "Beide Thumbnails gleichauf — minimaler CTR-Unterschied",
    };
  }
  const aWins = delta > 0;
  return {
    winnerId: aWins ? idA : idB,
    loserId: aWins ? idB : idA,
    deltaPercent: Math.abs(ratingA.deltaPercent - ratingB.deltaPercent) || Math.abs(delta),
    reason: aWins
      ? ratingA.highlights[0] ?? "höhere Gesamtbewertung"
      : ratingB.highlights[0] ?? "höhere Gesamtbewertung",
  };
}

export async function loadImageDataFromUrl(
  url: string,
  sampleSize = 128
): Promise<ImageData | null> {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      resolve(ctx.getImageData(0, 0, sampleSize, sampleSize));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function analyzeThumbnailFromUrl(url: string): Promise<{
  metrics: ThumbnailMetrics;
  rating: ThumbnailCtrRating;
} | null> {
  const data = await loadImageDataFromUrl(url);
  if (!data) return null;
  const metrics = analyzeThumbnailFromImageData(data);
  return { metrics, rating: rateThumbnailCtr(metrics) };
}
