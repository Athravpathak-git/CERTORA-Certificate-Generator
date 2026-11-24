import React, { useState } from 'react';
import {
  Download,
  Eye,
  FileCheck,
  Search,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Files,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import saveAs from 'file-saver';
import {
  CertificateField,
  CertificateTemplate,
  DateSettings,
  Participant,
  SignatureData,
} from '../../types';
import {
  downloadCertificatesAsZip,
  downloadSingleCertificate,
  downloadCombinedCertificatePdf,
} from '../../services/zipService';
import { generateCombinedPdf } from '../../services/pdfService';
import {
  buildVerificationManifest,
  exportManifestCsv,
  exportManifestJson,
} from '../../services/verificationService';
import { formatDate } from '../../utils/formatters';
import { PdfPreviewModal } from '../PdfPreviewModal';

interface Step9GalleryProps {
  participants: Participant[];
  template?: CertificateTemplate | null;
  signature?: SignatureData | null;
  fields?: CertificateField[];
  dateSettings?: DateSettings;
  templatePreviewUrl?: string;
  onStartNewBatch: () => void;
  onOpenVerifyModal?: (certId?: string) => void;
}

export const Step9Gallery: React.FC<Step9GalleryProps> = ({
  participants,
  template,
  signature,
  fields = [],
  dateSettings,
  templatePreviewUrl,
  onStartNewBatch,
  onOpenVerifyModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipantForPreview, setSelectedParticipantForPreview] =
    useState<Participant | null>(null);

  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatusText, setZipStatusText] = useState('');

  const [isCombiningPdf, setIsCombiningPdf] = useState(false);

  const readyParticipants = participants.filter((p) => p.pdfBlob);
  const filteredParticipants = readyParticipants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formattedDate = dateSettings
    ? dateSettings.mode === 'today'
      ? formatDate(new Date().toISOString(), dateSettings.format)
      : dateSettings.mode === 'custom'
      ? formatDate(dateSettings.customDate, dateSettings.format)
      : ''
    : '';

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
        'Smart_Certificates_Batch.zip',
        manifest,
        (pct, file) => {
          setZipProgress(pct);
          setZipStatusText(`Packaging ${file}...`);
        }
      );
    } catch (err: any) {
      alert('Error creating ZIP archive: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  // Generate & Download Combined Multi-Page PDF
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
      downloadCombinedCertificatePdf(combinedBlob, `${template.name.replace(/\.[^/.]+$/, '')}_All_Combined.pdf`);
    } catch (err: any) {
      alert('Failed to create combined PDF: ' + err.message);
    } finally {
      setIsCombiningPdf(false);
    }
  };

  // Export Verification Manifest (JSON)
  const handleExportManifestJson = () => {
    const manifest = buildVerificationManifest(
      readyParticipants,
      template?.name || 'Certificate_Template'
    );
    const blob = exportManifestJson(manifest);
    saveAs(blob, 'verification_manifest.json');
  };

  // Export Verification Manifest (CSV)
  const handleExportManifestCsv = () => {
    const manifest = buildVerificationManifest(
      readyParticipants,
      template?.name || 'Certificate_Template'
    );
    const blob = exportManifestCsv(manifest);
    saveAs(blob, 'verification_manifest.csv');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Primary Download Options */}
      <div className="rounded-3xl p-8 bg-gradient-to-tr from-brand-900 via-indigo-900 to-navy-950 text-white shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold tracking-wide uppercase border border-emerald-400/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Step 11 of 12 • Download & Print Center</span>
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {readyParticipants.length} Personalized Certificates Ready
            </h2>
            <p className="text-sm text-indigo-200">
              All participant certificates are compiled with vector typography, QR codes, and digital signatures. Download individual PDFs, full batch ZIP with verification manifest, or combined print-ready PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Download All ZIP */}
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping || readyParticipants.length === 0}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-400/20 active:scale-95 transition-all"
            >
              <Archive className="w-5 h-5" />
              <span>
                {isZipping
                  ? `Archiving ZIP (${zipProgress}%)`
                  : `Download All as ZIP (${readyParticipants.length} PDFs)`}
              </span>
            </button>

            {/* Combined PDF Button */}
            {template && (
              <button
                type="button"
                onClick={handleDownloadCombinedPdf}
                disabled={isCombiningPdf || readyParticipants.length === 0}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all shadow-sm active:scale-95"
                title="Combine all certificates into one single multi-page PDF"
              >
                <Files className="w-4 h-4 text-indigo-300" />
                <span>
                  {isCombiningPdf ? 'Combining Multi-Page PDF...' : 'Download Combined PDF'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartNewBatch}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Batch</span>
            </button>
          </div>
        </div>

        {/* Live ZIP Packaging Progress Bar */}
        {isZipping && (
          <div className="mt-6 pt-5 border-t border-white/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-indigo-200">
              <span>{zipStatusText}</span>
              <span>{zipProgress}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                style={{ width: `${zipProgress}%` }}
                className="h-full bg-amber-400 rounded-full transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Manifest & Verification Quick Bar */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span className="font-bold">Certificate Verification & Manifest Exports:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportManifestJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            <span>Export Manifest (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleExportManifestCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Manifest (.CSV)</span>
          </button>

          {onOpenVerifyModal && (
            <button
              type="button"
              onClick={() => onOpenVerifyModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-emerald-800 font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Open Local Verification Center</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search participant certificates by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
          <span>Showing</span>
          <span className="font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded font-bold">
            {filteredParticipants.length}
          </span>
          <span>of {readyParticipants.length} generated</span>
        </div>
      </div>

      {/* Certificate Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredParticipants.map((participant) => (
          <div
            key={participant.id}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-brand-400 shadow-subtle hover:shadow-premium transition-all overflow-hidden flex flex-col"
          >
            {/* Thumbnail Canvas Frame */}
            <div
              onClick={() => setSelectedParticipantForPreview(participant)}
              className="cursor-pointer relative aspect-[16/10] bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100 group-hover:bg-slate-50 transition-colors p-2"
            >
              {templatePreviewUrl ? (
                <div className="relative w-full h-full rounded overflow-hidden shadow-sm flex items-center justify-center">
                  <img
                    src={templatePreviewUrl}
                    alt={participant.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  {/* Subtle participant name overlay tag in thumbnail */}
                  <div className="absolute inset-x-2 bottom-2 px-2 py-1 rounded bg-black/75 backdrop-blur-sm text-white text-[11px] font-bold text-center truncate">
                    {participant.name}
                  </div>
                </div>
              ) : (
                <FileCheck className="w-10 h-10 text-brand-600/40" />
              )}

              {/* Hover overlay hint */}
              <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                <Eye className="w-4 h-4" />
                <span>Click to Preview PDF</span>
              </div>
            </div>

            {/* Card Content & Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-navy-900 truncate">
                    {participant.name}
                  </h4>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Ready</span>
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                  {participant.generatedFilename}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedParticipantForPreview(participant)}
                  className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadSingleCertificate(participant)}
                  className="py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredParticipants.length === 0 && (
        <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No participants found matching "{searchQuery}"</p>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedParticipantForPreview && (
        <PdfPreviewModal
          participant={selectedParticipantForPreview}
          onClose={() => setSelectedParticipantForPreview(null)}
        />
      )}
    </div>
  );
};
