import React, { useState, useRef } from 'react';
import {
  Users,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Trash2,
  Plus,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Edit2,
  Check,
  X,
  Languages,
} from 'lucide-react';
import { Participant, ValidationIssue } from '../../types';
import { SAMPLE_PARTICIPANTS } from '../../constants/sampleData';
import { parseCSV } from '../../utils/fileSanitizer';
import { parseExcelFile, ExcelWorkbookData } from '../../services/excelService';
import { ExcelImportModal } from '../ExcelImportModal';
import { findDuplicateNames } from '../../services/validationService';

interface Step5ParticipantsProps {
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAMPLE_MARATHI_PARTICIPANTS: Participant[] = [
  {
    id: 'p-mr-1',
    name: 'अथर्व पाठक',
    fields: { achievement: 'प्रथम क्रमांक', score: '९८%', cert_id: 'CERT-2025-0001' },
    generatedFilename: 'Atharva_Pathak_CERT-2025-0001.pdf',
  },
  {
    id: 'p-mr-2',
    name: 'प्रिया कुलकर्णी',
    fields: { achievement: 'उत्कृष्ट कामगिरी', score: '९५%', cert_id: 'CERT-2025-0002' },
    generatedFilename: 'Priya_Kulkarni_CERT-2025-0002.pdf',
  },
  {
    id: 'p-mr-3',
    name: 'रोहन जोशी',
    fields: { achievement: 'विशेष प्राविण्य', score: '९२%', cert_id: 'CERT-2025-0003' },
    generatedFilename: 'Rohan_Joshi_CERT-2025-0003.pdf',
  },
  {
    id: 'p-mr-4',
    name: 'स्नेहल पवार',
    fields: { achievement: 'सक्रिय सहभाग', score: '९०%', cert_id: 'CERT-2025-0004' },
    generatedFilename: 'Snehal_Pawar_CERT-2025-0004.pdf',
  },
  {
    id: 'p-mr-5',
    name: 'अमित कदम',
    fields: { achievement: 'प्रशस्तीपत्रक', score: '८९%', cert_id: 'CERT-2025-0005' },
    generatedFilename: 'Amit_Kadam_CERT-2025-0005.pdf',
  },
];

export const Step5Participants: React.FC<Step5ParticipantsProps> = ({
  participants,
  onUpdateParticipants,
  onNext,
  onBack,
}) => {
  const [rawText, setRawText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [newSingleName, setNewSingleName] = useState('');

  // Excel Modal State
  const [excelWorkbook, setExcelWorkbook] = useState<ExcelWorkbookData | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Exact & Fuzzy Duplicate Detection
  const duplicateIssues = findDuplicateNames(participants);

  // Process raw pasted text
  const handleProcessPastedText = () => {
    if (!rawText.trim()) return;

    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const newParticipants: Participant[] = lines.map((name, index) => {
      return {
        id: `p-${Date.now()}-${index}`,
        name,
        fields: {},
        generatedFilename: `${name.replace(/\s+/g, '_')}.pdf`,
      };
    });

    onUpdateParticipants([...participants, ...newParticipants]);
    setRawText('');
  };

  // Add single name
  const handleAddSingle = () => {
    if (!newSingleName.trim()) return;
    const name = newSingleName.trim();
    onUpdateParticipants([
      ...participants,
      {
        id: `p-${Date.now()}`,
        name,
        fields: {},
        generatedFilename: `${name.replace(/\s+/g, '_')}.pdf`,
      },
    ]);
    setNewSingleName('');
  };

  // Delete participant
  const handleDelete = (id: string) => {
    onUpdateParticipants(participants.filter((p) => p.id !== id));
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire participant roster?')) {
      onUpdateParticipants([]);
    }
  };

  // Inline edit
  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditNameValue(p.name);
  };
  const saveEdit = (id: string) => {
    if (!editNameValue.trim()) return;
    onUpdateParticipants(
      participants.map((p) =>
        p.id === id
          ? {
              ...p,
              name: editNameValue.trim(),
              generatedFilename: `${editNameValue.trim().replace(/\s+/g, '_')}.pdf`,
            }
          : p
      )
    );
    setEditingId(null);
  };

  // Excel Import Handler
  const handleExcelFile = async (file: File) => {
    try {
      const data = await parseExcelFile(file);
      setExcelWorkbook(data);
      setIsExcelModalOpen(true);
    } catch (err: any) {
      alert('Failed to parse Excel file: ' + err.message);
    }
  };

  // CSV Import
  const handleCsvFile = async (file: File) => {
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) return;

      const nameKey =
        headers.find((h) =>
          ['name', 'candidate', 'participant', 'fullname', 'student', 'full name'].includes(
            h.toLowerCase()
          )
        ) || headers[0];

