import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  CertificateField,
  CertificateTemplate,
  DetectedFontInfo,
  Participant,
  SignatureData,
} from '../types';
import { hasDevanagariText, matchFontFromPdfText } from '../constants/fonts';
import {
  removeSignatureBackground,
  DEFAULT_SIGNATURE_OPTIONS,
} from './signatureRemover';
import { generateQrCodeDataUrl } from './qrService';

// Setup PDF.js worker with reliable local public worker and CDN fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  } catch (err) {
    console.warn('PDF.js worker setup fallback:', err);
  }
}

let cachedGoogleSansBytes: Uint8Array | null = null;

/**
 * Loads the local GoogleSans-Bold.ttf file into memory for pdf-lib embedding
 * Supports both browser fetch (/fonts/GoogleSans-Bold.ttf) and Node.js fs.readFileSync
 */
export async function getGoogleSansFontBytes(): Promise<Uint8Array | null> {
  if (cachedGoogleSansBytes && cachedGoogleSansBytes.length > 0) {
    return cachedGoogleSansBytes;
  }

  // 1. Browser environment via fetch
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    try {
      const res = await fetch('/fonts/GoogleSans-Bold.ttf');
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        cachedGoogleSansBytes = new Uint8Array(buffer);
        return cachedGoogleSansBytes;
      }
    } catch (e) {
      console.warn('Could not fetch /fonts/GoogleSans-Bold.ttf via browser fetch:', e);
    }
  }

  // 2. Node.js environment (for automated tests or offline runners)
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      // Dynamic import to avoid browser bundler issues
      const fsModule = 'fs';
      const pathModule = 'path';
      const fs = await import(/* @vite-ignore */ fsModule);
      const path = await import(/* @vite-ignore */ pathModule);
      const fontPath = path.resolve(process.cwd(), 'public/fonts/GoogleSans-Bold.ttf');
      if (fs.existsSync(fontPath)) {
        const fileBuf = fs.readFileSync(fontPath);
        cachedGoogleSansBytes = new Uint8Array(fileBuf);
        return cachedGoogleSansBytes;
      }
    } catch (nodeErr) {
      console.warn('Could not read font in Node environment:', nodeErr);
    }
  }

  return null;
}

/**
 * Ensures Google Sans Bold is fully loaded in the browser document before rendering canvas preview
 */
export async function ensureGoogleSansLoaded(): Promise<boolean> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.load('bold 48px "Google Sans"');
      await document.fonts.load('bold 48px "Google Sans Bold"');
      return true;
    } catch (e) {
      console.warn('Google Sans font readiness check:', e);
    }
  }
  return false;
}

/**
 * Converts a Hex color (#RRGGBB) to pdf-lib RGB values (0..1)
 */
export function hexToPdfRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Reads a PDF array buffer and extracts metadata, detected fonts, and a high-resolution preview image
 */
