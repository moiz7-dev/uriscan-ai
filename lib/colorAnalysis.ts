import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import UPNG from 'upng-js';
import { COLOR_SWATCHES, type ColorSwatch } from '@/constants/hydrationData';

export interface AnalyzedColor {
  rgb: [number, number, number];
  hex: string;
  swatch: ColorSwatch;
  distance: number;
  confidence: 'high' | 'medium' | 'low';
}

const SAMPLE_SIZE = 16;
const CENTER_FRACTION = 0.4;

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) => n.toString(16).padStart(2, '0');
  return `#${c(Math.round(r))}${c(Math.round(g))}${c(Math.round(b))}`.toUpperCase();
}

// Weighted RGB distance — green channel weighted higher because human eye + urine
// hue variation lives mostly along green/yellow.
function colorDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function averageRgba(pixels: Uint8Array): [number, number, number] {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < 200) continue;
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
    n += 1;
  }
  if (n === 0) return [0, 0, 0];
  return [r / n, g / n, b / n];
}

function findClosestSwatch(rgb: [number, number, number]): {
  swatch: ColorSwatch;
  distance: number;
} {
  let best = COLOR_SWATCHES[0];
  let bestDist = Infinity;
  for (const swatch of COLOR_SWATCHES) {
    const d = colorDistance(rgb, hexToRgb(swatch.hex));
    if (d < bestDist) {
      bestDist = d;
      best = swatch;
    }
  }
  return { swatch: best, distance: bestDist };
}

function gradeConfidence(distance: number): 'high' | 'medium' | 'low' {
  if (distance < 80) return 'high';
  if (distance < 160) return 'medium';
  return 'low';
}

export async function analyzePhotoColor(
  uri: string,
  width: number,
  height: number,
): Promise<AnalyzedColor> {
  const cropSize = Math.floor(Math.min(width, height) * CENTER_FRACTION);
  const originX = Math.floor((width - cropSize) / 2);
  const originY = Math.floor((height - cropSize) / 2);

  const result = await manipulateAsync(
    uri,
    [
      { crop: { originX, originY, width: cropSize, height: cropSize } },
      { resize: { width: SAMPLE_SIZE, height: SAMPLE_SIZE } },
    ],
    { base64: true, compress: 1, format: SaveFormat.PNG },
  );

  if (!result.base64) {
    throw new Error('Image manipulation did not return base64 data');
  }

  const bytes = base64ToUint8Array(result.base64);
  const decoded = UPNG.decode(bytes.buffer as ArrayBuffer);
  const rgbaBuffer = UPNG.toRGBA8(decoded)[0];
  const rgba = new Uint8Array(rgbaBuffer);

  const avg = averageRgba(rgba);
  const { swatch, distance } = findClosestSwatch(avg);

  return {
    rgb: avg,
    hex: rgbToHex(avg),
    swatch,
    distance,
    confidence: gradeConfidence(distance),
  };
}