      const imported: Participant[] = rows.map((row, index) => {
        const name = row[nameKey] || `Participant ${index + 1}`;
        const fields: Record<string, string> = {};

        Object.keys(row).forEach((col) => {
          if (col !== nameKey) {
            fields[col.toLowerCase()] = row[col];
          }
        });

        return {
          id: `csv-${Date.now()}-${index}`,
          name: name.trim(),
          fields,
          generatedFilename: `${name.trim().replace(/\s+/g, '_')}.pdf`,
        };
      });

      onUpdateParticipants([...participants, ...imported]);
    } catch (err) {
      alert('Failed to parse CSV file: ' + err);
    }
  };

  // TXT Import
  const handleTxtFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const imported: Participant[] = lines.map((name, index) => ({
        id: `txt-${Date.now()}-${index}`,
        name,
        fields: {},
        generatedFilename: `${name.replace(/\s+/g, '_')}.pdf`,
      }));

      onUpdateParticipants([...participants, ...imported]);
    } catch (err) {
      alert('Failed to parse TXT file: ' + err);
    }
  };

  const handleLoadSample = () => {
    onUpdateParticipants(SAMPLE_PARTICIPANTS);
  };

  const handleLoadMarathiSample = () => {
    onUpdateParticipants(SAMPLE_MARATHI_PARTICIPANTS);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 5 of 12 • Participant Roster
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Import Participant Data (Excel, CSV, TXT, Marathi)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Import participants with custom fields. Full UTF-8 support for Marathi Unicode names and custom columns.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            onClick={onNext}
            disabled={participants.length === 0}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <span>Continue to Custom Data & Date</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Duplicate & Quality Warning Banner */}
      {duplicateIssues.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              Duplicate / Near-Duplicate Names Detected ({duplicateIssues.length} warnings)
            </div>
            <p className="mt-0.5 text-amber-700">
              {duplicateIssues.map((d: ValidationIssue) => d.message).join(' • ')}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              ℹ️ Duplicate names are <strong>not silently deleted</strong>. Each will be assigned a distinct certificate and unique serial number.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Paste / Import on Left, Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Textarea & File Import */}
        <div className="lg:col-span-5 space-y-5">
          {/* Paste Textarea Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600" />
                <span>Paste Names (One per line)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>10 Sample Names</span>
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleLoadMarathiSample}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                  title="Load Marathi sample roster"
                >
                  <Languages className="w-3.5 h-3.5 text-emerald-600" />
                  <span>मराठी Batch</span>
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="अथर्व पाठक&#10;राहुल पाटील&#10;Atharva Pathak&#10;Priya Sharma&#10;Amit Deshmukh"
              className="w-full p-3.5 rounded-xl border border-slate-300 font-medium text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />

            <button
              type="button"
              onClick={handleProcessPastedText}
              disabled={!rawText.trim()}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Names to Roster</span>
            </button>
          </div>

          {/* Quick Import Card: Excel, CSV, TXT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-navy-900">Import from File</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Excel Import */}
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleExcelFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Excel (.xlsx)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Sheets & column mapping</div>
              </button>

              {/* CSV Import */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleCsvFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 text-left transition-all group"
              >
                <FileSpreadsheet className="w-5 h-5 text-brand-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">CSV File</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Comma separated</div>
              </button>

              {/* TXT Import */}
              <input
                ref={txtInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleTxtFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => txtInputRef.current?.click()}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group"
              >
                <FileText className="w-5 h-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">TXT File</div>
                <div className="text-[10px] text-slate-400 mt-0.5">One per line</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Participant Roster & Live Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-navy-900">
                  Active Participant Roster
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200/60">
                  {participants.length} Total
                </span>
              </div>

              {participants.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold self-start sm:self-auto"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Quick single add input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add single participant..."
                value={newSingleName}
                onChange={(e) => setNewSingleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSingle();
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddSingle}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Add
              </button>
            </div>

            {/* Participant Table */}
            {participants.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3">Participant Name</th>
                      <th className="py-2.5 px-3">Cert ID / Field Info</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participants.map((p, index) => {
                      const isEditing = editingId === p.id;
                      const hasDupeWarning = duplicateIssues.some(
                        (issue: ValidationIssue) =>
                          issue.participantId === p.id || issue.participantName === p.name
                      );

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            hasDupeWarning ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {index + 1}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(p.id);
                                  }}
                                  className="px-2 py-1 border border-brand-500 rounded text-xs font-semibold w-full"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => saveEdit(p.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{p.name}</span>
                                {hasDupeWarning && (
                                  <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[9px] font-bold rounded">
                                    Duplicate / Variation
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] truncate max-w-[160px]">
                            {p.certId || p.fields?.cert_id || (p.fields?.achievement ? p.fields.achievement : '—')}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isEditing && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(p)}
                                  className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Edit name"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove participant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No participants in roster yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Paste names on the left, import Excel/CSV, or click "Load Sample Names"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        workbookData={excelWorkbook}
        onConfirmImport={(newParticipants) => {
          onUpdateParticipants([...participants, ...newParticipants]);
          setIsExcelModalOpen(false);
        }}
      />
    </div>
  );
};
