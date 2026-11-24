export interface SignatureProcessingOptions {
  /** Threshold for background detection (0 to 100). Default ~ 40 */
  threshold: number;
  /** Edge smoothness / feathering (0 to 100). Default ~ 35 */
  smoothness: number;
  /** Ink contrast boost (0 to 100). Default ~ 20 */
  contrastBoost: number;
  /** Whether to de-halo edge pixels by removing paper tint. Default true */
  removeHalo: boolean;
  /** Custom background color override if user picks a specific paper color */
  customBgColor?: { r: number; g: number; b: number } | null;
}

export interface SignatureProcessingResult {
  transparentDataUrl: string;
  originalDataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  detectedPaperColor: { r: number; g: number; b: number; name: string };
  isAlreadyTransparent: boolean;
}

export const DEFAULT_SIGNATURE_OPTIONS: SignatureProcessingOptions = {
  threshold: 38,
  smoothness: 35,
  contrastBoost: 20,
  removeHalo: true,
  customBgColor: null,
};

/**
 * Helper to load an image element from a dataUrl or File
 */
export function loadImageElement(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Detects the dominant paper/background color by sampling perimeter pixels.
 * Strictly ignores transparent/semi-transparent pixels and filters out dark ink
 * so transparent PNGs and tightly-cropped signatures never falsely register as black background.
 */
export function detectBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { r: number; g: number; b: number; name: string } {
  const samples: { r: number; g: number; b: number; lum: number }[] = [];

  // Sample top and bottom rows
  const step = Math.max(1, Math.floor(width / 50));
  for (let x = 0; x < width; x += step) {
    const topIdx = x * 4;
    if (data[topIdx + 3] > 180) {
      const r = data[topIdx];
      const g = data[topIdx + 1];
      const b = data[topIdx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum >= 120) {
        samples.push({ r, g, b, lum });
      }
    }

    const btmIdx = ((height - 1) * width + x) * 4;
    if (data[btmIdx + 3] > 180) {
      const r = data[btmIdx];
      const g = data[btmIdx + 1];
      const b = data[btmIdx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum >= 120) {
        samples.push({ r, g, b, lum });
      }
    }
  }

  // Sample left and right columns
  const stepY = Math.max(1, Math.floor(height / 30));
  for (let y = 0; y < height; y += stepY) {
    const leftIdx = (y * width) * 4;
    if (data[leftIdx + 3] > 180) {
      const r = data[leftIdx];
      const g = data[leftIdx + 1];
      const b = data[leftIdx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum >= 120) {
        samples.push({ r, g, b, lum });
      }
    }

    const rightIdx = (y * width + (width - 1)) * 4;
    if (data[rightIdx + 3] > 180) {
      const r = data[rightIdx];
      const g = data[rightIdx + 1];
      const b = data[rightIdx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum >= 120) {
        samples.push({ r, g, b, lum });
      }
    }
  }

  // If mostly transparent perimeter or insufficient samples, default to pure white paper
  if (samples.length < 10) {
    return { r: 255, g: 255, b: 255, name: 'White Paper' };
  }

  // Sort samples by luminance to pick representative paper background (exclude stray ink on border)
  samples.sort((a, b) => a.lum - b.lum);
  // Pick from the upper quartile (75th percentile) to capture true paper color
  const sampleIndex = Math.min(samples.length - 1, Math.floor(samples.length * 0.75));
  const chosen = samples[sampleIndex];

  const r = chosen.r;
  const g = chosen.g;
  const b = chosen.b;
  const lum = chosen.lum;

  // Real certificate signatures are photographed or scanned on light paper.
  // If perimeter happens to be dark or shadowed (<140), enforce white paper fallback
  if (lum < 140) {
    return { r: 255, g: 255, b: 255, name: 'White Paper' };
  }

  // Determine descriptive label
  let name = 'White Paper';
  if (r > 230 && g > 220 && b < 210) {
    name = 'Cream / Warm Paper';
  } else if (lum < 210 && lum > 160) {
    name = 'Slightly Grey / Photographed Paper';
  } else if (lum <= 160) {
    name = 'Shadowed / Dim Paper';
  }

  return { r, g, b, name };
}

/**
 * Core Automatic Signature Background Removal Engine
 * Analyzes pixels, removes paper background into transparency,
 * and guarantees that handwritten signature strokes remain deep opaque black (#000000)
 * without fading, transparency loss, or white halos.
 */
export async function removeSignatureBackground(
  imageSource: string | File,
  options: Partial<SignatureProcessingOptions> = {}
): Promise<SignatureProcessingResult> {
  const opts: SignatureProcessingOptions = {
    ...DEFAULT_SIGNATURE_OPTIONS,
    ...options,
  };

  const img = await loadImageElement(imageSource);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // Render original to canvas
  const origCanvas = document.createElement('canvas');
  origCanvas.width = width;
  origCanvas.height = height;
  const origCtx = origCanvas.getContext('2d', { willReadFrequently: true })!;
  origCtx.drawImage(img, 0, 0);

  const origDataUrl = origCanvas.toDataURL('image/png');
  const imgData = origCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Check if image is ALREADY transparent (e.g. >5% pixels have alpha < 220)
  let transparentPixelCount = 0;
  let totalChecked = 0;
  for (let i = 3; i < data.length; i += 16) {
    totalChecked++;
    if (data[i] < 220) transparentPixelCount++;
  }
  const isAlreadyTransparent = transparentPixelCount > totalChecked * 0.05;

  // Create destination transparent buffer
  const destCanvas = document.createElement('canvas');
  destCanvas.width = width;
  destCanvas.height = height;
  const destCtx = destCanvas.getContext('2d')!;
  const destImgData = destCtx.createImageData(width, height);
  const destData = destImgData.data;

  // If already transparent, preserve transparency and ensure black strokes are 100% solid black (#000000)
  if (isAlreadyTransparent) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 15) {
        destData[i] = 0;
        destData[i + 1] = 0;
        destData[i + 2] = 0;
        destData[i + 3] = 0;
      } else {
        // Check for colored pen (e.g. blue or red ink)
        const isBluePen = (b > r + 30 && b > g + 15) || (b > 120 && b > r * 1.3 && b > g * 1.2);
        const isColored = isBluePen || (r > g + 45 && r > b + 45);

        if (!isColored) {
          // Standard black handwritten signature:
          // ENFORCE pure black #000000 for all strokes!
          // NEVER convert to white, grey, or faded!
          destData[i] = 0;
          destData[i + 1] = 0;
          destData[i + 2] = 0;

          // Never make black signature strokes transparent:
          // Boost core strokes to full solid opacity (255)
          // For anti-aliased edge pixels, ensure high opacity so strokes stay sharp
          if (a >= 50) {
            destData[i + 3] = 255;
          } else {
            destData[i + 3] = Math.min(255, Math.round(a * 1.8));
          }
        } else {
          // Colored ink: retain authentic hue with solid opacity
          destData[i] = r;
          destData[i + 1] = g;
          destData[i + 2] = b;
          destData[i + 3] = a >= 50 ? 255 : Math.min(255, Math.round(a * 1.8));
        }
      }
    }

    destCtx.putImageData(destImgData, 0, 0);
    const transparentDataUrl = destCanvas.toDataURL('image/png');
    return {
      transparentDataUrl,
      originalDataUrl: origDataUrl,
      width,
      height,
      aspectRatio: width / height,
      detectedPaperColor: { r: 255, g: 255, b: 255, name: 'Transparent PNG' },
      isAlreadyTransparent: true,
    };
  }

  // Detect paper color
  const detectedBg = opts.customBgColor
    ? { ...opts.customBgColor, name: 'Custom Color' }
    : detectBackgroundColor(data, width, height);
  const bgR = detectedBg.r;
  const bgG = detectedBg.g;
  const bgB = detectedBg.b;
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

  // Threshold and alpha-matting calculations
  // paperTolerance: deviation threshold for paper background
  const paperTolerance = Math.max(12, 16 + (opts.threshold / 100) * 24);

  // Transition width for anti-aliasing edge (keep tight so strokes remain solid black)
  const transitionWidth = Math.max(5, 6 + (opts.smoothness / 100) * 10);
  const inkOpaqueCutoff = paperTolerance + transitionWidth;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // If pixel was already transparent in original, preserve it
    if (a < 15) {
      destData[i] = 0;
      destData[i + 1] = 0;
      destData[i + 2] = 0;
      destData[i + 3] = 0;
      continue;
    }

    // Luminance comparison (ink is darker than background paper)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const lumDiff = Math.max(0, bgLum - lum);

    // Color Euclidean distance to detected background
    const dR = r - bgR;
    const dG = g - bgG;
    const dB = b - bgB;
    const colorDist = Math.sqrt(dR * dR + dG * dG + dB * dB);

    // Composite distance: combines color deviation and ink darkness
    const effectiveDistance = Math.max(colorDist, lumDiff * 1.3);

    // 1. Definite paper background -> Make 100% transparent
    if (effectiveDistance <= paperTolerance) {
      destData[i] = 0;
      destData[i + 1] = 0;
      destData[i + 2] = 0;
      destData[i + 3] = 0;
      continue;
    }

    // 2. Handwritten Ink Stroke
    // Check if the user signed with a colored pen (e.g. blue or red ink)
    const isBluePen = (b > r + 30 && b > g + 15) || (b > 120 && b > r * 1.3 && b > g * 1.2);
    const isColored = isBluePen || (r > g + 45 && r > b + 45);

    let finalR = 0;
    let finalG = 0;
    let finalB = 0;
    let targetAlpha = 255;

    if (effectiveDistance >= inkOpaqueCutoff) {
      // Core stroke: 100% full opacity, ZERO fading, solid black #000000
      targetAlpha = 255;
      if (isColored) {
        finalR = r;
        finalG = g;
        finalB = b;
      }
    } else {
      // Transition edge: smooth anti-aliased edge feathering
      // Ensure high minimum opacity (140..255) so strokes NEVER become faint or transparent
      const t = (effectiveDistance - paperTolerance) / transitionWidth;
      const alphaT = Math.min(1, Math.max(0, t));
      targetAlpha = Math.min(255, Math.round(140 + Math.pow(alphaT, 0.6) * 115));

      if (isColored) {
        if (opts.removeHalo) {
          const alphaFactor = targetAlpha / 255;
          const oneMinusA = 1 - alphaFactor;
          finalR = Math.max(0, Math.min(r, Math.round((r - oneMinusA * bgR) / alphaFactor)));
          finalG = Math.max(0, Math.min(g, Math.round((g - oneMinusA * bgG) / alphaFactor)));
          finalB = Math.max(0, Math.min(b, Math.round((b - oneMinusA * bgB) / alphaFactor)));
        } else {
          finalR = r;
          finalG = g;
          finalB = b;
        }
      }
    }

    destData[i] = finalR;
    destData[i + 1] = finalG;
    destData[i + 2] = finalB;
    destData[i + 3] = targetAlpha;
  }

  // Write processed data
  destCtx.putImageData(destImgData, 0, 0);
  const transparentDataUrl = destCanvas.toDataURL('image/png');

  return {
    transparentDataUrl,
    originalDataUrl: origDataUrl,
    width,
    height,
    aspectRatio: width / height,
    detectedPaperColor: detectedBg,
    isAlreadyTransparent: false,
  };
}
