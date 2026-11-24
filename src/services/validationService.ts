import { CertificateField, Participant, ValidationIssue } from '../types';

/**
 * Normalizes a name string by removing multiple internal spaces and converting to lowercase
 */
export function normalizeNameForComparison(name: string): string {
  return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Standard Levenshtein distance for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Comprehensive validation engine before bulk generation
 */
export function validateCertificateBatch(
  participants: Participant[],
  fields: CertificateField[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Check Missing Names & Empty Records
  participants.forEach((p, index) => {
    if (!p.name || !p.name.trim()) {
      issues.push({
        type: 'error',
        participantId: p.id,
        participantName: `Row #${index + 1}`,
        field: 'name',
        message: `Row #${index + 1} has an empty or blank participant name.`,
      });
    }
  });

  // 2. Intelligent Duplicate Name Detection
  const normalizedMap = new Map<string, { raw: string; indices: number[] }>();

  participants.forEach((p, index) => {
    const raw = (p.name || '').trim();
    if (!raw) return;

    const norm = normalizeNameForComparison(raw);
    const existing = normalizedMap.get(norm);

    if (existing) {
      existing.indices.push(index + 1);
    } else {
      normalizedMap.set(norm, { raw, indices: [index + 1] });
    }
  });

  // Report exact and case/spacing duplicates
  normalizedMap.forEach((entry) => {
    if (entry.indices.length > 1) {
      issues.push({
        type: 'warning',
        participantName: entry.raw,
        field: 'name',
        message: `Duplicate name "${entry.raw}" detected on Rows: ${entry.indices.join(
          ', '
        )}. Each will receive a separate certificate with unique numbering.`,
      });
    }
  });

  // Fuzzy spelling similarity warnings
  const uniqueNames = Array.from(normalizedMap.keys());
  for (let i = 0; i < uniqueNames.length; i++) {
    for (let j = i + 1; j < uniqueNames.length; j++) {
      const nameA = uniqueNames[i];
      const nameB = uniqueNames[j];
      if (nameA.length > 4 && nameB.length > 4) {
        const dist = levenshteinDistance(nameA, nameB);
        if (dist === 1 || (dist === 2 && nameA.length > 8)) {
          const entryA = normalizedMap.get(nameA)!;
          const entryB = normalizedMap.get(nameB)!;
          issues.push({
            type: 'warning',
            participantName: entryA.raw,
            field: 'fuzzy_duplicate',
            message: `Possible spelling variation detected: "${entryA.raw}" (Row ${entryA.indices.join(
              ','
            )}) and "${entryB.raw}" (Row ${entryB.indices.join(',')}).`,
          });
        }
      }
    }
  }

  // 3. Duplicate Certificate ID Check
  const idSet = new Map<string, number[]>();
  participants.forEach((p, index) => {
    if (p.certId) {
      const existing = idSet.get(p.certId);
      if (existing) {
        existing.push(index + 1);
      } else {
        idSet.set(p.certId, [index + 1]);
      }
    }
  });

  idSet.forEach((rows, certId) => {
    if (rows.length > 1) {
      issues.push({
        type: 'error',
        field: 'cert_id',
        message: `Duplicate Certificate ID "${certId}" assigned to Rows: ${rows.join(
          ', '
        )}. Certificate IDs must be strictly unique.`,
      });
    }
  });

  // 4. Field Boundary & Overlap Checks
  fields.forEach((f) => {
    if (!f.enabled) return;

    if (f.xPercent + f.widthPercent > 101) {
      issues.push({
        type: 'warning',
        field: f.type,
        message: `Field "${f.label}" extends beyond the right edge (${Math.round(
          f.xPercent + f.widthPercent
        )}%).`,
      });
    }
    if (f.yPercent + f.heightPercent > 101) {
      issues.push({
        type: 'warning',
        field: f.type,
        message: `Field "${f.label}" extends beyond the bottom edge (${Math.round(
          f.yPercent + f.heightPercent
        )}%).`,
      });
    }
  });

  return issues;
}

/**
 * Filtered helper specifically returning duplicate and near-duplicate name warnings
 */
export function findDuplicateNames(participants: Participant[]): ValidationIssue[] {
  const issues = validateCertificateBatch(participants, []);
  return issues.filter((i) => i.field === 'name' || i.field === 'fuzzy_duplicate');
}
