import React, { useState, useRef } from 'react';
import {
  Users,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Trash2,
  Plus,
  Sparkles,
  Edit2,
  Check,
  X,
  Languages,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { Participant, ValidationIssue } from '../../types';
import { SAMPLE_PARTICIPANTS } from '../../constants/sampleData';
import { parseCSV } from '../../utils/fileSanitizer';
import { parseExcelWorkbook, ExcelWorkbookData } from '../../services/excelService';
import { ExcelImportModal } from '../ExcelImportModal';
import { findDuplicateNames } from '../../services/validationService';

interface ParticipantsViewProps {
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
}

const SAMPLE_MARATHI_PARTICIPANTS: Participant[] = [
  {
    id: 'p-mr-1',
    name: 'अथर्व पाठक',
    fields: { achievement: 'प्रथम क्रमांक', score: '९८%', cert_id: 'ATH-2026-0001' },
    generatedFilename: 'Atharva_Pathak_ATH-2026-0001.pdf',
  },
  {
    id: 'p-mr-2',
    name: 'प्रिया कुलकर्णी',
    fields: { achievement: 'उत्कृष्ट कामगिरी', score: '९५%', cert_id: 'ATH-2026-0002' },
    generatedFilename: 'Priya_Kulkarni_ATH-2026-0002.pdf',
  },
  {
    id: 'p-mr-3',
    name: 'रोहन जोशी',
    fields: { achievement: 'विशेष प्राविण्य', score: '९२%', cert_id: 'ATH-2026-0003' },
    generatedFilename: 'Rohan_Joshi_ATH-2026-0003.pdf',
  },
  {
    id: 'p-mr-4',
    name: 'स्नेहल पवार',
    fields: { achievement: 'सक्रिय सहभाग', score: '९०%', cert_id: 'ATH-2026-0004' },
    generatedFilename: 'Snehal_Pawar_ATH-2026-0004.pdf',
  },
  {
    id: 'p-mr-5',
    name: 'अमित कदम',
    fields: { achievement: 'प्रशस्तीपत्रक', score: '८९%', cert_id: 'ATH-2026-0005' },
    generatedFilename: 'Amit_Kadam_ATH-2026-0005.pdf',
  },
];

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  participants,
  onUpdateParticipants,
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

    const newParticipants: Participant[] = lines.map((name, index) => ({
      id: `p-${Date.now()}-${index}`,
      name,
      fields: {},
      generatedFilename: `${name.replace(/\s+/g, '_')}.pdf`,
    }));

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
      const data = await parseExcelWorkbook(file);
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
          ['name', 'candidate', 'participant', 'fullname', 'student', 'full name', 'नाव'].includes(
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-gold-dark bg-gold/15 px-2.5 py-1 rounded-md border border-gold/30">
            Participant Data Management
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#182536] mt-2">
            Import &amp; Organize Participant Roster
          </h2>
          <p className="text-xs text-[#77818C] mt-1">
            Import participants via Excel (.xlsx), CSV, TXT, or paste a list of names. Includes duplicate spelling detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateParticipants(SAMPLE_PARTICIPANTS)}
            className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Load Demo (10)</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateParticipants(SAMPLE_MARATHI_PARTICIPANTS)}
            className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5"
          >
            <Languages className="w-3.5 h-3.5 text-gold" />
            <span>मराठी Batch (5)</span>
          </button>
        </div>
      </div>

      {/* Duplicate & Quality Warnings */}
      {duplicateIssues.length > 0 && (
        <div className="p-4 rounded-2xl bg-status-warning/15 border border-status-warning/30 text-[#182536] text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-status-warning">
              Duplicate / Near-Duplicate Names Detected ({duplicateIssues.length} warnings)
            </div>
            <p className="text-xs text-[#77818C]">
              {duplicateIssues.map((d: ValidationIssue) => d.message).join(' • ')}
            </p>
            <p className="text-[11px] text-[#77818C]">
              ℹ️ Duplicate names are <strong>never automatically deleted</strong>. Each will be assigned an independent certificate and unique serial number.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Upload & Paste on Left, Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Methods */}
        <div className="lg:col-span-5 space-y-5">
          {/* Paste Names Card */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#182536] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold" />
                <span>Paste Names (One per line)</span>
              </label>
              <span className="text-[10px] text-[#77818C]">Supports Marathi &amp; English</span>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="अथर्व पाठक&#10;Athrav Pathak&#10;राहुल पाटील&#10;Priya Sharma&#10;Amit Deshmukh"
              className="input-clean w-full text-xs font-medium resize-none"
            />

            <button
              type="button"
              onClick={handleProcessPastedText}
              disabled={!rawText.trim()}
              className="btn-gold w-full text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Names to Roster</span>
            </button>
          </div>

          {/* Import from Files Card (Excel, CSV, TXT) */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#182536]">
              Import from File
            </h4>

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
                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/60 text-left transition-all group"
              >
                <FileSpreadsheet className="w-5 h-5 text-status-success mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-[#182536]">Excel (.xlsx)</div>
                <div className="text-[10px] text-[#77818C] mt-0.5">Multi-sheet</div>
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
                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/60 text-left transition-all group"
              >
                <FileSpreadsheet className="w-5 h-5 text-gold mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-[#182536]">CSV File</div>
                <div className="text-[10px] text-[#77818C] mt-0.5">Spreadsheet</div>
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
                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/60 text-left transition-all group"
              >
                <FileText className="w-5 h-5 text-[#182536] mb-1.5 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-[#182536]">TXT File</div>
                <div className="text-[10px] text-[#77818C] mt-0.5">Line by line</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Participant Roster Table (Section 11) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E5DD] pb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#182536]">
                Active Participant Roster
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold-dark border border-gold/30">
                {participants.length} Total
              </span>
            </div>

            {participants.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-status-error hover:underline font-semibold"
              >
                Clear Roster
              </button>
            )}
          </div>

          {/* Quick Add Single Participant */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add single participant name..."
              value={newSingleName}
              onChange={(e) => setNewSingleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSingle();
              }}
              className="input-clean flex-1 text-xs"
            />
            <button
              type="button"
              onClick={handleAddSingle}
              className="btn-midnight py-2 px-4 text-xs font-bold"
            >
              Add
            </button>
          </div>

          {/* Clean Participant Table (Section 11: No., Participant Name, Status, Actions) */}
          {participants.length > 0 ? (
            <div className="border border-[#E8E5DD] rounded-xl overflow-hidden max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F5] sticky top-0 border-b border-[#E8E5DD] text-[#77818C] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">No.</th>
                    <th className="py-2.5 px-3">Participant Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E5DD]">
                  {participants.map((p, index) => {
                    const isEditing = editingId === p.id;
                    const hasDupeWarning = duplicateIssues.some(
                      (issue: ValidationIssue) =>
                        issue.participantId === p.id || issue.participantName === p.name
                    );

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-[#FAF8F5] transition-colors ${
                          hasDupeWarning ? 'bg-status-warning/5' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center text-[#77818C] font-mono text-[11px]">
                          {index + 1}
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-[#182536]">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(p.id);
                                }}
                                className="input-clean py-1 px-2 text-xs w-full"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => saveEdit(p.id)}
                                className="p-1 text-status-success hover:bg-status-success/20 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="p-1 text-[#77818C] hover:bg-[#FAF8F5] rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-[#182536]">{p.name}</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {hasDupeWarning ? (
                            <span className="px-2 py-0.5 bg-status-warning/15 text-status-warning text-[10px] font-bold rounded-full border border-status-warning/30">
                              Duplicate
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-status-success/15 text-status-success text-[10px] font-bold rounded-full border border-status-success/30">
                              Valid
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => startEdit(p)}
                                className="p-1.5 text-[#77818C] hover:text-[#182536] hover:bg-[#FAF8F5] rounded-lg transition-colors"
                                title="Edit name"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-[#77818C] hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                              title="Delete participant"
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
            <div className="py-12 border border-dashed border-[#E8E5DD] rounded-xl text-center text-[#77818C] bg-[#FAF8F5]">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-gold" />
              <p className="text-xs font-semibold text-[#182536]">No participants in roster yet</p>
              <p className="text-[11px] text-[#77818C] mt-0.5">
                Paste names on the left or click "Load Demo"
              </p>
            </div>
          )}
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
