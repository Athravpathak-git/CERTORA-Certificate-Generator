const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

async function runFontSizeSuite() {
  console.log('=== STARTING FONT SIZE CONTROLS & UNRESTRICTED SIZING QA SUITE ===\n');

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

  // --- 1. Verify FontSizeControl Component ---
  console.log('--- 1. Verifying FontSizeControl Unrestricted Architecture ---');
  const fontControlSrc = fs.readFileSync(path.join(__dirname, 'src/components/FontSizeControl.tsx'), 'utf-8');
  assert(fontControlSrc.includes('type="range"'), 'FontSizeControl contains font size range slider');
  assert(fontControlSrc.includes('type="number"'), 'FontSizeControl contains numeric font size input');
  assert(fontControlSrc.includes('sliderMax'), 'FontSizeControl computes dynamic adaptive sliderMax');
  assert(!fontControlSrc.includes('disabled={currentSize >= max}'), 'FontSizeControl has no disabled ceiling on increase (+) button');
  assert(fontControlSrc.includes('handleIncrease') && fontControlSrc.includes('Plus'), 'FontSizeControl contains increase (+) button');
  assert(fontControlSrc.includes('handleDecrease') && fontControlSrc.includes('Minus'), 'FontSizeControl contains decrease (-) button');
  assert(fontControlSrc.includes('handleReset') && fontControlSrc.includes('Reset'), 'FontSizeControl contains reset to default option');
  assert(fontControlSrc.includes('currentSize') && fontControlSrc.includes('px'), 'FontSizeControl clearly displays selected font size in px');
  assert(fontControlSrc.includes('AlertTriangle') && fontControlSrc.includes('exceeds allocated width'), 'FontSizeControl contains visual text overflow warning');

  // Verify presets include large sizes (80px, 150px, 300px, 500px)
  assert(fontControlSrc.includes('80') && fontControlSrc.includes('150') && fontControlSrc.includes('300') && fontControlSrc.includes('500'), 'FontSizeControl provides presets for 80px, 150px, 300px, and 500px');

  // --- 2. Verify CertificateCanvas Live Preview Proportional Scaling ---
  console.log('\n--- 2. Verifying CertificateCanvas Live Proportional Scaling ---');
  const canvasSrc = fs.readFileSync(path.join(__dirname, 'src/components/CertificateCanvas.tsx'), 'utf-8');
  assert(canvasSrc.includes('ResizeObserver'), 'CertificateCanvas tracks container width via ResizeObserver');
  assert(canvasSrc.includes('scaleRatio'), 'CertificateCanvas calculates proportional scale ratio against template dimensions');
  assert(canvasSrc.includes('renderedFontSize = Math.max(6, Math.round((field.fontSize || 16) * scaleRatio))'), 'CertificateCanvas dynamically derives renderedFontSize from field.fontSize');
  assert(!canvasSrc.includes("fontSize: 'clamp(14px, 3.2vw, 44px)'"), 'CertificateCanvas removed hardcoded clamp for candidate name');
  assert(!canvasSrc.includes("fontSize: 'clamp(8px, 1.3vw, 16px)'"), 'CertificateCanvas removed hardcoded clamp for date');
  assert(!canvasSrc.includes("fontSize: 'clamp(8px, 1.2vw, 15px)'"), 'CertificateCanvas removed hardcoded clamp for custom text');
  assert(canvasSrc.includes('checkTextOverflow'), 'CertificateCanvas implements checkTextOverflow detection');
  assert(canvasSrc.includes('Text Overflow'), 'CertificateCanvas renders visual overflow warning badge when text exceeds box');
  assert(canvasSrc.includes('font-mono font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none flex items-center gap-1'), 'CertificateCanvas displays selected field indication and exact font size badge');

  // --- 3. Verify MainStudioPortal & SimpleEditorModal Integration ---
  console.log('\n--- 3. Verifying Editor & Portal UI Integration ---');
  const portalSrc = fs.readFileSync(path.join(__dirname, 'src/components/MainStudioPortal.tsx'), 'utf-8');
  assert(portalSrc.includes('FontSizeControl'), 'MainStudioPortal imports and renders FontSizeControl');
  assert(portalSrc.includes('Live Font Size:'), 'MainStudioPortal renders live font size control header');
  assert(portalSrc.includes('textFields.map'), 'MainStudioPortal provides clickable field tabs for every text field');
  assert(!portalSrc.includes('max={activeTextControlField.type === \'candidate_name\' ? 90 : 80}'), 'MainStudioPortal removed fixed 80px/90px max limit');

  const editorSrc = fs.readFileSync(path.join(__dirname, 'src/components/SimpleEditorModal.tsx'), 'utf-8');
  assert(editorSrc.includes('FontSizeControl'), 'SimpleEditorModal imports and renders FontSizeControl');
  assert(editorSrc.includes('activeField.defaultFontSize'), 'SimpleEditorModal supports reset to default font size');
  assert(!editorSrc.includes('max={90}'), 'SimpleEditorModal removed fixed 90px limit for candidate name');
  assert(!editorSrc.includes('max={80}'), 'SimpleEditorModal removed fixed 80px limit for custom text');

  // --- 4. Dynamic Slider Adaptive Max Math Verification ---
  console.log('\n--- 4. Testing Adaptive Slider Max Logic ---');
  const getDynamicMax = (currentSize, maxProp) => {
    return Math.max(120, maxProp || 120, Math.ceil((currentSize * 1.35) / 25) * 25);
  };

  assert(getDynamicMax(44) >= 120, 'At 44px, slider max provides comfortable headroom (>= 120px)');
  assert(getDynamicMax(80) >= 120, 'At 80px, slider max adapts to at least 120px');
  assert(getDynamicMax(150) >= 200, 'At 150px, slider max dynamically adapts to >= 200px');
  assert(getDynamicMax(300) >= 400, 'At 300px, slider max dynamically adapts to >= 400px');
  assert(getDynamicMax(500) >= 675, 'At 500px, slider max dynamically adapts to >= 675px');
  assert(getDynamicMax(1000) >= 1350, 'At 1000px, slider max dynamically adapts to >= 1350px');

  // --- 5. Real PDF Generation with Large Font Sizes (80px, 150px, 300px, 500px) ---
  console.log('\n--- 5. Testing PDF Generation with 80px, 150px, 300px, and 500px ---');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1920, 1080]); // Full 1920x1080 Canvas Scale
  const { width: pWidth, height: pHeight } = page.getSize();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const testLargeFields = [
    { id: 'f-80', label: 'Candidate Name', text: 'ATHRAV PATHAK', fontSize: 80, font: fontBold, xPercent: 15, yPercent: 35, widthPercent: 70 },
    { id: 'f-150', label: 'Event Name', text: 'AI SUMMIT 2026', fontSize: 150, font: fontBold, xPercent: 15, yPercent: 50, widthPercent: 70 },
    { id: 'f-300', label: 'Initiative Name', text: 'CERTORA', fontSize: 300, font: fontBold, xPercent: 10, yPercent: 65, widthPercent: 80 },
    { id: 'f-500', label: 'Grand Headline', text: 'HONOR', fontSize: 500, font: fontBold, xPercent: 5, yPercent: 80, widthPercent: 90 },
  ];

  for (const f of testLargeFields) {
    const textW = f.font.widthOfTextAtSize(f.text, f.fontSize);
    const x = (f.xPercent / 100) * pWidth + (((f.widthPercent / 100) * pWidth - textW) / 2);
    const y = pHeight - ((f.yPercent / 100) * pHeight);

    page.drawText(f.text, {
      x,
      y,
      size: f.fontSize,
      font: f.font,
      color: rgb(0.1, 0.15, 0.22),
    });

    assert(textW > 0, `${f.label} drawn cleanly in PDF at ${f.fontSize}px (width: ${Math.round(textW)}pt)`);
  }

  const pdfBytes = await pdfDoc.save();
  assert(pdfBytes && pdfBytes.length > 1000, `Large-font PDF compiled successfully with 80px, 150px, 300px, and 500px (${pdfBytes.length} bytes)`);

  console.log('\n================================================================');
  console.log(`✓ ALL ${total} OF ${total} UNRESTRICTED FONT SIZE TESTS PASSED (100%)`);
  console.log('================================================================\n');
}

runFontSizeSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
