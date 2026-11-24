import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  UploadCloud,
  FileCheck,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Info,
  QrCode,
} from 'lucide-react';
import saveAs from 'file-saver';
import { Participant, VerificationManifest, VerificationRecord } from '../../types';
import {
  buildVerificationManifest,
  exportManifestCsv,
  exportManifestJson,
  verifyCertificateLocally,
} from '../../services/verificationService';
import { decodeQrFromImage } from '../../services/qrService';

interface VerificationViewProps {
  participants: Participant[];
  projectName?: string;
  initialCertId?: string;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  participants,
  projectName = 'CERTORA Batch',
  initialCertId,
}) => {
  const [searchId, setSearchId] = useState(initialCertId || '');
  const [result, setResult] = useState<VerificationRecord | null>(null);
  const [importedManifest, setImportedManifest] = useState<VerificationManifest | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const manifestInputRef = useRef<HTMLInputElement>(null);

  const activeManifest = buildVerificationManifest(participants, projectName);
  const targetDataSource = importedManifest || activeManifest;

  const handleVerify = (idToLookup?: string) => {
    setScanError(null);
    const id = (idToLookup || searchId).trim();
    if (!id) return;

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
          let certId = decoded.data;
          if (certId.includes('id=')) {
            const match = certId.match(/id=([^&]+)/);
            if (match) certId = decodeURIComponent(match[1]);
          }
          setSearchId(certId);
          handleVerify(certId);
        } else {
          setScanError(decoded.error || 'No readable QR code found in this image.');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImportManifest = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as VerificationManifest;
      if (!parsed.records || !Array.isArray(parsed.records)) {
        throw new Error('Invalid verification manifest structure.');
      }
      setImportedManifest(parsed);
      alert(`Loaded manifest with ${parsed.records.length} certificate records.`);
    } catch (err: any) {
      alert('Failed to import manifest: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Title Bar */}
      <div className="border-b border-midnight-border pb-5">
        <span className="text-xs font-bold tracking-wider uppercase text-gold bg-gold/15 px-2.5 py-1 rounded-md border border-gold/30">
          Honest Technical Verification
        </span>
        <h2 className="text-2xl font-bold text-ivory mt-2">
          Certificate Verification Hub &amp; Scanner
        </h2>
        <p className="text-sm text-ivory-secondary mt-1">
          Verify authenticity of issued certificates using cryptographic Certificate IDs or by scanning printed QR codes.
        </p>
      </div>

      {/* Honest Verification Advisory Box */}
      <div className="card-luxury p-4 bg-midnight-deep border-gold/30 flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-gold">Honest Verification Architecture</div>
          <p className="text-ivory-secondary">
            Because this application operates 100% client-side without a mandatory external server, verification checks are executed against the locally available roster or an imported <code>verification_manifest.json</code> audit file.
          </p>
        </div>
      </div>

      {/* Verification Query Controls */}
      <div className="card-luxury p-6 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ivory flex items-center gap-2">
          <Search className="w-4 h-4 text-gold" />
          <span>Lookup Certificate Record</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerify();
            }}
            placeholder="Enter Certificate ID (e.g. ATH-2026-0001)..."
            className="input-luxury flex-1 text-xs w-full font-mono uppercase"
          />

          <button
            type="button"
            onClick={() => handleVerify()}
            className="btn-gold py-2.5 px-6 text-xs w-full sm:w-auto"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Verify ID</span>
          </button>

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
            className="btn-outline py-2.5 px-4 text-xs w-full sm:w-auto whitespace-nowrap"
            title="Scan printed QR code image"
          >
            <QrCode className="w-4 h-4 text-gold" />
            <span>Scan QR Image</span>
          </button>
        </div>

        {scanError && (
          <div className="p-3 rounded-xl bg-status-error/15 border border-status-error/30 text-status-error text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Data Source Selector */}
        <div className="pt-3 border-t border-midnight-border flex flex-wrap items-center justify-between gap-3 text-xs text-ivory-secondary">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ivory">Active Database:</span>
            <span className="px-2 py-0.5 rounded bg-midnight border border-midnight-border font-mono text-gold">
              {importedManifest
                ? `Imported Manifest (${importedManifest.records.length} records)`
                : `Active Studio Roster (${participants.length} records)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={manifestInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImportManifest(e.target.files[0]);
              }}
            />
            <button
              type="button"
              onClick={() => manifestInputRef.current?.click()}
              className="text-gold hover:underline font-semibold flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import External Manifest (.JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div
          className={`card-luxury p-6 border transition-all ${
            result.status === 'valid'
              ? 'border-status-success bg-gradient-to-br from-midnight via-midnight-card to-midnight-deep'
              : 'border-status-error bg-status-error/10'
          }`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-midnight-border pb-4">
            <div className="flex items-center gap-3">
              {result.status === 'valid' ? (
                <div className="w-12 h-12 rounded-2xl bg-status-success/20 border border-status-success/40 flex items-center justify-center text-status-success">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-status-error/20 border border-status-error/40 flex items-center justify-center text-status-error">
                  <XCircle className="w-7 h-7" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-ivory">
                    {result.status === 'valid' ? 'Authentic Certificate Verified' : 'Certificate Record Not Found'}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      result.status === 'valid'
                        ? 'bg-status-success/20 text-status-success border border-status-success/40'
                        : 'bg-status-error/20 text-status-error border border-status-error/40'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                <div className="text-xs text-ivory-secondary font-mono mt-0.5">
                  Query ID: {result.certId}
                </div>
              </div>
            </div>
          </div>

          {result.status === 'valid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
                <span className="text-[10px] text-ivory-secondary uppercase block">
                  Participant Full Name
                </span>
                <span className="font-bold text-ivory text-sm mt-0.5 block">
                  {result.participantName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
                <span className="text-[10px] text-ivory-secondary uppercase block">
                  Event / Organization
                </span>
                <span className="font-bold text-ivory text-sm mt-0.5 block">
                  {result.eventName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
                <span className="text-[10px] text-ivory-secondary uppercase block">
                  Date of Issue
                </span>
                <span className="font-bold text-ivory text-sm mt-0.5 block">
                  {result.issueDate}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
                <span className="text-[10px] text-ivory-secondary uppercase block">
                  Achievement / Honor
                </span>
                <span className="font-bold text-gold text-sm mt-0.5 block">
                  {result.achievement || 'Official Certificate of Excellence'}
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-4 text-xs text-ivory-secondary space-y-1">
              <p>
                No matching certificate was found for ID <strong className="text-ivory font-mono">"{result.certId}"</strong> in the current verification manifest.
              </p>
              <p className="text-[11px] text-ivory-secondary/70">
                Please double-check the entered serial characters or import the original batch manifest file.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
