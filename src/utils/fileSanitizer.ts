/**
 * Sanitizes a participant name into a safe, elegant filename.
 * Handles duplicates by maintaining unique filenames with sequence numbers (e.g. Rahul_Patil_CERT-2026-0001.pdf).
 */
export function sanitizeFilename(
  rawName: string,
  existingFilenames?: Set<string>,
  extension: string = 'pdf',
  certId?: string
): string {
  if (!rawName || !rawName.trim()) {
    rawName = 'Participant';
  }

  // Replace invalid filesystem characters: <>:"/\|?* and control characters
  let cleanName = rawName
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '_');

  let base = cleanName;
  if (certId && certId.trim()) {
    const cleanId = certId.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
    base = `${cleanName}_${cleanId}`;
  }

  if (!base) {
    base = 'Certificate';
  }

  const cleanExt = extension.replace(/^\./, '');
  let candidate = `${base}.${cleanExt}`;

  if (!existingFilenames) {
    return candidate;
  }

  // Handle collision
  if (!existingFilenames.has(candidate.toLowerCase())) {
    existingFilenames.add(candidate.toLowerCase());
    return candidate;
  }

  let counter = 2;
  while (existingFilenames.has(`${base}_${counter}.${cleanExt}`.toLowerCase())) {
    counter++;
  }

  const uniqueName = `${base}_${counter}.${cleanExt}`;
  existingFilenames.add(uniqueName.toLowerCase());
  return uniqueName;
}

/**
 * Robust CSV parser that handles quotes, commas, and newlines
 */
export function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let curVal = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(curVal.trim());
        curVal = '';
      } else {
        curVal += char;
      }
    }
    values.push(curVal.trim());
    return values;
  };

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, index) => {
      rowObj[h] = (vals[index] || '').replace(/^["']|["']$/g, '').trim();
    });
    // Check if row has any non-empty data
    if (Object.values(rowObj).some((v) => v.length > 0)) {
      rows.push(rowObj);
    }
  }

  return { headers, rows };
}
