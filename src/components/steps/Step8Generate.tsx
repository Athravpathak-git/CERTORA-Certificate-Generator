import React, { useEffect, useState, useRef } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Download,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CertificateField,
  CertificateTemplate,
  DateSettings,
  Participant,
  SignatureData,
} from '../../types';
import { generateParticipantPdf } from '../../services/pdfService';
import { formatDate } from '../../utils/formatters';
import { sanitizeFilename } from '../../utils/fileSanitizer';

interface Step8GenerateProps {
  template: CertificateTemplate;
  signature: SignatureData | null;
  fields: CertificateField[];
  participants: Participant[];
  dateSettings: DateSettings;
  onUpdateParticipants: (participants: Participant[]) => void;
  onNext: () => void;
}

export const Step8Generate: React.FC<Step8GenerateProps> = ({
  template,
  signature,
  fields,
  participants,
  dateSettings,
  onUpdateParticipants,
  onNext,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [isDone, setIsDone] = useState(false);

  const abortRef = useRef(false);

  const formattedDate =
    dateSettings.mode === 'today'
      ? formatDate(new Date().toISOString(), dateSettings.format)
      : dateSettings.mode === 'custom'
      ? formatDate(dateSettings.customDate, dateSettings.format)
      : '';

  const total = participants.length;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const startGeneration = async () => {
    setIsRunning(true);
    abortRef.current = false;
    setCompletedCount(0);
    setErrorCount(0);
    setIsDone(false);

    // Track filenames to avoid collisions
    const usedFilenames = new Set<string>();
    const updated = [...participants];

    for (let i = 0; i < updated.length; i++) {
      if (abortRef.current) break;

      const p = updated[i];
      setCurrentIndex(i + 1);
      setCurrentName(p.name);

      // Determine unique sanitized filename with CertID
      const certId =
        p.certId ||
        p.fields?.cert_id ||
        `CERT-2025-${String(i + 1).padStart(4, '0')}`;
      if (!p.certId) p.certId = certId;
      if (!p.fields) p.fields = {};
      if (!p.fields.cert_id) p.fields.cert_id = certId;

      const filename = sanitizeFilename(p.name, usedFilenames, certId);
      p.generatedFilename = filename;

      try {
        // Yield to browser event loop
        await new Promise((resolve) => setTimeout(resolve, 15));

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
        console.error(`Failed to generate for ${p.name}:`, err);
        p.status = 'error';
        p.error = err?.message || 'Generation failed';
        setErrorCount((e) => e + 1);
      }

      onUpdateParticipants([...updated]);
    }

    setIsRunning(false);
    setIsDone(true);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsRunning(false);
  };

  useEffect(() => {
    // Check if already generated or needs auto-start
    const allReady = participants.length > 0 && participants.every((p) => p.status === 'ready');
    if (allReady) {
      setCompletedCount(participants.length);
      setIsDone(true);
    } else {
      startGeneration();
    }
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto py-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
          Step 10 of 12 • Batch Generation
        </span>
        <h2 className="text-3xl font-extrabold text-navy-900">
          {isDone
            ? 'Bulk Certificate Generation Complete!'
            : 'Generating Individual Certificates...'}
        </h2>
        <p className="text-sm text-slate-500">
          Client-side vector injection, Marathi Unicode font rasterization, QR codes, and digital signature placement.
        </p>
      </div>

      {/* Main Progress Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-premium space-y-6">
        {/* Progress Percent & Stats */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-4xl font-extrabold text-navy-900 font-mono">
              {percentage}%
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-1">
              {completedCount} of {total} certificates generated
            </div>
          </div>

          <div className="text-right">
            {isRunning ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Compiling in browser...</span>
              </span>
            ) : isDone ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ready for Download</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                <span>Paused</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            style={{ width: `${percentage}%` }}
            className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 rounded-full transition-all duration-150 ease-out shadow-sm"
          />
        </div>

        {/* Currently Generating Indicator */}
        {isRunning && currentName && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></span>
              <span>Currently processing:</span>
            </span>
            <span className="font-bold text-navy-900 truncate max-w-xs">{currentName}</span>
          </div>
        )}

        {/* Error notification if any failed */}
        {errorCount > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {errorCount} certificate(s) encountered an issue. You can review details in the gallery.
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {isRunning ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Pause Generation
            </button>
          ) : (
            <button
              type="button"
              onClick={startGeneration}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isDone ? 'Regenerate Entire Batch' : 'Resume Generation'}</span>
            </button>
          )}

          {isDone && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
            >
              <span>View Gallery & Download All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Security and privacy reassurance */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>100% Client-Side generation. No files or participant records leave your computer.</span>
      </div>
    </div>
  );
};
