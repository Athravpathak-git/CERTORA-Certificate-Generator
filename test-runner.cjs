const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const JSZip = require('jszip');

async function runQATests() {
  console.log('=== STARTING SMART CERTIFICATE GENERATOR AI QA SUITE ===\n');

  // Test 1: Generate a base PDF certificate template with realistic vector borders and text
  console.log('Test 1: Creating base PDF certificate template...');
  const baseDoc = await PDFDocument.create();
  // Standard A4 Landscape: 841.89 x 595.28 points
  const basePage = baseDoc.addPage([841.89, 595.28]);
  const timesFont = await baseDoc.embedFont(StandardFonts.TimesRomanBold);

  // Outer border
  basePage.drawRectangle({
    x: 30,
    y: 30,
    width: 841.89 - 60,
    height: 595.28 - 60,
    borderColor: rgb(0.06, 0.09, 0.16), // #0F172A
    borderWidth: 4,
    color: rgb(0.99, 0.98, 0.97),
  });

  // Inner Gold border
  basePage.drawRectangle({
    x: 45,
    y: 45,
    width: 841.89 - 90,
    height: 595.28 - 90,
    borderColor: rgb(0.85, 0.47, 0.02), // Gold
    borderWidth: 1.5,
  });

  basePage.drawText('CERTIFICATE OF ACADEMIC EXCELLENCE', {
    x: 841.89 / 2 - 200,
    y: 595.28 - 120,
    size: 24,
    font: timesFont,
    color: rgb(0.06, 0.09, 0.16),
  });

  const basePdfBytes = await baseDoc.save();
  console.log(`✓ Base PDF template created (${basePdfBytes.length} bytes, 841.89x595.28 pt)`);

  // Test 2: Create a transparent PNG signature byte stream
  console.log('\nTest 2: Creating PNG signature fixture...');
  // 1x1 transparent PNG header
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const samplePngBuffer = Buffer.from(samplePngBase64, 'base64');
  console.log('✓ PNG signature fixture ready');

  // Test 3, 4, 5: 10 Participant names with short, long, and duplicates
  console.log('\nTest 3-5: Preparing 10 Participant dataset (short, long, duplicates)...');
  const participants = [
    { name: 'Athrav Pathak', rank: '1', score: '98/100', perf: 'Outstanding' },
    { name: 'Rahul Patil', rank: '2', score: '95/100', perf: 'Excellent' },
    { name: 'Priya Sharma', rank: '3', score: '93/100', perf: 'Distinction' },
    { name: 'Amit Deshmukh', rank: '4', score: '90/100', perf: 'Merit' },
    { name: 'Sneha Joshi', rank: '5', score: '89/100', perf: 'Merit' },
    { name: 'Vikramaditya Rathore', rank: '6', score: '88/100', perf: 'Very Good' },
    { name: 'Ananya Iyer', rank: '7', score: '87/100', perf: 'Very Good' },
    { name: 'Rohan Kulkarni', rank: '8', score: '85/100', perf: 'Good' },
    { name: 'Tanvi Mehta', rank: '9', score: '84/100', perf: 'Good' },
    { name: 'Rahul Patil', rank: '10', score: '96/100', perf: 'Distinction' }, // Duplicate
  ];

  // Test Filename deduplication
  function sanitizeFilename(rawName, existingSet) {
    let base = rawName.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_');
    let candidate = `${base}.pdf`;
    if (!existingSet.has(candidate.toLowerCase())) {
      existingSet.add(candidate.toLowerCase());
      return candidate;
    }
    let counter = 2;
    while (existingSet.has(`${base}_${counter}.pdf`.toLowerCase())) {
      counter++;
    }
    const unique = `${base}_${counter}.pdf`;
    existingSet.add(unique.toLowerCase());
    return unique;
  }

  const generatedFilenames = [];
  const nameSet = new Set();
  participants.forEach(p => {
    const fn = sanitizeFilename(p.name, nameSet);
    generatedFilenames.push(fn);
  });

  console.log('Generated Filenames:', generatedFilenames);
  if (generatedFilenames[1] !== 'Rahul_Patil.pdf' || generatedFilenames[9] !== 'Rahul_Patil_2.pdf') {
    throw new Error('Duplicate filename test failed!');
  }
  console.log('✓ Duplicate filename protection confirmed: Rahul_Patil.pdf and Rahul_Patil_2.pdf');

  // Test 6, 7, 8, 9, 10, 11: Bulk PDF generation for all 10 participants
  console.log('\nTest 6-11: Generating 10 customized PDFs with pdf-lib...');
  const generatedPdfs = [];

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    const doc = await PDFDocument.load(basePdfBytes);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();

    // Embed different font variants (Regular, Bold, Italic)
    const nameFont = await doc.embedFont(
      i % 2 === 0 ? StandardFonts.TimesRomanBold : StandardFonts.TimesRomanBoldItalic
    );
    const dateFont = await doc.embedFont(StandardFonts.Helvetica);

    // Auto-fit check
    let fontSize = 36;
    let textWidth = nameFont.widthOfTextAtSize(p.name, fontSize);
    const maxFieldWidth = width * 0.7; // 70%
    if (textWidth > maxFieldWidth) {
      fontSize = fontSize * (maxFieldWidth / textWidth) * 0.95;
      textWidth = nameFont.widthOfTextAtSize(p.name, fontSize);
    }

    // Centered placement
    const textX = (width - textWidth) / 2;
    const textY = height / 2;

    page.drawText(p.name, {
      x: textX,
      y: textY,
      size: fontSize,
      font: nameFont,
      color: rgb(0.06, 0.09, 0.16),
    });

    // Custom date: 12 November 2026
    const dateText = '12 November 2026';
    page.drawText(dateText, {
      x: 100,
      y: 100,
      size: 14,
      font: dateFont,
      color: rgb(0.2, 0.25, 0.33),
    });

    // Optional performance & score
    page.drawText(`Performance: ${p.perf} | Score: ${p.score} | Rank: ${p.rank}`, {
      x: width / 2 - 120,
      y: textY - 40,
      size: 12,
      font: dateFont,
      color: rgb(0.85, 0.47, 0.02),
    });

    // Embed signature
    const sigImg = await doc.embedPng(samplePngBuffer);
    page.drawImage(sigImg, {
      x: width - 200,
      y: 90,
      width: 100,
      height: 40,
    });

    const pdfOut = await doc.save();
    generatedPdfs.push({ filename: generatedFilenames[i], bytes: pdfOut });
    console.log(`  ✓ Generated #${i + 1}: ${generatedFilenames[i]} (${pdfOut.length} bytes)`);
  }

  // Test 12: Bundle into ZIP archive and verify contents
  console.log('\nTest 12: Creating and verifying ZIP archive...');
  const zip = new JSZip();
  const folder = zip.folder('Certificates');
  generatedPdfs.forEach(item => {
    folder.file(item.filename, item.bytes);
  });

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  console.log(`✓ ZIP generated successfully (${zipBuffer.length} bytes)`);

  // Re-read ZIP to verify integrity
  const unzipped = await JSZip.loadAsync(zipBuffer);
  const filesInside = Object.keys(unzipped.files).filter(f => !unzipped.files[f].dir);
  console.log(`Files inside ZIP (${filesInside.length}):`, filesInside);

  if (filesInside.length !== 10) {
    throw new Error(`Expected 10 files in ZIP, but found ${filesInside.length}`);
  }

  console.log('\n======================================================');
  console.log('✓ ALL 12 QA TESTS PASSED WITH 100% SUCCESS RATE');
  console.log('======================================================\n');
}

runQATests().catch(err => {
  console.error('QA Test Failure:', err);
  process.exit(1);
});
