import React, { useState, useEffect } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Cpu,
  Layers,
  CheckCircle,
  Sliders,
  Type,
  FileCheck,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import {
  CertificateField,
  CertificateTemplate,
  DateSettings,
  Participant,
  SignatureData,
} from '../../types';
import { formatDate } from '../../utils/formatters';
import { getFieldValue } from '../../services/pdfService';
import { generateQrCodeDataUrl } from '../../services/qrService';

interface Step7LivePreviewProps {
  template: CertificateTemplate | null;
  signature: SignatureData | null;
  fields: CertificateField[];
  participants: Participant[];
  dateSettings: DateSettings;
  onProceedToGenerate: () => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
  onOpenVerifyModal?: (certId: string) => void;
}

export const Step7LivePreview: React.FC<Step7LivePreviewProps> = ({
  template,
  signature,
  fields,
  participants,
  dateSettings,
  onProceedToGenerate,
  onBack,
  onGoToStep,
  onOpenVerifyModal,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [currentQrUrl, setCurrentQrUrl] = useState<string | null>(null);

  const activeParticipant: Participant =
    participants[currentIndex] || {
      id: 'demo',
      name: 'Atharva Pathak (अथर्व पाठक)',
      fields: { cert_id: 'CERT-2025-0001', achievement: 'Excellence in AI' },
      generatedFilename: 'Atharva_Pathak_CERT-2025-0001.pdf',
    };

  const formattedDate =
    dateSettings.mode === 'today'
      ? formatDate(new Date().toISOString(), dateSettings.format)
      : dateSettings.mode === 'custom'
      ? formatDate(dateSettings.customDate, dateSettings.format)
      : '';

  // Generate QR code for active participant
  useEffect(() => {
    let isMounted = true;
    const certId =
      activeParticipant.certId ||
      activeParticipant.fields?.cert_id ||
      `CERT-2025-${String(currentIndex + 1).padStart(4, '0')}`;

    generateQrCodeDataUrl(certId, { width: 160 })
      .then((url) => {
        if (isMounted) setCurrentQrUrl(url);
      })
      .catch((err) => console.error('Failed to generate preview QR:', err));

    return () => {
      isMounted = false;
    };
  }, [activeParticipant, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : participants.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < participants.length - 1 ? prev + 1 : 0));
  };

  const activeCertId =
    activeParticipant.certId ||
    activeParticipant.fields?.cert_id ||
    `CERT-2025-${String(currentIndex + 1).padStart(4, '0')}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 8 of 12 • Realistic Bulk Preview
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Live Certificate Realistic Preview & QR Inspection
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review participant placement, authentic typography, certificate IDs, and dynamic QR code verification.
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
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>Proceed to Batch Validation & Generate ({participants.length})</span>
          </button>
        </div>
      </div>

      {/* Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Participant Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
            title="Previous participant"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-navy-900 min-w-[120px] text-center">
            {participants.length > 0 ? (
              <>
                Participant {currentIndex + 1} of {participants.length}
              </>
            ) : (
              'Sample Participant'
            )}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
            title="Next participant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <select
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 max-w-[200px] truncate"
          >
            {participants.map((p, idx) => (
              <option key={p.id} value={idx}>
                {idx + 1}. {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Options & Zoom */}
        <div className="flex items-center gap-3">
          {/* Quick Verify QR Button */}
          {onOpenVerifyModal && (
            <button
              type="button"
              onClick={() => onOpenVerifyModal(activeCertId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors"
              title="Test QR code verification"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verify ID ({activeCertId})</span>
            </button>
          )}

          {/* Toggle positioning guidelines */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <span>Show Guides</span>
            <input
              type="checkbox"
              checked={showGuidelines}
              onChange={(e) => setShowGuidelines(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
            />
          </label>

          {/* Zoom buttons */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1.5 rounded text-slate-600 hover:bg-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono font-medium text-slate-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="p-1.5 rounded text-slate-600 hover:bg-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="bg-slate-200/70 rounded-2xl p-6 overflow-auto max-h-[750px] border border-slate-300/80 flex items-center justify-center">
        {template ? (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative select-none cert-canvas-shadow rounded-lg overflow-hidden bg-white max-w-full"
          >
            {/* Base Certificate Template Image */}
            <img
              src={template.previewImageUrl}
              alt="Base Certificate"
              className="w-full h-auto block pointer-events-none"
              style={{
                minWidth: '700px',
                maxWidth: '1000px',
              }}
            />

            {/* Overlaid Fields Preview Layer */}
            <div className="absolute inset-0 pointer-events-none">
              {fields.map((field) => {
                if (!field.enabled) return null;

                // Handle Signature
                if (field.type === 'signature') {
                  if (!signature) return null;
                  return (
                    <div
                      key={field.id}
                      style={{
                        left: `${field.xPercent}%`,
                        top: `${field.yPercent}%`,
                        width: `${field.widthPercent}%`,
                        height: `${field.heightPercent}%`,
                      }}
                      className={`absolute flex items-center justify-center ${
                        showGuidelines ? 'border border-dashed border-indigo-400 bg-indigo-50/20' : ''
                      }`}
                    >
                      <img
                        src={signature.dataUrl}
                        alt="Signature"
                        className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                      />
                    </div>
                  );
                }

                // Handle QR Code
                if (field.type === 'qr_code') {
                  return (
                    <div
                      key={field.id}
                      style={{
                        left: `${field.xPercent}%`,
                        top: `${field.yPercent}%`,
                        width: `${field.widthPercent}%`,
                        height: `${field.heightPercent}%`,
                      }}
                      className={`absolute flex items-center justify-center p-0.5 bg-white rounded shadow-xs ${
                        showGuidelines ? 'border border-dashed border-violet-400 bg-violet-50/20' : ''
                      }`}
                    >
                      {currentQrUrl ? (
                        <img
                          src={currentQrUrl}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[9px] text-slate-500 font-mono">
                          QR
                        </div>
                      )}
                    </div>
                  );
                }

                // Handle Text Fields (Name, Date, Cert ID, Custom)
                let text = getFieldValue(field, activeParticipant, formattedDate);
                if (!text) return null;

                if (field.transform === 'uppercase') {
                  text = text.toUpperCase();
                } else if (field.transform === 'capitalize') {
                  text = text
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ');
                }

                return (
                  <div
                    key={field.id}
                    style={{
                      left: `${field.xPercent}%`,
                      top: `${field.yPercent}%`,
                      width: `${field.widthPercent}%`,
                      height: `${field.heightPercent}%`,
                    }}
                    className={`absolute flex items-center ${
                      field.align === 'center'
                        ? 'justify-center text-center'
                        : field.align === 'right'
                        ? 'justify-end text-right'
                        : 'justify-start text-left'
                    } ${
                      showGuidelines
                        ? 'border border-dashed border-emerald-400 bg-emerald-50/20'
                        : ''
                    }`}
                  >
                    <span
                      style={{
                        fontFamily: `"${field.fontFamily}", "Noto Sans Devanagari", "Mukta", "Hind", sans-serif`,
                        fontSize: `${field.fontSize * 0.7}px`,
                        fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                        fontStyle: field.fontStyle,
                        color: field.color,
                        letterSpacing: `${field.letterSpacing}px`,
                        lineHeight: 1.1,
                      }}
                      className="w-full truncate px-1 transition-all"
                    >
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No template loaded.</p>
        )}
      </div>

      {/* Quick Edit Anchors */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <FileCheck className="w-4 h-4 text-brand-600" />
          <span>Need minor adjustments before generation?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Position Editor</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => onGoToStep(5)}
            className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Typography</span>
          </button>
        </div>
      </div>
    </div>
  );
};
