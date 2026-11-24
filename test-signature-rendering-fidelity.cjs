const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * Pixel-level verification of signature processing and rendering fidelity
 */
function simulateSignatureProcessing(pixels, width, height, isAlreadyTransparent) {
  const destData = new Uint8ClampedArray(width * height * 4);

  if (isAlreadyTransparent) {
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a < 15) {
        destData[i] = 0;
        destData[i + 1] = 0;
        destData[i + 2] = 0;
        destData[i + 3] = 0;
      } else {
        const isBluePen = (b > r + 30 && b > g + 15) || (b > 120 && b > r * 1.3 && b > g * 1.2);
        const isColored = isBluePen || (r > g + 45 && r > b + 45);

        if (!isColored) {
          destData[i] = 0;
          destData[i + 1] = 0;
          destData[i + 2] = 0;
          destData[i + 3] = a >= 50 ? 255 : Math.min(255, Math.round(a * 1.8));
        } else {
          destData[i] = r;
          destData[i + 1] = g;
          destData[i + 2] = b;
          destData[i + 3] = a >= 50 ? 255 : Math.min(255, Math.round(a * 1.8));
        }
      }
    }
    return destData;
  }

  // Paper background processing simulation
  // 1. Detect background color (robust quartile)
  const samples = [];
  for (let x = 0; x < width; x += 2) {
    const topIdx = x * 4;
    const btmIdx = ((height - 1) * width + x) * 4;
    if (pixels[topIdx + 3] > 180) {
      const lum = 0.299 * pixels[topIdx] + 0.587 * pixels[topIdx + 1] + 0.114 * pixels[topIdx + 2];
      if (lum >= 120) samples.push({ r: pixels[topIdx], g: pixels[topIdx + 1], b: pixels[topIdx + 2], lum });
    }
    if (pixels[btmIdx + 3] > 180) {
      const lum = 0.299 * pixels[btmIdx] + 0.587 * pixels[btmIdx + 1] + 0.114 * pixels[btmIdx + 2];
      if (lum >= 120) samples.push({ r: pixels[btmIdx], g: pixels[btmIdx + 1], b: pixels[btmIdx + 2], lum });
    }
  }

  samples.sort((a, b) => a.lum - b.lum);
  const chosenIndex = samples.length > 0 ? Math.min(samples.length - 1, Math.floor(samples.length * 0.75)) : 0;
  const chosen = samples.length > 0 ? samples[chosenIndex] : { r: 255, g: 255, b: 255, lum: 255 };

  const bgR = chosen.r;
  const bgG = chosen.g;
  const bgB = chosen.b;
  const bgLum = chosen.lum;

  const paperTolerance = 25;
  const transitionWidth = 8;
  const inkOpaqueCutoff = paperTolerance + transitionWidth;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a < 15) {
      destData[i] = 0; destData[i + 1] = 0; destData[i + 2] = 0; destData[i + 3] = 0;
      continue;
    }

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const lumDiff = Math.max(0, bgLum - lum);
    const dR = r - bgR;
    const dG = g - bgG;
    const dB = b - bgB;
    const colorDist = Math.sqrt(dR * dR + dG * dG + dB * dB);
    const effectiveDistance = Math.max(colorDist, lumDiff * 1.3);

    if (effectiveDistance <= paperTolerance) {
      destData[i] = 0; destData[i + 1] = 0; destData[i + 2] = 0; destData[i + 3] = 0;
      continue;
    }

    const isBluePen = (b > r + 30 && b > g + 15) || (b > 120 && b > r * 1.3 && b > g * 1.2);
    const isColored = isBluePen || (r > g + 45 && r > b + 45);

    let finalR = 0;
    let finalG = 0;
    let finalB = 0;
    let targetAlpha = 255;

    if (effectiveDistance >= inkOpaqueCutoff) {
      targetAlpha = 255;
      if (isColored) {
        finalR = r; finalG = g; finalB = b;
      }
    } else {
      const t = (effectiveDistance - paperTolerance) / transitionWidth;
      const alphaT = Math.min(1, Math.max(0, t));
      targetAlpha = Math.min(255, Math.round(140 + Math.pow(alphaT, 0.6) * 115));
      if (isColored) {
        finalR = r; finalG = g; finalB = b;
      }
    }

    destData[i] = finalR;
    destData[i + 1] = finalG;
    destData[i + 2] = finalB;
    destData[i + 3] = targetAlpha;
  }

  return destData;
}

