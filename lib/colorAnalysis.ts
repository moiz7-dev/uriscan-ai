import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import UPNG from 'upng-js';
import { COLOR_SWATCHES, type ColorSwatch } from '@/constants/hydrationData';

export interface ColorCandidate {
  swatch: ColorSwatch;
  distance: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface AnalyzedColor {
  rgb: [number, number, number];
  hsl: [number, number, number];
  hex: string;
  swatch: ColorSwatch;
  distance: number;
  confidence: 'high' | 'medium' | 'low';
  /** Top 3 closest swatches, ordered by distance (index 0 is the best match). */
  candidates: ColorCandidate[];
  /** Fraction of pixels that were usable (not rejected as glare/shadow). */
  pixelCoverage: number;
}

// ─── Tuning constants ────────────────────────────────────────────────────────

/** Sample side length in pixels. 48×48 = 2304 pixels for robust statistics. */
const SAMPLE_SIZE = 48;

/**
 * Fraction of the smaller image dimension to crop from the center.
 * 0.45 = middle 45% — tight enough to avoid container walls, large enough
 * to capture the liquid body.
 */
const CENTER_FRACTION = 0.45;

/** Reject pixels darker than this (shadows, container walls in dim areas). */
const MIN_BRIGHTNESS = 28;

/** Reject pixels brighter than this (glare, direct flash, blown highlights). */
const MAX_BRIGHTNESS = 238;

/** Number of top candidates to return. */
const TOP_N = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/**
 * Convert [0–255] RGB to HSL.
 * Returns [hue °0–360, saturation 0–1, lightness 0–1].
 */
function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l]; // achromatic

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) {
    h = (gn - bn) / d + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }
  return [h * 60, s, l];
}

/**
 * Perceptually-weighted HSL distance between two RGB colors.
 *
 * Why HSL instead of raw RGB:
 * • RGB space is not perceptually uniform — a 30-unit shift in red looks very
 *   different from a 30-unit shift in blue.
 * • Urine hues span yellow (40–55°) → amber → orange → red (0–20°) → brown,
 *   plus off-spectrum clear (~200°), cloudy (gray, low S), and green (144°).
 *   HSL separates hue, saturation, and brightness cleanly so adjacent swatches
 *   have consistent distances.
 *
 * Distance components:
 * • Hue distance — circular [0, 1]; weighted by mean saturation so that
 *   near-achromatic colors (clear, cloudy) are not penalized for unreliable hue.
 * • Saturation distance — distinguishes vivid amber from dull cloudy.
 * • Lightness distance — distinguishes pale-yellow from dark-brown.
 */
function hslDistance(
  rgbA: [number, number, number],
  rgbB: [number, number, number],
): number {
  const [h1, s1, l1] = rgbToHsl(rgbA);
  const [h2, s2, l2] = rgbToHsl(rgbB);

  // Circular hue distance, normalised to [0, 1]
  const rawHueDiff = Math.abs(h1 - h2);
  const dh = Math.min(rawHueDiff, 360 - rawHueDiff) / 180;

  const ds = Math.abs(s1 - s2);
  const dl = Math.abs(l1 - l2);

  // Hue weight is scaled by how chromatic the two colors are.
  // Near-achromatic pixels have unreliable hue readings, so reduce hue
  // influence and rely more on saturation + lightness.
  const chromaWeight = (s1 + s2) / 2;

  return Math.sqrt(
    3.0 * chromaWeight * dh * dh +
    2.0 * ds * ds +
    1.5 * dl * dl,
  );
}

/**
 * Compute the median of a sorted array of channel values.
 * Using median instead of mean makes the result robust to outlier pixels
 * (glare streaks, small dark shadows) that bias the mean significantly.
 */
