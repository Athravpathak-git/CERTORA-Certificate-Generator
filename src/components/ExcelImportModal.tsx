import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  Sparkles,
  Table,
  Check,
  ChevronDown,
} from 'lucide-react';
import { CertificateField, Participant } from '../types';
import {
  autoDetectColumnMapping,
  ExcelWorkbookData,
} from '../services/excelService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbookData: ExcelWorkbookData | null;
  onConfirmImport: (participants: Participant[]) => void;
  templateFields?: CertificateField[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  workbookData,
  onConfirmImport,
  templateFields,
}) => {
  if (!isOpen || !workbookData) return null;

  const [activeSheet, setActiveSheet] = useState<string>(
    workbookData.sheetNames[0] || ''
  );

  const sheetInfo = workbookData.sheets[activeSheet] || {
    name: '',
    rowCount: 0,
    headers: [],
    sampleRows: [],
  };

  // Build universal target fields from active template
  const targetFields = React.useMemo(() => {
    if (templateFields && templateFields.length > 0) {
      const dynamicFields = templateFields
        .filter((f) => f.enabled && f.type !== 'signature' && f.type !== 'qr_code')
        .map((f) => {
          const isName = f.type === 'candidate_name' || f.fieldKey === 'candidateName';
          return {
            key: f.fieldKey || (isName ? 'candidateName' : f.id),
            label: `${f.label || 'Field'}${f.placeholder ? ` (${f.placeholder})` : ''}`,
            required: isName,
            isName,
          };
        });

      // Ensure candidate name is always present
      if (!dynamicFields.some((f) => f.isName)) {
        dynamicFields.unshift({
          key: 'candidateName',
          label: 'Candidate / Participant Name (Required)',
          required: true,
          isName: true,
        });
      }
      return dynamicFields;
    }

    return [
      { key: 'candidateName', label: 'Candidate Name (Required)', required: true, isName: true },
      { key: 'eventName', label: 'Event / Program Name', required: false, isName: false },
      { key: 'courseName', label: 'Course Name', required: false, isName: false },
      { key: 'role', label: 'Internship Role', required: false, isName: false },
      { key: 'department', label: 'Department / Organization', required: false, isName: false },
      { key: 'duration', label: 'Duration / Period', required: false, isName: false },
      { key: 'location', label: 'Location / Venue', required: false, isName: false },
      { key: 'date', label: 'Custom Date', required: false, isName: false },
      { key: 'score', label: 'Score / Marks', required: false, isName: false },
      { key: 'rank', label: 'Rank / Position', required: false, isName: false },
      { key: 'achievement', label: 'Achievement / Award', required: false, isName: false },
    ];
  }, [templateFields]);

  // Mapping state: fieldKey -> Excel header name
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(() =>
    autoDetectColumnMapping(sheetInfo.headers, targetFields.map((f) => ({ fieldKey: f.key, label: f.label })))
  );

  const [previewLimit, setPreviewLimit] = useState(10);

  // When sheet changes, re-evaluate default mappings
  const handleSheetChange = (sheetName: string) => {
    setActiveSheet(sheetName);
    const newSheet = workbookData.sheets[sheetName];
    if (newSheet) {
      setColumnMapping(autoDetectColumnMapping(newSheet.headers, targetFields.map((f) => ({ fieldKey: f.key, label: f.label }))));
    }
  };

  const updateMapping = (fieldKey: string, headerName: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [fieldKey]: headerName,
    }));
  };

  const handleFinishImport = () => {
    // Find name column (key 'candidateName' or field marked isName)
    const nameField = targetFields.find((f) => f.isName) || targetFields[0];
    const nameColumn = columnMapping[nameField.key] || columnMapping['candidateName'];
    if (!nameColumn) {
      alert('Please select a spreadsheet column for Candidate / Participant Name.');
      return;
    }

    const importedParticipants: Participant[] = sheetInfo.sampleRows
      .map((row, index) => {
        const rawName = String(row[nameColumn] || '').trim();
        if (!rawName) return null;

        const fields: Record<string, string> = {};
        Object.entries(columnMapping).forEach(([fieldKey, colHeader]) => {
          if (fieldKey !== nameField.key && colHeader && row[colHeader] !== undefined) {
            fields[fieldKey] = String(row[colHeader] || '').trim();
          }
        });

        return {
          id: `excel-${Date.now()}-${index}`,
          name: rawName,
          fields,
          generatedFilename: `${rawName.replace(/\s+/g, '_')}.pdf`,
        };
      })
      .filter((p): p is Participant => p !== null);

    if (importedParticipants.length === 0) {
      alert('No valid participant rows found in the selected sheet.');
      return;
    }

    onConfirmImport(importedParticipants);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">
                Excel Spreadsheet Importer (.xlsx / .xls)
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {workbookData.fileName} • {sheetInfo.rowCount} rows detected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Worksheet Selector (if multiple sheets exist) */}
          {workbookData.sheetNames.length > 1 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Select Worksheet
                </label>
                <p className="text-[11px] text-slate-400">
                  This workbook contains multiple sheets. Choose which one to import.
                </p>
              </div>

              <select
                value={activeSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {workbookData.sheetNames.map((s) => (
                  <option key={s} value={s}>
                    {s} ({workbookData.sheets[s]?.rowCount || 0} rows)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Column Mapping Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Table className="w-4 h-4 text-brand-600" />
                <span>Column Header Mapping</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Matches Excel columns to certificate placeholders
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {targetFields.map((f) => (
                <div
                  key={f.key}
                  className={`p-3 rounded-xl border transition-all ${
                    columnMapping[f.key]
                      ? 'border-brand-300 bg-brand-50/40'
                      : f.required
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    {f.label}
                  </label>

                  <select
                    value={columnMapping[f.key] || ''}
                    onChange={(e) => updateMapping(f.key, e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Do Not Import --</option>
                    {sheetInfo.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Data Rows Preview Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Preview of Imported Rows (Preserves Marathi & Unicode)</span>
              <span className="text-slate-400 font-normal">
                Showing first {Math.min(previewLimit, sheetInfo.sampleRows.length)} of{' '}
                {sheetInfo.rowCount}
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 w-10 text-center">#</th>
                    <th className="py-2 px-3">Candidate Name</th>
                    <th className="py-2 px-3">Score</th>
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sheetInfo.sampleRows.slice(0, previewLimit).map((row, idx) => {
                    const name = columnMapping.candidateName
                      ? row[columnMapping.candidateName] || '—'
                      : '—';
                    const score = columnMapping.score ? row[columnMapping.score] || '—' : '—';
                    const rank = columnMapping.rank ? row[columnMapping.rank] || '—' : '—';
                    const perf = columnMapping.performance
                      ? row[columnMapping.performance] || '—'
                      : '—';

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{name}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{score}</td>
                        <td className="py-2 px-3 text-slate-600">{rank}</td>
                        <td className="py-2 px-3 text-slate-600">{perf}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            {sheetInfo.rowCount} participants ready to be imported into your roster.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleFinishImport}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Confirm & Import Roster</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
