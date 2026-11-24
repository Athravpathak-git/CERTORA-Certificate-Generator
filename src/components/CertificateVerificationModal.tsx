import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  UploadCloud,
  FileCheck,
  Download,
  X,
  FileText,
  Info,
} from 'lucide-react';
import saveAs from 'file-saver';
import { Participant, VerificationManifest, VerificationRecord } from '../types';
import {
  buildVerificationManifest,
  exportManifestCsv,
  exportManifestJson,
  verifyCertificateLocally,
} from '../services/verificationService';
import { decodeQrFromImage } from '../services/qrService';

interface CertificateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  projectName?: string;
  initialCertId?: string;
}

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  isOpen,
  onClose,
  participants,
  projectName = 'Smart Certificate Project',
  initialCertId,
}) => {
  const [searchId, setSearchId] = useState(initialCertId || '');
  const [result, setResult] = useState<VerificationRecord | null>(null);
  const [importedManifest, setImportedManifest] = useState<VerificationManifest | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const manifestInputRef = useRef<HTMLInputElement>(null);

  // Active roster manifest
  const activeManifest = buildVerificationManifest(participants, projectName);
  const targetDataSource = importedManifest || activeManifest;

  useEffect(() => {
    if (isOpen && initialCertId) {
      setSearchId(initialCertId);
      const res = verifyCertificateLocally(initialCertId, targetDataSource);
      setResult(res);
    }
  }, [isOpen, initialCertId]);

  if (!isOpen) return null;

  const handleVerify = (idToLookup?: string) => {
    setScanError(null);
    const id = idToLookup || searchId;
    if (!id.trim()) return;

    const res = verifyCertificateLocally(id, targetDataSource);
    setResult(res);
  };

  // QR Image scan handler
  const handleQrImageUpload = (file: File) => {
    setScanError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const decoded = decodeQrFromImage(img);
        if (decoded.data) {
          // Extract CERT ID if payload contains prefix or structured string
          const raw = decoded.data.trim();
          let extractedId = raw;
          if (raw.includes(':')) {
            const parts = raw.split(':');
            extractedId = parts[parts.length - 1]; // last token or certId
          }
          setSearchId(extractedId);
          handleVerify(extractedId);
        } else {
          setScanError(decoded.error || 'Failed to detect QR code.');
        }
      };
      img.onerror = () => setScanError('Failed to read image file.');
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Import external manifest file
  const handleImportManifest = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.records)) {
        setImportedManifest(parsed as VerificationManifest);
        alert(`Loaded verification manifest with ${parsed.records.length} records.`);
      } else {
        alert('Invalid manifest JSON format.');
      }
    } catch (err: any) {
      alert('Failed to import manifest: ' + err.message);
    }
  };

  const handleDownloadManifestJson = () => {
    const blob = exportManifestJson(activeManifest);
    saveAs(blob, `${projectName.replace(/\s+/g, '_')}_manifest.json`);
  };

  const handleDownloadManifestCsv = () => {
    const blob = exportManifestCsv(activeManifest);
    saveAs(blob, `${projectName.replace(/\s+/g, '_')}_manifest.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">
                Certificate Verification Center
              </h3>
              <p className="text-xs text-slate-500">
                Local cryptographic & record verification for participant certificates
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
          {/* Important Client-Side Notice */}
          <div className="p-3.5 bg-brand-50/70 border border-brand-200/80 rounded-2xl text-xs text-brand-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Local Client-Side Verification:</strong> This verification tool checks Certificate IDs and QR code payloads directly against your active certificate roster ({participants.length} certificates) or imported verification manifests. No external server or cloud upload is used.
            </div>
          </div>

          {/* Search by Certificate ID Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Enter Certificate ID or Serial Number
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. CERT-2026-0001"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerify();
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerify()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                Verify ID
              </button>
            </div>
          </div>

          {/* QR Code Scan / Upload Option */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-800">Scan Certificate QR Code</div>
              <div className="text-slate-500 text-[11px]">
                Upload a certificate image or photographed QR code to decode and verify automatically.
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleQrImageUpload(e.target.files[0]);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-brand-600" />
              <span>Upload QR Image</span>
            </button>
          </div>

          {scanError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Verification Result Card */}
          {result && (
            <div className="animate-fadeIn space-y-4">
              <div
                className={`p-6 rounded-2xl border ${
                  result.status === 'valid'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {result.status === 'valid' ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        result.status === 'valid'
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {result.status === 'valid' ? 'Valid & Authentic Certificate' : 'Certificate Not Found'}
                    </span>
                    <h4 className="text-lg font-bold text-navy-900 mt-1">
                      {result.participantName}
                    </h4>
                  </div>
                </div>

                {result.status === 'valid' ? (
                  <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-emerald-200/60">
                    <div>
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">
                        Certificate ID
                      </span>
                      <span className="font-mono font-bold text-slate-800">{result.certId}</span>
                    </div>

                    <div>
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">
                        Issue Date
                      </span>
                      <span className="font-semibold text-slate-800">{result.issueDate}</span>
                    </div>

                    <div>
                      <span className="text-emerald-800 text-[10px] uppercase font-bold block">
                        Event / Course
                      </span>
                      <span className="font-semibold text-slate-800">{result.eventName}</span>
                    </div>

                    {result.achievement && (
                      <div>
                        <span className="text-emerald-800 text-[10px] uppercase font-bold block">
                          Achievement / Rank
                        </span>
                        <span className="font-semibold text-slate-800">
                          {result.achievement} {result.rank ? `(${result.rank})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-rose-700">
                    No certificate record found matching ID <code>"{result.certId}"</code> in the active roster or imported manifest.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Export Verification Manifest Tools */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-navy-900 uppercase tracking-wide">
                Offline Verification Manifest
              </div>
              <span className="text-[11px] text-slate-400">
                {targetDataSource.records.length} records available
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Export an audited verification database (JSON / CSV) that can be archived or used by employers/institutions for offline verification.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadManifestJson}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Manifest JSON</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadManifestCsv}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Manifest CSV</span>
              </button>

              <input
                ref={manifestInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImportManifest(e.target.files[0]);
                }}
              />

              <button
                type="button"
                onClick={() => manifestInputRef.current?.click()}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Import External Manifest</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
