import { CertIdSettings, Participant } from '../types';

export const DEFAULT_CERT_ID_SETTINGS: CertIdSettings = {
  enabled: true,
  prefix: 'CERT',
  year: '2026',
  startNumber: 1,
  paddingLength: 4,
  separator: '-',
};

/**
 * Formats a single certificate serial number according to settings
 */
export function formatCertificateId(
  seqNumber: number,
  settings: CertIdSettings = DEFAULT_CERT_ID_SETTINGS
): string {
  const pad = String(seqNumber).padStart(settings.paddingLength, '0');
  const parts: string[] = [];

  if (settings.prefix && settings.prefix.trim()) {
    parts.push(settings.prefix.trim().toUpperCase());
  }
  if (settings.year && settings.year.trim()) {
    parts.push(settings.year.trim());
  }
  parts.push(pad);

  return parts.join(settings.separator || '-');
}

export function generateCertId(
  settings: CertIdSettings = DEFAULT_CERT_ID_SETTINGS,
  index: number = 0
): string {
  return formatCertificateId(settings.startNumber + index, settings);
}

/**
 * Assigns or updates sequential unique certificate IDs for all participants
 * Preserves already-assigned IDs unless forceReassign is true
 */
export function assignCertificateIds(
  participants: Participant[],
  settings: CertIdSettings = DEFAULT_CERT_ID_SETTINGS,
  forceReassign: boolean = false
): Participant[] {
  const existingIds = new Set<string>();
  let currentNum = settings.startNumber;

  return participants.map((p, index) => {
    // If participant already has an ID and we're not force-reassigning, keep it
    if (!forceReassign && p.certId && !existingIds.has(p.certId)) {
      existingIds.add(p.certId);
      return p;
    }

    let candidateId = formatCertificateId(currentNum + index, settings);
    while (existingIds.has(candidateId)) {
      currentNum++;
      candidateId = formatCertificateId(currentNum + index, settings);
    }

    existingIds.add(candidateId);
    return {
      ...p,
      certId: candidateId,
    };
  });
}
