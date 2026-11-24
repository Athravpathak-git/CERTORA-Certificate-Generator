import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Archive,
  Download,
  Files,
  Search,
  Eye,
  FileCheck,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import saveAs from 'file-saver';
import {
  CertificateField,
  CertificateTemplate,
  DateSettings,
  Participant,
  SignatureData,
  ValidationIssue,
} from '../../types';
import { generateParticipantPdf, generateCombinedPdf } from '../../services/pdfService';
import { formatDate } from '../../utils/formatters';
import { sanitizeFilename } from '../../utils/fileSanitizer';
import {
  downloadCertificatesAsZip,
  downloadSingleCertificate,
  downloadCombinedCertificatePdf,
} from '../../services/zipService';
import {
  buildVerificationManifest,
  exportManifestCsv,
  exportManifestJson,
} from '../../services/verificationService';
import { validateCertificateBatch } from '../../services/validationService';
import { PdfPreviewModal } from '../PdfPreviewModal';

interface GenerationViewProps {
  template: CertificateTemplate | null;
  signature: SignatureData | null;
  fields: CertificateField[];
  participants: Participant[];
  dateSettings: DateSettings;
  onUpdateParticipants: (participants: Participant[]) => void;
  onNavigateToEditor: () => void;
}

export const GenerationView: React.FC<GenerationViewProps> = ({
  template,
  signature,
  fields,
  participants,
  dateSettings,
  onUpdateParticipants,
  onNavigateToEditor,
}) => {
  const [activeStage, setActiveStage] = useState<'validation' | 'generation' | 'gallery'>('generation');
  const [isRunning, setIsRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForPreview, setSelectedForPreview] = useState<Participant | null>(null);

  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [isCombiningPdf, setIsCombiningPdf] = useState(false);

  const formattedDate =
    dateSettings.mode === 'today'
      ? formatDate(new Date().toISOString(), dateSettings.format)
      : dateSettings.mode === 'custom'
      ? formatDate(dateSettings.customDate, dateSettings.format)
      : '';

  // Validation issues
  const validationIssues = validateCertificateBatch(participants, fields);
  const validationErrors = validationIssues.filter((i) => i.type === 'error');
  const validationWarnings = validationIssues.filter((i) => i.type === 'warning');

  const readyParticipants = participants.filter((p) => p.pdfBlob);
  const total = participants.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Start Bulk Generation
  const handleStartGeneration = async () => {
    if (!template) {
      alert('Please upload or select a certificate template first.');
      return;
    }
    if (participants.length === 0) {
      alert('Please add at least one participant.');
      return;
    }

    setIsRunning(true);
    setCompletedCount(0);
    setErrorCount(0);
    const usedFilenames = new Set<string>();
    const updated = [...participants];

    for (let i = 0; i < updated.length; i++) {
      const p = updated[i];
      setCurrentName(p.name);

      const certIdField = fields.find((f) => f.type === 'cert_id' && f.enabled);
      const filename = sanitizeFilename(
        p.name,
        usedFilenames,
        certIdField ? p.certId || p.fields?.cert_id : undefined
      );
      p.generatedFilename = filename;

      try {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const blob = await generateParticipantPdf(
          template,
          signature,
          fields,
          p,
          formattedDate
        );
        p.pdfBlob = blob;
        p.pdfUrl = URL.createObjectURL(blob);
        p.status = 'ready';
        p.error = undefined;
        setCompletedCount((c) => c + 1);
      } catch (err: any) {
        console.error(`Failed generation for ${p.name}:`, err);
        p.status = 'error';
        p.error = err?.message || 'Generation failed';
        setErrorCount((e) => e + 1);
      }

      onUpdateParticipants([...updated]);
    }

    setIsRunning(false);
    setActiveStage('gallery');

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}
  };

  // Download All as ZIP (including verification manifests)
  const handleDownloadAllZip = async () => {
    if (readyParticipants.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const manifest = buildVerificationManifest(
        readyParticipants,
        template?.name || 'Certificate_Template'
      );

      await downloadCertificatesAsZip(
        readyParticipants,
        'Athrav_Smart_Certificates_Batch.zip',
        manifest,
        (pct) => setZipProgress(pct)
      );
    } catch (err: any) {
      alert('Error creating ZIP archive: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  // Download Combined Multi-Page PDF
  const handleDownloadCombinedPdf = async () => {
    if (!template || readyParticipants.length === 0) return;
    setIsCombiningPdf(true);
    try {
      const combinedBlob = await generateCombinedPdf(
        template,
        signature || null,
        fields,
        readyParticipants,
        formattedDate
      );
      downloadCombinedCertificatePdf(
        combinedBlob,
        `${template.name.replace(/\.[^/.]+$/, '')}_Consolidated_All.pdf`
      );
    } catch (err: any) {
      alert('Failed to compile combined PDF: ' + err.message);
    } finally {
      setIsCombiningPdf(false);
    }
  };

  // Export Manifests
  const handleExportJson = () => {
    const manifest = buildVerificationManifest(readyParticipants, template?.name || 'Certificate_Batch');
    saveAs(exportManifestJson(manifest), 'verification_manifest.json');
  };

  const handleExportCsv = () => {
    const manifest = buildVerificationManifest(readyParticipants, template?.name || 'Certificate_Batch');
    saveAs(exportManifestCsv(manifest), 'verification_manifest.csv');
  };

  const filteredParticipants = readyParticipants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stage Selector Header */}
      <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-gold-dark bg-gold/15 px-2.5 py-1 rounded-md border border-gold/30">
            Bulk PDF Compiler
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#182536] mt-2">
            Generate &amp; Download Certificates
          </h2>
          <p className="text-xs text-[#77818C] mt-1">
            Compile all participant certificates in high-resolution vector PDF format, ready for single download or 1-click ZIP export.
          </p>
        </div>

        {/* Stage Tabs */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E5DD]">
          <button
            type="button"
            onClick={() => setActiveStage('validation')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeStage === 'validation'
                ? 'bg-white text-[#182536] shadow-xs'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            Validation ({validationIssues.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('generation')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeStage === 'generation'
                ? 'bg-white text-[#182536] shadow-xs'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            Generate
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('gallery')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              activeStage === 'gallery'
                ? 'bg-white text-[#182536] shadow-xs'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            Gallery ({readyParticipants.length})
          </button>
        </div>
      </div>

      {/* STAGE 1: Pre-Flight Validation */}
      {activeStage === 'validation' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-4 shadow-xs">
              <div className="text-xs font-bold uppercase text-[#77818C]">Errors (Blockers)</div>
              <div className="text-2xl font-bold font-mono text-status-error mt-1">{validationErrors.length}</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-4 shadow-xs">
              <div className="text-xs font-bold uppercase text-[#77818C]">Warnings (Non-blocking)</div>
              <div className="text-2xl font-bold font-mono text-status-warning mt-1">{validationWarnings.length}</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-4 shadow-xs">
              <div className="text-xs font-bold uppercase text-[#77818C]">Ready to Generate</div>
              <div className="text-2xl font-bold font-mono text-status-success mt-1">{participants.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#182536]">
              Pre-Flight Issue Log
            </h4>
            {validationIssues.length > 0 ? (
              <div className="space-y-2">
                {validationIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      issue.type === 'error'
                        ? 'bg-status-error/10 border-status-error/30 text-status-error'
                        : 'bg-status-warning/10 border-status-warning/30 text-[#182536]'
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      issue.type === 'error' ? 'text-status-error' : 'text-status-warning'
                    }`} />
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[10px] mr-2">
                        [{issue.type}]
                      </span>
                      <span>{issue.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-[#77818C]">
                <CheckCircle2 className="w-8 h-8 mx-auto text-status-success mb-2" />
                <p className="text-xs font-bold text-[#182536]">Zero Issues Detected</p>
                <p className="text-[11px] text-[#77818C] mt-0.5">
                  All participant records and element bounds meet print quality standards.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: Parallel Batch Generation */}
      {activeStage === 'generation' && (
        <div className="space-y-6">
          {/* Section 12: Summary Cards (Total, Successful, Failed) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs text-center">
              <div className="text-xs font-bold text-[#77818C] uppercase">Total Certificates</div>
              <div className="text-3xl font-bold font-mono text-[#182536] mt-1">{total}</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs text-center">
              <div className="text-xs font-bold text-status-success uppercase">Successful</div>
              <div className="text-3xl font-bold font-mono text-status-success mt-1">{completedCount || readyParticipants.length}</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs text-center">
              <div className="text-xs font-bold text-status-error uppercase">Failed</div>
              <div className="text-3xl font-bold font-mono text-status-error mt-1">{errorCount}</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8E5DD] p-8 space-y-6 max-w-2xl mx-auto text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-gold/10 text-gold flex items-center justify-center mx-auto">
              <Cpu className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#182536]">
                {isRunning
                  ? 'Compiling Certificates in Browser...'
                  : readyParticipants.length > 0
                  ? `${readyParticipants.length} Certificates Generated`
                  : 'Ready to Generate Batch'}
              </h3>
              <p className="text-xs text-[#77818C]">
                100% Client-side vector compilation with TrueType font embedding and QR codes.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#77818C]">{completedCount} of {total} generated</span>
                <span className="font-bold text-gold-dark">{percentage}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#FAF8F5] border border-[#E8E5DD] overflow-hidden">
                <div
                  style={{ width: `${percentage}%` }}
                  className="h-full bg-gold transition-all duration-150 ease-out"
                />
              </div>
            </div>

            {isRunning && currentName && (
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-xs text-[#77818C]">
                Processing: <span className="font-bold text-[#182536]">{currentName}</span>
              </div>
            )}

            {/* Action Trigger */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={isRunning || participants.length === 0}
                onClick={handleStartGeneration}
                className="btn-gold px-8 py-3 text-sm font-bold shadow-xs disabled:opacity-50"
              >
                <Cpu className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {readyParticipants.length > 0
                    ? `Regenerate All (${participants.length} Certificates)`
                    : `Generate All (${participants.length} Certificates)`}
                </span>
              </button>

              {readyParticipants.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="btn-midnight px-6 py-3 text-sm font-bold shadow-xs"
                >
                  <Archive className="w-4 h-4" />
                  <span>DOWNLOAD ALL AS ZIP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: Download & Gallery */}
      {activeStage === 'gallery' && (
        <div className="space-y-6">
          {/* Top Consolidated Action Banner */}
          <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-status-success flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bulk Compilation Complete</span>
              </span>
              <h3 className="text-xl font-bold text-[#182536]">
                {readyParticipants.length} Personalized Certificates Ready
              </h3>
              <p className="text-xs text-[#77818C]">
                Download individual PDFs, consolidated ZIP archive with verification manifests, or combined multi-page PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping || readyParticipants.length === 0}
                className="btn-gold py-2.5 px-5 text-xs font-bold shadow-xs flex items-center gap-2"
              >
                <Archive className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isZipping ? `Archiving (${zipProgress}%)` : `DOWNLOAD ALL AS ZIP`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCombinedPdf}
                disabled={isCombiningPdf || readyParticipants.length === 0}
                className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
                title="Combine all certificates into one multi-page PDF"
              >
                <Files className="w-4 h-4 text-gold" />
                <span>{isCombiningPdf ? 'Combining...' : 'Combined PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5"
                title="Export verification manifest JSON"
              >
                <FileText className="w-3.5 h-3.5 text-gold" />
                <span>Manifest (.JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5"
                title="Export verification manifest CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-status-success" />
                <span>Manifest (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-3 flex items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77818C]" />
              <input
                type="text"
                placeholder="Search participant certificate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-clean w-full pl-9 py-1.5 text-xs"
              />
            </div>
            <div className="text-xs font-mono text-[#77818C]">
              Showing {filteredParticipants.length} of {readyParticipants.length}
            </div>
          </div>

          {/* Clean List / Table of Generated Certificates (Section 12: Name, Preview, Download PDF) */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E5DD] text-[#77818C] font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Participant Name</th>
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DD]">
                {filteredParticipants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-[#77818C] text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#182536]">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#77818C] text-[11px]">
                      {p.certId || p.fields?.cert_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedForPreview(p)}
                          className="btn-secondary py-1 px-3 text-xs font-semibold flex items-center gap-1"
                          title="Preview Certificate"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadSingleCertificate(p)}
                          className="btn-midnight py-1 px-3 text-xs font-bold flex items-center gap-1"
                          title="Download individual PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Modal Viewer */}
      {selectedForPreview && (
        <PdfPreviewModal
          participant={selectedForPreview}
          onClose={() => setSelectedForPreview(null)}
        />
      )}
    </div>
  );
};
