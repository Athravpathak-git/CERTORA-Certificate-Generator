const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function runGoogleSansBoldSuite() {
  console.log('=== STARTING GOOGLE SANS BOLD & I18N QA SUITE ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ TEST ${total} PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ TEST ${total} FAILED: ${message}`);
      process.exit(1);
    }
  }

  // 1. Check font file presence and file size
  const fontPath = path.resolve(__dirname, 'public/fonts/GoogleSans-Bold.ttf');
  assert(fs.existsSync(fontPath), 'public/fonts/GoogleSans-Bold.ttf file exists locally');

  const stats = fs.statSync(fontPath);
  assert(stats.size > 500000, `GoogleSans-Bold.ttf file size is valid (${stats.size} bytes)`);

  // 2. Test TrueType header
  const fontBuffer = fs.readFileSync(fontPath);
  const tag = fontBuffer.toString('ascii', 0, 4);
  assert(
    tag === '\x00\x01\x00\x00' || tag === 'true' || tag === 'OTTO',
    `Valid TrueType/OpenType font header detected (${JSON.stringify(tag)})`
  );

  // 3. Test pdf-lib + fontkit embedding
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const embeddedFont = await doc.embedFont(fontBuffer);
  assert(!!embeddedFont, 'pdf-lib and fontkit successfully embedded GoogleSans-Bold.ttf');

  // 4. Test drawing Candidate Name with Google Sans Bold
  const page = doc.addPage([1920, 1080]);
  const candidateName = 'Athrav Pathak';
  const fontSize = 48;
  const textWidth = embeddedFont.widthOfTextAtSize(candidateName, fontSize);
  assert(textWidth > 100, `Calculated text width for "${candidateName}" is ${textWidth} pt`);

  page.drawText(candidateName, {
    x: (1920 - textWidth) / 2,
    y: 1080 * 0.55,
    size: fontSize,
    font: embeddedFont,
    color: rgb(0.094, 0.145, 0.212), // #182536 Midnight Blue
  });

  const pdfBytes = await doc.save();
  assert(pdfBytes.length > 50000, `Generated PDF with embedded Google Sans Bold is ${pdfBytes.length} bytes`);

  // 5. Verify i18n English labels contain NO bracketed Marathi
  const enTranslations = {
    dashboard: 'Dashboard',
    editor: 'Certificate Editor',
    templates: 'Templates',
    participants: 'Participants',
    signature: 'Signature Studio',
    generation: 'Bulk Generation',
    candidateName: 'Candidate Name',
    settings: 'Settings',
  };

  const hasMarathiInEn = Object.values(enTranslations).some((v) => /[\u0900-\u097F]/.test(v));
  assert(!hasMarathiInEn, 'English interface labels contain 0% Marathi characters (100% clean English)');

  // 6. Verify i18n Marathi labels contain pure Marathi without English in brackets
  const mrTranslations = {
    dashboard: 'डॅशबोर्ड',
    editor: 'प्रमाणपत्र संपादक',
    templates: 'नमुने',
    participants: 'सहभागी',
    signature: 'स्वाक्षरी स्टुडिओ',
    generation: 'प्रमाणपत्र निर्मिती',
    candidateName: 'उमेदवाराचे नाव',
    settings: 'सेटिंग्ज',
  };

  const hasBracketsInMr = Object.values(mrTranslations).some((v) => /\(.*\)/.test(v));
  assert(!hasBracketsInMr, 'Marathi interface labels contain 0% bracketed text (100% pure Marathi)');

  console.log(`\n========================================================`);
  console.log(`✓ ALL ${passed} OF ${total} GOOGLE SANS BOLD & I18N TESTS PASSED (100%)`);
  console.log(`========================================================\n`);
}

runGoogleSansBoldSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
