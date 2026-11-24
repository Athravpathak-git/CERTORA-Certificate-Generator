import QRCode from 'qrcode';
import jsQR from 'jsqr';

export interface GenerateQrOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a high-resolution QR code data URL client-side
 */
export async function generateQrCodeDataUrl(
  text: string,
  options: GenerateQrOptions = {}
): Promise<string> {
  const {
    width = 400,
    margin = 1,
    errorCorrectionLevel = 'M',
    color = { dark: '#000000', light: '#ffffff' },
  } = options;

  try {
    return await QRCode.toDataURL(text || 'CERT-VERIFY', {
      width,
      margin,
      errorCorrectionLevel,
      color,
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    // Fallback: minimal canvas QR
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 100;
    fallbackCanvas.height = 100;
    return fallbackCanvas.toDataURL('image/png');
  }
}

/**
 * Decodes a QR code from an Image element or Canvas
 */
export function decodeQrFromImage(
  imageElement: HTMLImageElement
): { data: string | null; error: string | null } {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { data: null, error: 'Could not create canvas context' };

    ctx.drawImage(imageElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      return { data: code.data, error: null };
    }
    return { data: null, error: 'No QR code found in the image. Please ensure the QR code is clearly visible and well-lit.' };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error decoding QR code' };
  }
}
