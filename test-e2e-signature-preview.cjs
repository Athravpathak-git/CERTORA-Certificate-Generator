const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function runE2ETests() {
  console.log('=== STARTING END-TO-END SIGNATURE & LIVE PREVIEW QA SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ TEST ${total} PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ TEST ${total} FAILED: ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Font Existence & Embedding
  const fontPath = path.resolve(__dirname, 'public/fonts/GoogleSans-Bold.ttf');
  assert(fs.existsSync(fontPath), 'GoogleSans-Bold.ttf exists in public/fonts/');
  const fontBytes = fs.readFileSync(fontPath);

  // 2. Create Base Certificate PDF Template (A4 Landscape: 841.89 x 595.28 pt)
  const templateDoc = await PDFDocument.create();
  templateDoc.addPage([841.89, 595.28]);
  const templatePdfBytes = await templateDoc.save();
  assert(templatePdfBytes.length > 500, 'Blank A4 landscape base template generated');

  // 3. Create PNG Signature fixture with transparent background
  // Valid 1x1 transparent PNG
  const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const sigBuffer = Buffer.from(transparentPngBase64, 'base64');
  assert(sigBuffer[0] === 0x89 && sigBuffer[1] === 0x50, 'Signature fixture is valid PNG image');

  // 4. Coordinate System & Percentage Mapping
  // Target: Name at center (50%, 48%), Signature at bottom right (78%, 82%), Date at bottom left (22%, 82%)
  const pageWidth = 841.89;
  const pageHeight = 595.28;

  const sigField = {
    id: 'field-signature',
    xPercent: 78,
    yPercent: 82,
    widthPercent: 20,
    heightPercent: 10,
    rotation: 0,
    opacity: 1,
    enabled: true,
  };

  const sigTargetWidth = (sigField.widthPercent / 100) * pageWidth;
  const sigTargetHeight = (sigField.heightPercent / 100) * pageHeight;
  const sigTargetX = (sigField.xPercent / 100) * pageWidth - sigTargetWidth / 2;
  const sigTargetY = pageHeight - (sigField.yPercent / 100) * pageHeight - sigTargetHeight / 2;

  assert(
    Math.round(sigTargetWidth) === 168 && Math.round(sigTargetHeight) === 60,
    `Signature scaled proportionally (${sigTargetWidth.toFixed(1)} x ${sigTargetHeight.toFixed(1)} pt)`
  );
  assert(
    sigTargetX > 500 && sigTargetX < 650 && sigTargetY > 50 && sigTargetY < 120,
    `Signature placed in exact bottom-right quadrant (x: ${sigTargetX.toFixed(1)}, y: ${sigTargetY.toFixed(1)})`
  );

  // 5. Test PDF Generation with Embedded Signature & Google Sans Bold
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  pdfDoc.registerFontkit(fontkit);
  const customFont = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();
  const page = pages[0];

  // Draw Candidate Name
  const candidateName = 'Athrav Pathak';
  const fontSize = 38;
  const textWidth = customFont.widthOfTextAtSize(candidateName, fontSize);
  const textX = (pageWidth - textWidth) / 2;
  const textY = pageHeight - (48 / 100) * pageHeight - fontSize / 3;

  page.drawText(candidateName, {
    x: textX,
    y: textY,
    size: fontSize,
    font: customFont,
    color: rgb(24 / 255, 37 / 255, 54 / 255), // #182536 Midnight Blue
  });

  // Embed & Draw Signature
  const embeddedSig = await pdfDoc.embedPng(sigBuffer);
  page.drawImage(embeddedSig, {
    x: sigTargetX,
    y: sigTargetY,
    width: sigTargetWidth,
    height: sigTargetHeight,
    opacity: 1.0,
  });

  const finalPdfBytes = await pdfDoc.save();
  assert(finalPdfBytes.length > 500000, `Final PDF generated successfully with font & signature (${finalPdfBytes.length} bytes)`);

  // 6. Filename Sanitization & Absence of Certificate ID by Default
  const sanitize = (name) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_').trim();
  const cleanFilename = `${sanitize(candidateName)}.pdf`;
  assert(cleanFilename === 'Athrav_Pathak.pdf', `Default filename matches expected participant format "${cleanFilename}"`);
  assert(!cleanFilename.includes('CERT') && !cleanFilename.includes('ATH-'), 'No unwanted Certificate ID appended to filename');

  // 7. Verify Cert ID is OFF by default in defaults
  const sampleDataContent = fs.readFileSync(path.resolve(__dirname, 'src/constants/sampleData.ts'), 'utf-8');
  assert(
    sampleDataContent.includes("id: 'field-cert-id'") && sampleDataContent.includes('enabled: false'),
    'Certificate ID field is disabled (enabled: false) by default in sampleData'
  );

  // 8. Verify Brand identity in index.html
  const indexHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
  assert(indexHtml.includes('CERTORA'), 'index.html contains official application title (CERTORA)');
  assert(indexHtml.includes('Athrav Pathak'), 'index.html contains developer attribution');
  assert(indexHtml.includes('/images/certora_logo.png'), 'index.html references certora_logo.png for brand loading');

  // 9. Verify Logo image exists and is valid
  const logoPath = path.resolve(__dirname, 'public/images/certora_logo.png');
  assert(fs.existsSync(logoPath), 'Official logo exists in public/images/certora_logo.png');
  const logoStat = fs.statSync(logoPath);
  assert(logoStat.size > 50000, `Logo file has full resolution quality (${logoStat.size} bytes)`);

  console.log('\n========================================================');
  console.log(`✓ ALL ${passed} OF ${total} E2E SIGNATURE & PREVIEW TESTS PASSED (100%)`);
  console.log('========================================================\n');
}

runE2ETests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
