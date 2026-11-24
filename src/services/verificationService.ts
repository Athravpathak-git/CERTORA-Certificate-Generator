import { Participant, VerificationManifest, VerificationRecord } from '../types';

/**
 * Builds a verification manifest from participants list and event details
 */
export function buildVerificationManifest(
  participants: Participant[],
  projectName: string = 'Smart Certificate Batch',
  eventName: string = 'Official Certification',
  issueDate: string = new Date().toISOString().split('T')[0]
): VerificationManifest {
  const records: VerificationRecord[] = participants.map((p) => ({
    certId: p.certId || 'N/A',
    participantName: p.name,
    issueDate: p.fields?.date || issueDate,
    eventName: p.fields?.eventName || eventName,
    achievement: p.fields?.achievement || '',
    rank: p.fields?.rank || '',
    score: p.fields?.score || '',
    category: p.fields?.category || '',
    verifiedAt: new Date().toISOString(),
    status: 'valid',
  }));

  return {
    projectName,
    generatedAt: new Date().toISOString(),
    totalCertificates: records.length,
    records,
  };
}

/**
 * Exports verification manifest as JSON Blob
 */
export function exportManifestJson(manifest: VerificationManifest): Blob {
  return new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json',
  });
}

/**
 * Exports verification manifest as CSV Blob
 */
export function exportManifestCsv(manifest: VerificationManifest): Blob {
  const headers = [
    'Certificate ID',
    'Participant Name',
    'Issue Date',
    'Event Name',
    'Achievement',
    'Rank',
    'Score',
    'Status',
  ];

  const rows = manifest.records.map((r) => [
    `"${r.certId}"`,
    `"${r.participantName.replace(/"/g, '""')}"`,
    `"${r.issueDate}"`,
    `"${r.eventName.replace(/"/g, '""')}"`,
    `"${(r.achievement || '').replace(/"/g, '""')}"`,
    `"${(r.rank || '').replace(/"/g, '""')}"`,
    `"${(r.score || '').replace(/"/g, '""')}"`,
    `"${r.status.toUpperCase()}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Verifies a certificate ID against a list of records or participants
 */
export function verifyCertificateLocally(
  certIdToFind: string,
  manifestOrParticipants: VerificationManifest | Participant[],
  defaultEventName: string = 'Verified Certification',
  defaultDate: string = '15 November 2026'
): VerificationRecord {
  const cleanId = (certIdToFind || '').trim().toUpperCase();

  if (!cleanId) {
    return {
      certId: '',
      participantName: '',
      issueDate: '',
      eventName: '',
      verifiedAt: new Date().toISOString(),
      status: 'invalid',
    };
  }

  // Check if argument is a manifest
  if ('records' in manifestOrParticipants && Array.isArray(manifestOrParticipants.records)) {
    const match = manifestOrParticipants.records.find(
      (r) => r.certId.trim().toUpperCase() === cleanId
    );
    if (match) {
      return {
        ...match,
        status: 'valid',
        verifiedAt: new Date().toISOString(),
      };
    }
  } else {
    // Array of participants
    const participants = manifestOrParticipants as Participant[];
    const match = participants.find(
      (p) => (p.certId || '').trim().toUpperCase() === cleanId
    );

    if (match) {
      return {
        certId: match.certId || cleanId,
        participantName: match.name,
        issueDate: match.fields?.date || defaultDate,
        eventName: match.fields?.eventName || defaultEventName,
        achievement: match.fields?.achievement,
        rank: match.fields?.rank,
        score: match.fields?.score,
        verifiedAt: new Date().toISOString(),
        status: 'valid',
      };
    }
  }

  return {
    certId: cleanId,
    participantName: 'Record Not Found',
    issueDate: '',
    eventName: '',
    verifiedAt: new Date().toISOString(),
    status: 'not_found',
  };
}
