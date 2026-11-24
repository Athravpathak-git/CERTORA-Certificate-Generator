import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Eye,
  Sliders,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  FileCheck,
} from 'lucide-react';
import {
  CertificateField,
  CertificateTemplate,
  Participant,
  ValidationIssue,
} from '../../types';
import { validateCertificateBatch } from '../../services/validationService';

interface StepBulkValidationProps {
  template: CertificateTemplate | null;
  fields: CertificateField[];
  participants: Participant[];
  onProceedToGenerate: () => void;
  onGoToEditor: () => void;
  onBack: () => void;
}

export const StepBulkValidation: React.FC<StepBulkValidationProps> = ({
  template,
  fields,
  participants,
  onProceedToGenerate,
  onGoToEditor,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'warnings' | 'valid'>('all');

  // Run automated validation
  const validationIssues = validateCertificateBatch(participants, fields);
  const errorCount = validationIssues.filter((i) => i.type === 'error').length;
  const warningCount = validationIssues.filter((i) => i.type === 'warning').length;

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.certId || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'warnings') {
      return validationIssues.some(
        (i) => i.participantName === p.name || i.participantId === p.id
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 9 of 12 • Pre-Flight Validation
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Batch Pre-Flight Validation & Quality Assurance
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Automated quality check for duplicate names, layout boundaries, missing fields, and serial ID uniqueness.
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
            onClick={onProceedToGenerate}
            disabled={errorCount > 0}
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 disabled:opacity-40 text-white shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>Approve & Generate All ({participants.length})</span>
          </button>
        </div>
      </div>

      {/* Validation Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Participants</div>
            <div className="text-2xl font-extrabold text-navy-900 font-mono mt-0.5">
              {participants.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
            errorCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Critical Errors</div>
            <div
              className={`text-2xl font-extrabold font-mono mt-0.5 ${
                errorCount > 0 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {errorCount}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              errorCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
            warningCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-400">Warnings & Flags</div>
            <div
              className={`text-2xl font-extrabold font-mono mt-0.5 ${
                warningCount > 0 ? 'text-amber-600' : 'text-slate-800'
              }`}
            >
              {warningCount}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              warningCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Validation Issues Alert Banner */}
      {validationIssues.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Validation Report ({validationIssues.length} items)</span>
            </h4>
            <button
              type="button"
              onClick={onGoToEditor}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Fix in Editor</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
            {validationIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg flex items-start gap-2 ${
                  issue.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {issue.type === 'error' ? (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by participant name or Certificate ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({participants.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('warnings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'warnings'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Flagged ({warningCount + errorCount})
          </button>
        </div>
      </div>

      {/* Participant Certificate Preview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredParticipants.map((p, idx) => {
          const hasIssue = validationIssues.some(
            (i) => i.participantName === p.name || i.participantId === p.id
          );

          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                hasIssue
                  ? 'border-amber-300 bg-amber-50/20 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-brand-400 hover:shadow-sm'
              }`}
            >
              <div className="space-y-2">
                {/* Certificate mini canvas preview */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-2">
                  {template?.previewImageUrl ? (
                    <img
                      src={template.previewImageUrl}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <FileCheck className="w-8 h-8 text-slate-300" />
                  )}
                  <div className="absolute inset-x-2 bottom-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold text-center truncate">
                    {p.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-navy-900 truncate">{p.name}</span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {p.certId || 'AUTO-ID'}
                    </span>
                  </div>

                  {p.fields?.score && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Score: {p.fields.score}
                    </div>
                  )}
                </div>
              </div>

              {hasIssue && (
                <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Validation Warning Flagged</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