function medianOf(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Extract the median RGB from an RGBA pixel buffer, rejecting pixels that are
 * too dark (shadow) or too bright (glare / overexposure).
 *
 * Returns null if fewer than 10% of pixels survived rejection — this
 * indicates the image crop was mostly blank, and the caller should fall back
 * gracefully.
 */
function extractMedianRgb(
  pixels: Uint8Array,
  minBrightness: number,
  maxBrightness: number,
): { rgb: [number, number, number]; coverage: number } | null {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const total = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < 200) continue; // skip transparent pixels

    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const brightness = (r + g + b) / 3;

    if (brightness < minBrightness || brightness > maxBrightness) continue;

    rs.push(r);
    gs.push(g);
    bs.push(b);
  }

  if (rs.length < total * 0.1) return null; // < 10% usable

  return {
    rgb: [medianOf(rs), medianOf(gs), medianOf(bs)],
    coverage: rs.length / total,
  };
}

/**
 * Grade confidence based on:
 * 1. The absolute distance of the best match (lower = more confident).
 * 2. The gap between the best match and the second-best (larger = more confident).
 */
function gradeConfidence(
  bestDistance: number,
  secondBestDistance: number,
): 'high' | 'medium' | 'low' {
  const gap = secondBestDistance - bestDistance;

  if (bestDistance < 0.12 && gap > 0.07) return 'high';
  if (bestDistance < 0.28 && gap > 0.03) return 'medium';
  return 'low';
}

/**
 * Find the TOP_N closest swatches to the given RGB color using HSL distance.
 */
function findTopCandidates(
  rgb: [number, number, number],
): ColorCandidate[] {
  const ranked = COLOR_SWATCHES
    .map((swatch) => ({
      swatch,
      distance: hslDistance(rgb, hexToRgb(swatch.hex)),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, TOP_N);

  const best = ranked[0].distance;
  const second = ranked[1]?.distance ?? best + 1;

  return ranked.map((r, i) => ({
    swatch: r.swatch,
    distance: r.distance,
    confidence: i === 0
      ? gradeConfidence(best, second)
      : gradeConfidence(r.distance, ranked[i + 1]?.distance ?? r.distance + 1),
  }));
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze a photo URI and return the closest urine color swatch.
 *
 * Algorithm:
 * 1. Crop the center 45% of the image (where the sample is).
 * 2. Downsample to 48×48 for fast pixel access.
 * 3. Convert RGBA buffer to a list of RGB pixels.
 * 4. Reject outlier pixels (shadows, glare).
 * 5. Compute the median R, G, B — robust to residual outliers.
 * 6. Find the closest swatch using HSL perceptual distance.
 * 7. Return the top 3 candidates with confidence scores.
 */
export async function analyzePhotoColor(
  uri: string,
  width: number,
  height: number,
): Promise<AnalyzedColor> {
  const shorter = Math.min(width, height);
  const cropSize = Math.floor(shorter * CENTER_FRACTION);
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

  const extracted = extractMedianRgb(rgba, MIN_BRIGHTNESS, MAX_BRIGHTNESS);

  if (!extracted) {
    // Fallback: all pixels were outliers (very dark or very bright image).
    // Try again without brightness filtering to get at least some result.
    const fallback = extractMedianRgb(rgba, 0, 255);
    if (!fallback) throw new Error('No usable pixels in the image crop');
    // Use the fallback rgb but set coverage to 0 to signal low quality
    const candidates = findTopCandidates(fallback.rgb);
    const top = candidates[0];
    return {
      rgb: fallback.rgb,
      hsl: rgbToHsl(fallback.rgb),
      hex: rgbToHex(fallback.rgb),
      swatch: top.swatch,
      distance: top.distance,
      confidence: 'low',
      candidates,
      pixelCoverage: 0,
    };
  }

  const { rgb, coverage } = extracted;
  const candidates = findTopCandidates(rgb);
  const top = candidates[0];

  // If pixel coverage is very low, downgrade confidence regardless of distance.
  const confidence =
    coverage < 0.25 ? 'low'
    : coverage < 0.5 ? (top.confidence === 'high' ? 'medium' : top.confidence)
    : top.confidence;

  return {
    rgb,
    hsl: rgbToHsl(rgb),
    hex: rgbToHex(rgb),
    swatch: top.swatch,
    distance: top.distance,
    confidence,
    candidates,
    pixelCoverage: coverage,
  };
}
