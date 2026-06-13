/// <reference lib="webworker" />

type WorkerAnalyzeRequest = {
  type: "analyze";
  id: string;
  buffer: ArrayBuffer;
  width: number;
  height: number;
};

type WorkerCompareRequest = {
  type: "compare";
  idA: string;
  ratingA: { score: number; deltaPercent: number; highlights: string[] };
  idB: string;
  ratingB: { score: number; deltaPercent: number; highlights: string[] };
};

type WorkerRequest = WorkerAnalyzeRequest | WorkerCompareRequest;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function analyzePixels(px: Uint8ClampedArray, width: number, height: number) {
  const n = width * height;
  let sumL = 0;
  let sumL2 = 0;
  let sumSat = 0;
  let maxEdge = 0;
  let maxContrast = 0;
  let focalX = 0.5;
  let focalY = 0.5;
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
          ? Math.abs(l - px[((y - 1) * width + x) * 4] / 255) +
            Math.abs(l - px[(y * width + (x - 1)) * 4] / 255)
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

  return {
    brightness: clamp01(meanL),
    contrast: clamp01(Math.sqrt(variance) * 3.2 + maxEdge * 0.15),
    saturation: clamp01(sumSat / n),
    ruleOfThirdsScore: clamp01(totalEnergy > 0 ? thirdsEnergy / totalEnergy : 0.5),
    focalX,
    focalY,
  };
}

function rateMetrics(metrics: ReturnType<typeof analyzePixels>) {
  const brightnessScore = 1 - Math.abs(metrics.brightness - 0.58) / 0.4;
  const contrastScore = 1 - Math.abs(metrics.contrast - 0.62) / 0.35;
  const thirdsScore = 1 - Math.abs(metrics.ruleOfThirdsScore - 0.72) / 0.35;
  const saturationScore = 1 - Math.abs(metrics.saturation - 0.48) / 0.35;

  const weighted =
    clamp01(brightnessScore) * 0.28 +
    clamp01(contrastScore) * 0.34 +
    clamp01(thirdsScore) * 0.22 +
    clamp01(saturationScore) * 0.16;

  const score = Math.round(clamp01(weighted) * 100);
  const deltaPercent = score - 50;

  const highlights: string[] = [];
  if (contrastScore > 0.75) highlights.push("optimaler Kontrast");
  if (brightnessScore > 0.7) highlights.push("Mobile-Helligkeit ideal");
  if (thirdsScore > 0.65) highlights.push("Drittel-Regel stark");
  if (saturationScore > 0.65) highlights.push("Feed-Sättigung on-point");
  if (highlights.length === 0) highlights.push("CTR-Potenzial verbesserbar");

  return { score, deltaPercent, highlights };
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  if (msg.type === "analyze") {
    const px = new Uint8ClampedArray(msg.buffer);
    const metrics = analyzePixels(px, msg.width, msg.height);
    const rating = rateMetrics(metrics);
    self.postMessage({ type: "analyzed", id: msg.id, metrics, rating });
    return;
  }

  if (msg.type === "compare") {
    const delta = msg.ratingA.score - msg.ratingB.score;
    const absDelta =
      Math.abs(msg.ratingA.deltaPercent - msg.ratingB.deltaPercent) || Math.abs(delta);
    if (Math.abs(delta) < 3) {
      self.postMessage({
        type: "compared",
        winnerId: msg.idA,
        loserId: msg.idB,
        deltaPercent: 0,
        reason: "Beide Thumbnails gleichauf",
      });
      return;
    }
    const aWins = delta > 0;
    self.postMessage({
      type: "compared",
      winnerId: aWins ? msg.idA : msg.idB,
      loserId: aWins ? msg.idB : msg.idA,
      deltaPercent: absDelta,
      reason: aWins
        ? msg.ratingA.highlights[0] ?? "höhere Gesamtbewertung"
        : msg.ratingB.highlights[0] ?? "höhere Gesamtbewertung",
    });
  }
};

export {};
