import * as XLSX from 'xlsx';

export interface ExcelWorksheetInfo {
  name: string;
  rowCount: number;
  headers: string[];
  sampleRows: Record<string, any>[];
}

export interface ExcelWorkbookData {
  fileName: string;
  sheetNames: string[];
  sheets: Record<string, ExcelWorksheetInfo>;
}

export interface ExcelParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  hasErrors: boolean;
  errors: string[];
}

/**
 * Reads an Excel file buffer and parses all worksheets with headers and rows
 */
export async function parseExcelWorkbook(file: File): Promise<ExcelWorkbookData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    codepage: 65001, // UTF-8 to preserve Marathi/Devanagari characters
  });

  const sheets: Record<string, ExcelWorksheetInfo> = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON with headers
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: '',
      raw: false,
    });

    // Extract headers from first non-empty row or sheet range
    const headers: string[] = [];
    if (rawRows.length > 0) {
      Object.keys(rawRows[0]).forEach((h) => {
        if (h && !h.startsWith('__EMPTY')) {
          headers.push(h.trim());
        }
      });
    }

    sheets[sheetName] = {
      name: sheetName,
      rowCount: rawRows.length,
      headers,
      sampleRows: rawRows.slice(0, 100), // Preview up to 100 rows
    };
  }

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    sheets,
  };
}

/**
 * Auto-detects the best column matches for universal certificate fields.
 * Supports dynamic template fields and standard fallback matching.
 */
export function autoDetectColumnMapping(
  headers: string[],
  targetFields?: { fieldKey: string; label: string; placeholder?: string }[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. If explicit template target fields are provided, map directly to them
  if (targetFields && targetFields.length > 0) {
    targetFields.forEach((field) => {
      const fieldKeyNorm = clean(field.fieldKey);
      const labelNorm = clean(field.label);
      const placeholderNorm = field.placeholder ? clean(field.placeholder.replace(/[{}]/g, '')) : '';

      // Direct match search across headers
      const matched = headers.find((h) => {
        const hNorm = clean(h);
        if (hNorm === fieldKeyNorm || (labelNorm && hNorm === labelNorm) || (placeholderNorm && hNorm === placeholderNorm)) {
          return true;
        }
        if (fieldKeyNorm.includes('name') || labelNorm.includes('name')) {
          return hNorm.includes('name') || hNorm.includes('candidate') || hNorm.includes('student') || hNorm.includes('participant') || hNorm === 'नाव';
        }
        if (fieldKeyNorm.includes('event') || labelNorm.includes('event')) {
          return hNorm.includes('event') || hNorm.includes('competition') || hNorm.includes('activity');
        }
        if (fieldKeyNorm.includes('course') || labelNorm.includes('course')) {
          return hNorm.includes('course') || hNorm.includes('program') || hNorm.includes('subject');
        }
        if (fieldKeyNorm.includes('duration') || labelNorm.includes('duration')) {
          return hNorm.includes('duration') || hNorm.includes('period') || hNorm.includes('tenure') || hNorm.includes('months');
        }
        if (fieldKeyNorm.includes('role') || labelNorm.includes('role')) {
          return hNorm.includes('role') || hNorm.includes('designation') || hNorm.includes('title');
        }
        if (fieldKeyNorm.includes('department') || labelNorm.includes('department')) {
          return hNorm.includes('department') || hNorm.includes('dept') || hNorm.includes('org') || hNorm.includes('company');
        }
        if (fieldKeyNorm.includes('location') || labelNorm.includes('location')) {
          return hNorm.includes('location') || hNorm.includes('venue') || hNorm.includes('city') || hNorm.includes('place');
        }
        if (fieldKeyNorm.includes('grade') || fieldKeyNorm.includes('score')) {
          return hNorm.includes('grade') || hNorm.includes('score') || hNorm.includes('marks') || hNorm.includes('percentage');
        }
        if (fieldKeyNorm.includes('rank')) {
          return hNorm.includes('rank') || hNorm.includes('position');
        }
        if (fieldKeyNorm.includes('id')) {
          return hNorm.includes('id') || hNorm.includes('roll') || hNorm.includes('credential');
        }
        return false;
      });

      if (matched) {
        mapping[field.fieldKey] = matched;
      }
    });

    return mapping;
  }

  // 2. Default standard heuristic mapping
  headers.forEach((h) => {
    const c = clean(h);

    if (
      !mapping.candidateName &&
      (c.includes('name') ||
        c.includes('candidate') ||
        c.includes('participant') ||
        c.includes('student') ||
        c.includes('fullname') ||
        c === 'नाव' ||
        c.includes('विद्यार्थी'))
    ) {
      mapping.candidateName = h;
    } else if (!mapping.score && (c.includes('score') || c.includes('marks') || c.includes('गुण'))) {
      mapping.score = h;
    } else if (!mapping.rank && (c.includes('rank') || c.includes('position') || c.includes('क्रमांक'))) {
      mapping.rank = h;
    } else if (
      !mapping.performance &&
      (c.includes('grade') || c.includes('performance') || c.includes('श्रेणी'))
    ) {
      mapping.performance = h;
    } else if (!mapping.achievement && (c.includes('achievement') || c.includes('award') || c.includes('पारितोषिक'))) {
      mapping.achievement = h;
    } else if (!mapping.eventName && (c.includes('event') || c.includes('program') || c.includes('कार्यक्रम'))) {
      mapping.eventName = h;
    } else if (!mapping.courseName && (c.includes('course') || c.includes('subject') || c.includes('program'))) {
      mapping.courseName = h;
    } else if (!mapping.location && (c.includes('location') || c.includes('venue') || c.includes('city') || c.includes('place'))) {
      mapping.location = h;
    } else if (!mapping.duration && (c.includes('duration') || c.includes('period') || c.includes('tenure'))) {
      mapping.duration = h;
    } else if (!mapping.role && (c.includes('role') || c.includes('designation'))) {
      mapping.role = h;
    } else if (!mapping.date && (c.includes('date') || c.includes('दिनांक') || c.includes('तारीख'))) {
      mapping.date = h;
    }
  });

  return mapping;
}

export const parseExcelFile = parseExcelWorkbook;

