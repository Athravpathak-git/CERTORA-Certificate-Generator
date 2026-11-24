import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Participant, VerificationManifest } from '../types';
import { exportManifestCsv, exportManifestJson } from './verificationService';

/**
 * Creates a ZIP file containing all generated certificates and verification manifest
 */
export async function downloadCertificatesAsZip(
  participants: Participant[],
  zipFilename: string = 'All_Certificates.zip',
  manifest?: VerificationManifest,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<void> {
  const readyParticipants = participants.filter((p) => p.pdfBlob);

  if (readyParticipants.length === 0) {
    throw new Error('No generated certificates available to download.');
  }

  const zip = new JSZip();
  const folder = zip.folder('Certificates') || zip;

  for (let i = 0; i < readyParticipants.length; i++) {
    const p = readyParticipants[i];
    if (p.pdfBlob) {
      folder.file(p.generatedFilename, p.pdfBlob);
    }
  }

  // Include verification manifest inside ZIP if provided
  if (manifest) {
    const jsonBlob = exportManifestJson(manifest);
    const csvBlob = exportManifestCsv(manifest);
    zip.file('verification_manifest.json', jsonBlob);
    zip.file('verification_manifest.csv', csvBlob);
  }

  // Generate ZIP with progress callback
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent), metadata.currentFile || 'Packing...');
      }
    }
  );

  saveAs(zipBlob, zipFilename);
}

/**
 * Downloads a single participant PDF
 */
export function downloadSingleCertificate(participant: Participant): void {
  if (!participant.pdfBlob) {
    throw new Error('Certificate has not been generated yet.');
  }
  saveAs(participant.pdfBlob, participant.generatedFilename);
}

/**
 * Downloads a combined multi-page PDF
 */
export function downloadCombinedCertificatePdf(
  pdfBlob: Blob,
  filename: string = 'All_Certificates_Combined.pdf'
): void {
  saveAs(pdfBlob, filename);
}
