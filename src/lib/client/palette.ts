export type PaletteSample = { hex: string; coverage: number };

export type SamplingResult = {
  palette: PaletteSample[];
  width: number;
  height: number;
};

type Bucket = { r: number; g: number; b: number; count: number };

function hexOf(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function distance(a: PaletteSample, b: PaletteSample): number {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a.hex);
  const [r2, g2, b2] = parse(b.hex);
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}

/**
 * Quantise the screenshot in the browser so the image never leaves the device.
 * Returns the dominant colours with their share of sampled pixels.
 */
export async function samplePalette(file: File): Promise<SamplingResult> {
  const bitmap = await createImageBitmap(file);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;
  const maxSide = 560;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const { data } = ctx.getImageData(0, 0, width, height);
  const buckets = new Map<number, Bucket>();
  let total = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 200) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // 4-bit per channel bucket keeps the palette readable without over-merging.
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
    total += 1;
  }

  if (total === 0) throw new Error("NO_SIGNAL");

  const sorted = Array.from(buckets.values())
    .filter((b) => b.count / total >= 0.0015)
    .sort((a, b) => b.count - a.count)
    .map<PaletteSample>((b) => ({
      hex: hexOf(b.r / b.count, b.g / b.count, b.b / b.count),
      coverage: b.count / total,
    }));

  // Merge perceptually close buckets so near-identical shades collapse.
  const merged: PaletteSample[] = [];
  for (const sample of sorted) {
    const twin = merged.find((m) => distance(m, sample) < 24);
    if (twin) {
      twin.coverage += sample.coverage;
      continue;
    }
    merged.push({ ...sample });
  }

  const palette = merged.slice(0, 10).map((s) => ({
    hex: s.hex,
    coverage: Number(s.coverage.toFixed(4)),
  }));

  return { palette, width: originalWidth, height: originalHeight };
}