export async function loadPdfTemplate(
  fileBuffer: ArrayBuffer,
  fileName: string,
  targetPageNum: number = 1
): Promise<CertificateTemplate> {
  const uint8 = new Uint8Array(fileBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;

  const validPageNum = Math.min(Math.max(1, targetPageNum), pageCount);
  const page = await pdfDoc.getPage(validPageNum);

  // Original viewport in PDF points
  const baseViewport = page.getViewport({ scale: 1.0 });
  const originalWidth = baseViewport.width;
  const originalHeight = baseViewport.height;

  // High-resolution viewport for canvas rendering (scale = 2.0 for sharp display)
  const scale = 2.0;
  const renderViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = renderViewport.width;
  canvas.height = renderViewport.height;
  const ctx = canvas.getContext('2d')!;

  const renderContext = {
    canvasContext: ctx,
    viewport: renderViewport,
  };

  await page.render(renderContext).promise;
  const previewImageUrl = canvas.toDataURL('image/png');

  // Text and Font inspection
  const detectedFonts: DetectedFontInfo[] = [];
  try {
    const textContent = await page.getTextContent();
    const seenFonts = new Set<string>();

    for (const item of textContent.items) {
      if ('str' in item && item.str.trim().length > 0) {
        const fontName = item.fontName || 'Unknown';
        const str = item.str.trim();

        if (!seenFonts.has(fontName)) {
          seenFonts.add(fontName);
          const { matchedFont } = matchFontFromPdfText(fontName);
          const fontSize = Math.round(Math.abs(item.transform[0]) || 20);

          detectedFonts.push({
            fontName,
            family: matchedFont.name,
            estimatedSize: fontSize,
            suggestedMatch: matchedFont.name,
            sampleText: str.length > 25 ? str.substring(0, 25) + '...' : str,
            isBold: fontName.toLowerCase().includes('bold'),
            isItalic:
              fontName.toLowerCase().includes('italic') ||
              fontName.toLowerCase().includes('oblique'),
          });
        }
      }
    }
  } catch (textErr) {
    console.warn('Text content inspection error:', textErr);
  }

  return {
    id: `pdf-tpl-${Date.now()}`,
    name: fileName,
    category: 'Participation',
    fileType: 'pdf',
    originalWidth,
    originalHeight,
    aspectRatio: originalWidth / originalHeight,
    pageCount,
    selectedPage: validPageNum,
    pdfBytes: uint8,
    previewImageUrl,
    detectedFonts,
  };
}

/**
 * Loads an image template (PNG/JPG/JPEG) and calculates dimensions
 */
export async function loadImageTemplate(
  file: File | string,
  fileName: string,
  category: string = 'Participation'
): Promise<CertificateTemplate> {
  return new Promise((resolve, reject) => {
    let dataUrl = '';
    const finalize = (imgSrc: string) => {
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.naturalWidth || 1920;
        const originalHeight = img.naturalHeight || 1080;
        resolve({
          id: `img-tpl-${Date.now()}`,
          name: fileName,
          category,
          fileType: 'image',
          originalWidth,
          originalHeight,
          aspectRatio: originalWidth / originalHeight,
          pageCount: 1,
          selectedPage: 1,
          previewImageUrl: imgSrc,
          detectedFonts: [],
        });
      };
      img.onerror = (err) => reject(new Error('Failed to load certificate image: ' + err));
      img.src = imgSrc;
    };

    if (typeof file === 'string') {
      finalize(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        dataUrl = e.target?.result as string;
        finalize(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Loads signature image and automatically removes background
 */
export async function loadSignatureFile(file: File): Promise<SignatureData> {
  const result = await removeSignatureBackground(file);
  return {
    id: `sig-${Date.now()}`,
    name: file.name,
    dataUrl: result.transparentDataUrl,
    originalDataUrl: result.originalDataUrl,
    format: 'png',
    width: result.width,
    height: result.height,
    aspectRatio: result.aspectRatio,
    isBackgroundRemoved: true,
    detectedPaperColor: result.detectedPaperColor,
    settings: {
      threshold: DEFAULT_SIGNATURE_OPTIONS.threshold,
      smoothness: DEFAULT_SIGNATURE_OPTIONS.smoothness,
      contrastBoost: DEFAULT_SIGNATURE_OPTIONS.contrastBoost,
      removeHalo: DEFAULT_SIGNATURE_OPTIONS.removeHalo,
    },
  };
}

/**
 * Normalizes field key for fuzzy case-insensitive matching across spreadsheets & placeholders
 */
export function normalizeKey(key: string): string {
  return (key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Universal dynamic placeholder resolver for certificate fields and text templates.
 * Supports:
 * - Direct participant properties (name, certId)
 * - Mapped spreadsheet columns (participant.fields) with fuzzy key matching
 * - {{placeholder}} substitutions in static strings (e.g. {{participant_name}}, {{event_name}}, {{duration}})
 * - Standard certificate dates & sequential IDs
 */
export function getFieldValue(
  field: CertificateField,
  participant: Participant | null | undefined,
  dateText: string = ''
): string {
  if (field.type === 'signature' || field.type === 'qr_code') {
    return '';
  }

  // 1. Candidate / Participant Name
  if (field.type === 'candidate_name') {
    if (participant) {
      if (participant.name && participant.name.trim()) return participant.name.trim();
      // Fallback search in fields
      if (participant.fields) {
        for (const [k, v] of Object.entries(participant.fields)) {
          const norm = normalizeKey(k);
          if (norm.includes('name') || norm.includes('candidate') || norm.includes('student') || norm.includes('participant') || norm === 'नाव') {
            if (v && v.trim()) return v.trim();
          }
        }
      }
    }
    return field.staticValue || '';
  }

  // 2. Certificate ID
  if (field.type === 'cert_id') {
    if (participant?.certId && participant.certId.trim()) {
      return participant.certId.trim();
    }
    if (participant?.fields) {
      for (const [k, v] of Object.entries(participant.fields)) {
        const norm = normalizeKey(k);
        if (norm.includes('certid') || norm.includes('certificateid') || norm.includes('id') || norm.includes('credential')) {
          if (v && v.trim()) return v.trim();
        }
      }
    }
    return field.staticValue || 'CERT-2026-0001';
  }

  // 3. Date
  if (field.type === 'date') {
    if (dateText && dateText.trim()) return dateText.trim();
    if (participant?.fields?.date) return participant.fields.date;
    return field.staticValue || '';
  }

  // 4. Participant Dynamic Field Search
  let matchedValue: string | null = null;
  if (participant?.fields) {
    // Exact key lookup first
    if (participant.fields[field.fieldKey] !== undefined && participant.fields[field.fieldKey] !== '') {
      matchedValue = participant.fields[field.fieldKey];
    } else {
      // Fuzzy normalized lookup
      const targetNorm = normalizeKey(field.fieldKey);
      const labelNorm = normalizeKey(field.label);
      const placeholderNorm = field.placeholder ? normalizeKey(field.placeholder.replace(/[{}]/g, '')) : '';

      for (const [k, v] of Object.entries(participant.fields)) {
        const currentNorm = normalizeKey(k);
        if (
          currentNorm === targetNorm ||
          (labelNorm && currentNorm === labelNorm) ||
          (placeholderNorm && currentNorm === placeholderNorm)
        ) {
          matchedValue = v;
          break;
        }
      }
    }
  }

  // If a dynamic value is matched from participant record, return it
  if (matchedValue !== null && matchedValue.trim() !== '') {
    return matchedValue.trim();
  }

  // 5. Template Placeholder Replacements in static value (e.g. "For attending {{event_name}} on {{date}}")
  let result = field.staticValue || '';
  if (result.includes('{{') && participant) {
    result = result.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, token) => {
      const normToken = normalizeKey(token);

      if (normToken === 'participantname' || normToken === 'candidatename' || normToken === 'name' || normToken === 'studentname') {
        return participant.name || '';
      }
      if (normToken === 'date' || normToken === 'issuedate') {
        return dateText || '';
      }
      if (normToken === 'certificateid' || normToken === 'certid') {
        return participant.certId || '';
      }

      // Check fields for token
      if (participant.fields) {
        if (participant.fields[token] !== undefined) return participant.fields[token];
        for (const [k, v] of Object.entries(participant.fields)) {
          if (normalizeKey(k) === normToken) return v;
        }
      }
      return '';
    });
  }

  return result;
}

// Alias for universal usage
export const resolveFieldText = getFieldValue;

/**
 * Resolves standard PDF font
 */
function resolveStandardFont(
  fontFamily: string,
  fontWeight: string,
  fontStyle: string
): StandardFonts {
  const isBold = fontWeight === 'bold' || fontWeight === '800' || fontWeight === '600';
  const isItalic = fontStyle === 'italic';

  const lower = (fontFamily || '').toLowerCase();
  const isSerif =
    lower.includes('playfair') ||
    lower.includes('cinzel') ||
    lower.includes('merriweather') ||
    lower.includes('times') ||
    lower.includes('serif');

  const isScript =
    lower.includes('script') ||
    lower.includes('vibes') ||
    lower.includes('brush');

  if (isScript) {
    return isBold ? StandardFonts.TimesRomanBoldItalic : StandardFonts.TimesRomanItalic;
  }

  if (isSerif) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

/**
 * Converts a data URL to Uint8Array
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Renders Devanagari (Marathi/Hindi) or complex Unicode text to a crisp high-res image
 * Ensures 100% authentic conjuncts, half-letters, and matras without missing glyphs
 */
function renderDevanagariToHighResImage(
  text: string,
  fontFamily: string,
  fontSizePt: number,
  fontWeight: string,
  fontStyle: string,
  color: string,
  align: 'left' | 'center' | 'right'
): { dataUrl: string; widthPt: number; heightPt: number } {
  const scale = 3.5; // 3.5x for razor-sharp vector-like rendering
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const styleStr = fontStyle === 'italic' ? 'italic ' : '';
  const weightStr =
    fontWeight === 'bold' || fontWeight === '800' || fontWeight === '600' ? 'bold ' : '';
  const familyStr = `"${fontFamily}", "Noto Sans Devanagari", "Mukta", sans-serif`;

  const pixelSize = Math.round(fontSizePt * scale);
  ctx.font = `${styleStr}${weightStr}${pixelSize}px ${familyStr}`;

  const metrics = ctx.measureText(text);
  const textW = Math.ceil(metrics.width);
  const textH = Math.ceil(pixelSize * 1.35);

  canvas.width = Math.max(10, textW + 30);
  canvas.height = Math.max(10, textH + 20);

  ctx.font = `${styleStr}${weightStr}${pixelSize}px ${familyStr}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    widthPt: canvas.width / scale,
    heightPt: canvas.height / scale,
  };
}

/**
 * Core PDF Generation Engine for a single participant
 */
export async function generateParticipantPdf(
  template: CertificateTemplate,
  signature: SignatureData | null,
  fields: CertificateField[],
  participant: Participant,
  dateText: string
): Promise<Blob> {
  const pdfDoc = await buildPdfDocumentForParticipant(
    template,
    signature,
    fields,
    participant,
    dateText
  );

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

/**
 * Builds a PDFDocument instance for a participant
 */
export async function buildPdfDocumentForParticipant(
  template: CertificateTemplate,
  signature: SignatureData | null,
  fields: CertificateField[],
  participant: Participant,
  dateText: string,
  existingDoc?: PDFDocument
): Promise<PDFDocument> {
  let pdfDoc: PDFDocument;

  if (existingDoc) {
    pdfDoc = existingDoc;
  } else if (template.fileType === 'pdf' && template.pdfBytes) {
    pdfDoc = await PDFDocument.load(template.pdfBytes);
  } else {
    pdfDoc = await PDFDocument.create();
  }

  pdfDoc.registerFontkit(fontkit);

  let page: any;
  if (!existingDoc && template.fileType === 'pdf' && template.pdfBytes) {
    const pageIndex = Math.min(Math.max(0, template.selectedPage - 1), pdfDoc.getPageCount() - 1);
    page = pdfDoc.getPage(pageIndex);
  } else {
    // Add new page
    page = pdfDoc.addPage([template.originalWidth, template.originalHeight]);

    // Embed background image
    const bgBytes = dataUrlToUint8Array(template.previewImageUrl);
    let bgImage;
    if (
      template.previewImageUrl.startsWith('data:image/jpeg') ||
      template.previewImageUrl.startsWith('data:image/jpg')
    ) {
      bgImage = await pdfDoc.embedJpg(bgBytes);
    } else {
      bgImage = await pdfDoc.embedPng(bgBytes);
    }

    page.drawImage(bgImage, {
      x: 0,
      y: 0,
      width: template.originalWidth,
      height: template.originalHeight,
    });
  }

  const { width: pageWidth, height: pageHeight } = page.getSize();
  const scaleX = pageWidth / template.originalWidth;
  const scaleY = pageHeight / template.originalHeight;

  // Embedded Signatures Cache (supports multiple distinct authority signatures)
  const embeddedSignatureCache = new Map<string, any>();

  const getOrEmbedSignature = async (sig: SignatureData) => {
    if (!sig || !sig.dataUrl) return null;
    if (embeddedSignatureCache.has(sig.dataUrl)) {
      return embeddedSignatureCache.get(sig.dataUrl);
    }
    try {
      const sigBytes = dataUrlToUint8Array(sig.dataUrl);
      const isPng =
        sig.dataUrl.startsWith('data:image/png') ||
        (sigBytes.length >= 4 &&
          sigBytes[0] === 0x89 &&
          sigBytes[1] === 0x50 &&
          sigBytes[2] === 0x4e &&
          sigBytes[3] === 0x47);

      let embeddedImg: any;
      if (isPng) {
        embeddedImg = await pdfDoc.embedPng(sigBytes);
      } else {
        try {
          embeddedImg = await pdfDoc.embedJpg(sigBytes);
        } catch {
          embeddedImg = await pdfDoc.embedPng(sigBytes);
        }
      }
      embeddedSignatureCache.set(sig.dataUrl, embeddedImg);
      return embeddedImg;
    } catch (sigErr) {
      console.warn('Could not embed signature in PDF:', sigErr);
      return null;
    }
  };

  // Pre-cache default signature if provided
  if (signature && signature.dataUrl) {
    await getOrEmbedSignature(signature);
  }

  let hasDrawnSignature = false;

  // Draw fields
  for (const field of fields) {
    if (!field.enabled) continue;

    const fieldX = (field.xPercent / 100) * pageWidth;
    const fieldTop = (field.yPercent / 100) * pageHeight;
    const fieldWidth = (field.widthPercent / 100) * pageWidth;
    const fieldHeight = (field.heightPercent / 100) * pageHeight;

    // 1. Signature Field (Supports multiple distinct authority signatures)
    if (field.type === 'signature') {
      const sigObj = field.signatureData || (field.id === 'field-signature' || !field.signatureData ? signature : null);
      if (sigObj && sigObj.dataUrl) {
        const embeddedSignature = await getOrEmbedSignature(sigObj);
        if (embeddedSignature) {
          const sigAspect = sigObj.aspectRatio || 2.5;
          let drawW = fieldWidth;
          let drawH = fieldWidth / sigAspect;

          if (drawH > fieldHeight) {
            drawH = fieldHeight;
            drawW = fieldHeight * sigAspect;
          }

          const drawX = fieldX + (fieldWidth - drawW) / 2;
          const drawY = pageHeight - fieldTop - fieldHeight + (fieldHeight - drawH) / 2;

          page.drawImage(embeddedSignature, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
            opacity: 1,
            rotate: field.rotation ? degrees(field.rotation) : undefined,
          });
          hasDrawnSignature = true;
        }
      }
      continue;
    }

    // 2. QR Code Field
    if (field.type === 'qr_code') {
      try {
        const qrPayload =
          participant.certId ||
          field.qrSettings?.customPayload ||
          `VERIFIED:${participant.name}:${participant.certId || 'CERT-0001'}`;

        const qrDataUrl = await generateQrCodeDataUrl(qrPayload, {
          width: 300,
          errorCorrectionLevel: field.qrSettings?.errorCorrectionLevel || 'M',
        });

        const qrBytes = dataUrlToUint8Array(qrDataUrl);
        const qrImage = await pdfDoc.embedPng(qrBytes);

        // Keep square aspect ratio within bounding box
        const side = Math.min(fieldWidth, fieldHeight);
        const drawX = fieldX + (fieldWidth - side) / 2;
        const drawY = pageHeight - fieldTop - fieldHeight + (fieldHeight - side) / 2;

        page.drawImage(qrImage, {
          x: drawX,
          y: drawY,
          width: side,
          height: side,
        });
      } catch (qrErr) {
        console.warn('Could not embed QR code in PDF:', qrErr);
      }
      continue;
    }

    // 3. Text Fields (Name, Date, Cert ID, Performance, Rank, Score, Achievement, etc.)
    let rawText = getFieldValue(field, participant, dateText);
    if (!rawText) continue;

    if (field.transform === 'uppercase') {
      rawText = rawText.toUpperCase();
    } else if (field.transform === 'capitalize') {
      rawText = rawText
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    let currentFontSize = field.fontSize * ((scaleX + scaleY) / 2);

    // Devanagari / Marathi handling
    if (hasDevanagariText(rawText)) {
      const renderedImg = renderDevanagariToHighResImage(
        rawText,
        field.fontFamily,
        currentFontSize,
        field.fontWeight,
        field.fontStyle,
        field.color,
        field.align
      );

      let drawW = renderedImg.widthPt;
      let drawH = renderedImg.heightPt;

      if (field.autoFit === true && drawW > fieldWidth && fieldWidth > 10) {
        const shrink = (fieldWidth / drawW) * 0.95;
        drawW *= shrink;
        drawH *= shrink;
      }

      let drawX = fieldX;
      if (field.align === 'center') {
        drawX = fieldX + (fieldWidth - drawW) / 2;
      } else if (field.align === 'right') {
        drawX = fieldX + (fieldWidth - drawW);
      }

      const drawY = pageHeight - fieldTop - fieldHeight / 2 - drawH / 2;

      try {
        const devBytes = dataUrlToUint8Array(renderedImg.dataUrl);
        const embeddedImg = await pdfDoc.embedPng(devBytes);
        page.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      } catch (devErr) {
        console.warn('Error embedding Devanagari image:', devErr);
      }
      continue;
    }

    // Font resolution & embedding
    let pdfFont: any = null;
    const fontLower = (field.fontFamily || '').toLowerCase();
    const isGoogleSans = fontLower.includes('google sans');

    if (isGoogleSans) {
      const googleSansBytes = await getGoogleSansFontBytes();
      if (googleSansBytes) {
        try {
          pdfFont = await pdfDoc.embedFont(googleSansBytes);
        } catch (embedErr) {
          console.warn('Could not embed Google Sans Bold font in PDF, falling back to Helvetica-Bold:', embedErr);
        }
      } else {
        console.warn('Google Sans font file bytes unavailable, using Helvetica-Bold fallback');
      }
    }

    if (!pdfFont) {
      const fontType = resolveStandardFont(field.fontFamily, field.fontWeight, field.fontStyle);
      pdfFont = await pdfDoc.embedFont(fontType);
    }

    let textWidth = pdfFont.widthOfTextAtSize(rawText, currentFontSize);
    if (field.autoFit === true && textWidth > fieldWidth && fieldWidth > 10) {
      const shrinkFactor = (fieldWidth / textWidth) * 0.95;
      currentFontSize = Math.max(8, currentFontSize * shrinkFactor);
      textWidth = pdfFont.widthOfTextAtSize(rawText, currentFontSize);
    }

    let drawX = fieldX;
    if (field.align === 'center') {
      drawX = fieldX + (fieldWidth - textWidth) / 2;
    } else if (field.align === 'right') {
      drawX = fieldX + (fieldWidth - textWidth);
    }

    const textHeight = currentFontSize * 0.75;
    const drawY = pageHeight - fieldTop - fieldHeight / 2 - textHeight / 3;
    const textColor = hexToPdfRgb(field.color);

    page.drawText(rawText, {
      x: drawX,
      y: drawY,
      size: currentFontSize,
      font: pdfFont,
      color: textColor,
    });
  }

  // Fallback: If signature was provided but no enabled signature field was in fields, draw it at default position
  if (signature && !hasDrawnSignature) {
    const embeddedFallback = await getOrEmbedSignature(signature);
    if (embeddedFallback) {
      const sigField = fields.find((f) => f.type === 'signature');
      const xPct = sigField ? sigField.xPercent : 68;
      const yPct = sigField ? sigField.yPercent : 74;
      const wPct = sigField ? sigField.widthPercent : 20;
      const hPct = sigField ? sigField.heightPercent : 10;

      const fieldX = (xPct / 100) * pageWidth;
      const fieldTop = (yPct / 100) * pageHeight;
      const fieldWidth = (wPct / 100) * pageWidth;
      const fieldHeight = (hPct / 100) * pageHeight;

      const sigAspect = signature?.aspectRatio || 2.5;
      let drawW = fieldWidth;
      let drawH = fieldWidth / sigAspect;
      if (drawH > fieldHeight) {
        drawH = fieldHeight;
        drawW = fieldHeight * sigAspect;
      }
      const drawX = fieldX + (fieldWidth - drawW) / 2;
      const drawY = pageHeight - fieldTop - fieldHeight + (fieldHeight - drawH) / 2;

      page.drawImage(embeddedFallback, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
        opacity: 1,
      });
    }
  }

  return pdfDoc;
}

/**
 * Generates a single combined multi-page PDF containing all participant certificates
 */
export async function generateCombinedPdf(
  template: CertificateTemplate,
  signature: SignatureData | null,
  fields: CertificateField[],
  participants: Participant[],
  dateText: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Blob> {
  const masterDoc = await PDFDocument.create();

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    await buildPdfDocumentForParticipant(
      template,
      signature,
      fields,
      p,
      dateText,
      masterDoc
    );

    if (onProgress) {
      onProgress(i + 1, participants.length);
    }
    // Yield to browser
    await new Promise((r) => setTimeout(r, 10));
  }

  const pdfBytes = await masterDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}