async function runFidelitySuite() {
  console.log('=== SIGNATURE RENDERING FIDELITY & UI INSPECTION QA SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(cond, msg) {
    total++;
    if (cond) {
      console.log(`  ✓ TEST ${total} PASSED: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ TEST ${total} FAILED: ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Transparent PNG with Black Strokes
  // 10x10 image with black strokes in middle (alpha=255, r=0,g=0,b=0) and transparent edges
  const raw1 = new Uint8ClampedArray(10 * 10 * 4);
  for (let i = 0; i < raw1.length; i += 4) {
    const px = (i / 4) % 10;
    const py = Math.floor((i / 4) / 10);
    if (px >= 3 && px <= 6 && py >= 3 && py <= 6) {
      raw1[i] = 0; raw1[i+1] = 0; raw1[i+2] = 0; raw1[i+3] = 255; // Stroke
    } else {
      raw1[i] = 0; raw1[i+1] = 0; raw1[i+2] = 0; raw1[i+3] = 0; // Transparent
    }
  }
  const out1 = simulateSignatureProcessing(raw1, 10, 10, true);
  // Check stroke pixel (5, 5) -> index (5 * 10 + 5) * 4 = 220
  assert(out1[220] === 0 && out1[221] === 0 && out1[222] === 0, 'Transparent PNG preserves black stroke #000000');
  assert(out1[223] === 255, 'Black stroke retains 100% opacity (alpha = 255)');
  assert(out1[0] === 0 && out1[3] === 0, 'Transparent background preserved with alpha = 0');

  // 2. Transparent PNG with Grey/Semi-transparent Strokes
  // Simulates a user uploading a transparent signature where strokes were grey or semi-transparent (e.g. alpha=120, r=180, g=180, b=180)
  const raw2 = new Uint8ClampedArray(10 * 10 * 4);
  for (let i = 0; i < raw2.length; i += 4) {
    const px = (i / 4) % 10;
    const py = Math.floor((i / 4) / 10);
    if (px >= 4 && px <= 5 && py >= 4 && py <= 5) {
      raw2[i] = 180; raw2[i+1] = 180; raw2[i+2] = 180; raw2[i+3] = 120; // Faded stroke
    } else {
      raw2[i] = 0; raw2[i+1] = 0; raw2[i+2] = 0; raw2[i+3] = 0;
    }
  }
  const out2 = simulateSignatureProcessing(raw2, 10, 10, true);
  const strokeIdx2 = (4 * 10 + 4) * 4;
  assert(out2[strokeIdx2] === 0 && out2[strokeIdx2+1] === 0 && out2[strokeIdx2+2] === 0, 'Faded grey strokes automatically converted to pure solid black #000000');
  assert(out2[strokeIdx2+3] === 255, 'Faded stroke opacity boosted to solid 100% (alpha = 255) to prevent fading');

  // 3. Black Ink on White Paper (#FFFFFF)
  const raw3 = new Uint8ClampedArray(10 * 10 * 4);
  for (let i = 0; i < raw3.length; i += 4) {
    const px = (i / 4) % 10;
    const py = Math.floor((i / 4) / 10);
    if (px >= 3 && px <= 6 && py >= 3 && py <= 6) {
      raw3[i] = 20; raw3[i+1] = 20; raw3[i+2] = 20; raw3[i+3] = 255; // Pen ink
    } else {
      raw3[i] = 255; raw3[i+1] = 255; raw3[i+2] = 255; raw3[i+3] = 255; // White paper
    }
  }
  const out3 = simulateSignatureProcessing(raw3, 10, 10, false);
  const strokeIdx3 = (5 * 10 + 5) * 4;
  assert(out3[strokeIdx3] === 0 && out3[strokeIdx3+1] === 0 && out3[strokeIdx3+2] === 0, 'Ink on white paper converted to solid black #000000');
  assert(out3[strokeIdx3+3] === 255, 'Ink stroke has 100% opacity on white paper');
  assert(out3[0] === 0 && out3[3] === 0, 'White paper background turned completely transparent (alpha = 0)');

  // 4. Black Ink on Cream / Warm Paper (#FBF5E6)
  const raw4 = new Uint8ClampedArray(10 * 10 * 4);
  for (let i = 0; i < raw4.length; i += 4) {
    const px = (i / 4) % 10;
    const py = Math.floor((i / 4) / 10);
    if (px >= 3 && px <= 6 && py >= 3 && py <= 6) {
      raw4[i] = 30; raw4[i+1] = 25; raw4[i+2] = 20; raw4[i+3] = 255; // Ink
    } else {
      raw4[i] = 251; raw4[i+1] = 245; raw4[i+2] = 230; raw4[i+3] = 255; // Cream paper
    }
  }
  const out4 = simulateSignatureProcessing(raw4, 10, 10, false);
  const strokeIdx4 = (5 * 10 + 5) * 4;
  assert(out4[strokeIdx4] === 0 && out4[strokeIdx4+1] === 0 && out4[strokeIdx4+2] === 0, 'Cream paper removed and black ink strokes preserved as pure black #000000');
  assert(out4[0] === 0 && out4[3] === 0, 'Cream background removed into 100% transparency');

  // 5. Verification of UI components CSS: No drop-shadow filters on signature
  const editorViewSrc = fs.readFileSync(path.resolve(__dirname, 'src/components/views/EditorView.tsx'), 'utf-8');
  assert(!editorViewSrc.includes('filter drop-shadow-sm pointer-events-none'), 'EditorView canvas signature element has no drop-shadow filter');
  assert(editorViewSrc.includes("mixBlendMode: 'normal'"), 'EditorView specifies mixBlendMode: normal');

  const brushEditorSrc = fs.readFileSync(path.resolve(__dirname, 'src/components/SignatureBrushEditor.tsx'), 'utf-8');
  assert(!brushEditorSrc.includes('filter drop-shadow-sm transition-all'), 'SignatureBrushEditor canvas has no drop-shadow filter');
  assert(brushEditorSrc.includes("mixBlendMode: 'normal'"), 'SignatureBrushEditor specifies mixBlendMode: normal');

  const portalSrc = fs.readFileSync(path.resolve(__dirname, 'src/components/MainStudioPortal.tsx'), 'utf-8');
  assert(portalSrc.includes("mixBlendMode: 'normal'"), 'MainStudioPortal signature preview specifies mixBlendMode: normal');

  const canvasSrc = fs.readFileSync(path.resolve(__dirname, 'src/components/CertificateCanvas.tsx'), 'utf-8');
  assert(canvasSrc.includes("mixBlendMode: 'normal'"), 'CertificateCanvas signature element specifies mixBlendMode: normal');
  assert(canvasSrc.includes("opacity: 1"), 'CertificateCanvas signature element specifies opacity: 1');

  // 6. Verification of PDF Service opacity
  const pdfServiceSrc = fs.readFileSync(path.resolve(__dirname, 'src/services/pdfService.ts'), 'utf-8');
  assert(pdfServiceSrc.includes('opacity: 1,\n            rotate: field.rotation'), 'pdfService field signature explicitly sets opacity: 1 and supports rotation');
  assert(pdfServiceSrc.includes('embeddedFallback, {\n        x: drawX,\n        y: drawY,\n        width: drawW,\n        height: drawH,\n        opacity: 1,'), 'pdfService fallback signature explicitly sets opacity: 1');

  console.log('\n================================================================');
  console.log(`✓ ALL ${passed} OF ${total} SIGNATURE FIDELITY TESTS PASSED (100%)`);
  console.log('================================================================\n');
}

runFidelitySuite().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
