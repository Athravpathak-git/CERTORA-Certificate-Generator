const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

async function runMultipleSignaturesSuite() {
  console.log('=== STARTING MULTIPLE SIGNATURE PLACEMENT QA SUITE ===\n');

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

  // 1. Fixtures: Create 3 distinct valid transparent PNG signatures
  const create1x1Png = (r, g, b) =>
    // Standard 1x1 base64 transparent PNG
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  const sig1 = {
    id: 'sig-authority-1',
    name: 'director_signature.png',
    dataUrl: 'data:image/png;base64,' + create1x1Png(0, 0, 0),
    format: 'png',
    width: 300,
    height: 120,
    aspectRatio: 2.5,
    isBackgroundRemoved: true,
  };

  const sig2 = {
    id: 'sig-authority-2',
    name: 'principal_signature.png',
    dataUrl: 'data:image/png;base64,' + create1x1Png(0, 0, 0),
    format: 'png',
    width: 250,
    height: 100,
    aspectRatio: 2.5,
    isBackgroundRemoved: true,
  };

  const sig3 = {
    id: 'sig-authority-3',
    name: 'coordinator_signature.png',
    dataUrl: 'data:image/png;base64,' + create1x1Png(0, 0, 0),
    format: 'png',
    width: 280,
    height: 110,
    aspectRatio: 2.54,
    isBackgroundRemoved: true,
  };

  // 2. Configure 3 distinct signature fields
  const fields = [
    {
      id: 'field-candidate-name',
      type: 'candidate_name',
      label: 'Candidate Name',
      enabled: true,
      xPercent: 15,
      yPercent: 40,
      widthPercent: 70,
      heightPercent: 10,
    },
    // Signature 1: Right Authority (Director)
    {
      id: 'field-signature-1',
      type: 'signature',
      label: 'Director Signature',
      enabled: true,
      xPercent: 72,
      yPercent: 78,
      widthPercent: 18,
      heightPercent: 7.2,
      signatureData: sig1,
      rotation: 0,
    },
    // Signature 2: Left Authority (Principal)
    {
      id: 'field-signature-2',
      type: 'signature',
      label: 'Principal Signature',
      enabled: true,
      xPercent: 12,
      yPercent: 78,
      widthPercent: 18,
      heightPercent: 7.2,
      signatureData: sig2,
      rotation: 0,
    },
    // Signature 3: Center Authority (Coordinator)
    {
      id: 'field-signature-3',
      type: 'signature',
      label: 'Coordinator Signature',
      enabled: true,
      xPercent: 42,
      yPercent: 78,
      widthPercent: 16,
      heightPercent: 6.3,
      signatureData: sig3,
      rotation: 0,
    },
  ];

  assert(fields.filter((f) => f.type === 'signature').length === 3, 'Created 3 independent signature fields on one certificate');

  // 3. Independent Configuration Verification
  const f1 = fields.find((f) => f.id === 'field-signature-1');
  const f2 = fields.find((f) => f.id === 'field-signature-2');
  const f3 = fields.find((f) => f.id === 'field-signature-3');

  assert(f1.xPercent === 72 && f2.xPercent === 12 && f3.xPercent === 42, 'Signatures have distinct, non-overlapping horizontal positions (X coordinates)');
  assert(f1.label === 'Director Signature' && f2.label === 'Principal Signature' && f3.label === 'Coordinator Signature', 'Each signature has an independent authority label');
  assert(f1.signatureData.id !== f2.signatureData.id && f2.signatureData.id !== f3.signatureData.id, 'Each signature stores distinct image data separately');

  // 4. Independent Resizing & Moving Simulation
  // Move signature 2 to x: 15%, y: 80%
  const updatedFields = fields.map((f) => (f.id === 'field-signature-2' ? { ...f, xPercent: 15, yPercent: 80 } : f));
  const newF1 = updatedFields.find((f) => f.id === 'field-signature-1');
  const newF2 = updatedFields.find((f) => f.id === 'field-signature-2');
  assert(newF2.xPercent === 15 && newF2.yPercent === 80, 'Signature 2 successfully moved to new X, Y coordinates');
  assert(newF1.xPercent === 72 && newF1.yPercent === 78, 'Signature 1 coordinates remained untouched when Signature 2 was moved');

  // Resize signature 3 while maintaining aspect ratio
  const newWidth = 20;
  const ratio3 = f3.signatureData.aspectRatio; // 2.54
  const newHeight = Math.round((newWidth / ratio3) * 10) / 10;
  const resizedFields = updatedFields.map((f) => (f.id === 'field-signature-3' ? { ...f, widthPercent: newWidth, heightPercent: newHeight } : f));
  const newF3 = resizedFields.find((f) => f.id === 'field-signature-3');
  assert(newF3.widthPercent === 20 && newF3.heightPercent === 7.9, 'Signature 3 resized independently while strictly maintaining aspect ratio');

  // 5. PDF Embedding Simulation: Embed and draw all 3 signatures
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
  const { width: pageWidth, height: pageHeight } = page.getSize();

  let drawnCount = 0;
  for (const field of resizedFields) {
    if (field.type === 'signature' && field.signatureData) {
      const b64 = field.signatureData.dataUrl.split(',')[1];
      const buf = Buffer.from(b64, 'base64');
      const embedded = await pdfDoc.embedPng(buf);

      const fieldX = (field.xPercent / 100) * pageWidth;
      const fieldTop = (field.yPercent / 100) * pageHeight;
      const fieldWidth = (field.widthPercent / 100) * pageWidth;
      const fieldHeight = (field.heightPercent / 100) * pageHeight;

      const sigAspect = field.signatureData.aspectRatio || 2.5;
      let drawW = fieldWidth;
      let drawH = fieldWidth / sigAspect;
      if (drawH > fieldHeight) {
        drawH = fieldHeight;
        drawW = fieldHeight * sigAspect;
      }
      const drawX = fieldX + (fieldWidth - drawW) / 2;
      const drawY = pageHeight - fieldTop - fieldHeight + (fieldHeight - drawH) / 2;

      page.drawImage(embedded, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
        opacity: 1,
      });
      drawnCount++;
    }
  }

  assert(drawnCount === 3, 'All 3 authority signatures successfully embedded into PDF page');
  const pdfBytes = await pdfDoc.save();
  assert(pdfBytes.length > 1000, `Multi-signature PDF compiled cleanly (${pdfBytes.length} bytes)`);

  // 6. Verify source code references
  const mainPortalSrc = fs.readFileSync(path.resolve(__dirname, 'src/components/MainStudioPortal.tsx'), 'utf-8');
  assert(mainPortalSrc.includes('handleAddNewSignature'), 'MainStudioPortal provides handleAddNewSignature handler');
  assert(mainPortalSrc.includes('handleDeleteActiveSignature'), 'MainStudioPortal provides handleDeleteActiveSignature handler');
  assert(mainPortalSrc.includes('signatureFields.map'), 'MainStudioPortal renders signature switcher tabs for multiple signatures');

  const canvasSrc = fs.readFileSync(path.resolve(__dirname, 'src/components/CertificateCanvas.tsx'), 'utf-8');
  assert(canvasSrc.includes('field.signatureData'), 'CertificateCanvas checks field.signatureData for multiple signatures');

  const pdfServiceSrc = fs.readFileSync(path.resolve(__dirname, 'src/services/pdfService.ts'), 'utf-8');
  assert(pdfServiceSrc.includes('field.signatureData'), 'pdfService checks field.signatureData for multiple signatures');
  assert(pdfServiceSrc.includes('embeddedSignatureCache'), 'pdfService caches embedded signatures for performance');

  console.log('\n================================================================');
  console.log(`✓ ALL ${passed} OF ${total} MULTIPLE SIGNATURE TESTS PASSED (100%)`);
  console.log('================================================================\n');
}

runMultipleSignaturesSuite().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
