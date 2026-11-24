import React, { useRef, useState } from 'react';
import {
  PenTool,
  CheckCircle,
  Trash2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Sliders,
  Layers,
  Wand2,
} from 'lucide-react';
import { SignatureData } from '../../types';
import { loadSignatureFile } from '../../services/pdfService';
import {
  removeSignatureBackground,
  DEFAULT_SIGNATURE_OPTIONS,
} from '../../services/signatureRemover';
import {
  generateSamplePaperSignature,
  generateSampleSignatureImage,
} from '../../constants/sampleData';
import { SignatureBrushEditor } from '../SignatureBrushEditor';

interface Step2UploadSignatureProps {
  signature: SignatureData | null;
  onSignatureLoaded: (sig: SignatureData | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2UploadSignature: React.FC<Step2UploadSignatureProps> = ({
  signature,
  onSignatureLoaded,
  onNext,
  onBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload handler - automatically removes background immediately!
  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (PNG, JPG, or JPEG).');
      }
      const loaded = await loadSignatureFile(file);
      onSignatureLoaded(loaded);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to process signature image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Test Presets for QA verification (Black on White, Blue Pen, Cream Paper, Grey Photo, Thin Strokes)
  const handleLoadTestPreset = async (
    testCase:
      | 'black_on_white'
      | 'blue_on_white'
      | 'dark_on_cream'
      | 'photo_grey'
      | 'thin_strokes'
  ) => {
    setError(null);
    setIsProcessing(true);
    try {
      const sample = generateSamplePaperSignature(testCase);
      // Run automatic background removal on the paper signature
      const result = await removeSignatureBackground(sample.dataUrl);

      onSignatureLoaded({
        id: `sig-preset-${Date.now()}`,
        name: `${sample.label.replace(/\s+/g, '_')}.png`,
        dataUrl: result.transparentDataUrl,
        originalDataUrl: sample.dataUrl,
        format: 'png',
        width: result.width,
        height: result.height,
        aspectRatio: result.aspectRatio,
        isBackgroundRemoved: true,
        detectedPaperColor: result.detectedPaperColor,
        settings: {
          threshold: DEFAULT_SIGNATURE_OPTIONS.threshold,
          smoothness: DEFAULT_SIGNATURE_OPTIONS.smoothness,
          contrastBoost: DEFAULT_SIGNATURE_OPTIONS.contrastBoost,
          removeHalo: DEFAULT_SIGNATURE_OPTIONS.removeHalo,
        },
      });
    } catch (err: any) {
      setError('Failed to process preset: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Clean Vector Sample
  const handleLoadCleanSample = () => {
    const sample = generateSampleSignatureImage('executive');
    onSignatureLoaded({
      id: `sample-sig-${Date.now()}`,
      name: 'Executive_Signature.png',
      dataUrl: sample.dataUrl,
      originalDataUrl: sample.dataUrl,
      format: 'png',
      width: sample.width,
      height: sample.height,
      aspectRatio: sample.width / sample.height,
      isBackgroundRemoved: true,
      detectedPaperColor: { r: 255, g: 255, b: 255, name: 'Transparent' },
    });
  };

  // Restore raw uploaded original image
  const handleRestoreOriginal = () => {
    if (!signature || !signature.originalDataUrl) return;
    onSignatureLoaded({
      ...signature,
      dataUrl: signature.originalDataUrl,
      isBackgroundRemoved: false,
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 2 of 9
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Upload Signature & Automatic Background Remover
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload a signed paper photograph or scan. The AI engine automatically removes paper backgrounds (white, cream, grey) while preserving authentic ink strokes.
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
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <span>Continue to Field Positions</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Section */}
      <div className="space-y-6">
        {/* Upload Zone & Quick Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-brand-400 bg-white hover:bg-slate-50/50'
              } shadow-sm`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
                <Wand2 className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-navy-900">
                Drop your Signature Image here
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                PNG, JPG, or photographed phone image.{' '}
                <span className="text-brand-600 font-semibold underline underline-offset-2">
                  Browse files
                </span>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 text-[11px] text-slate-400 font-medium">
                <span className="px-2 py-0.5 bg-slate-100 rounded">Auto-Background Removal</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">White/Cream/Grey Paper</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">Anti-Aliased Edges</span>
              </div>

              {isProcessing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                  <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs font-bold text-navy-900">
                    Automatically detecting & removing background...
                  </p>
                  <p className="text-[11px] text-slate-400">Preserving ink color & strokes</p>
                </div>
              )}
            </div>

            {/* Test Case Scenarios (Section 7 QA requirement) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Real-World Test Presets (1-Click Verification)</span>
                </div>
                <span className="text-[11px] text-slate-400">Simulates scanned paper</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleLoadTestPreset('black_on_white')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-slate-50 text-left transition-all"
                >
                  <div className="w-full h-8 rounded bg-white border border-slate-300 flex items-center justify-center mb-1 text-[10px] font-serif font-bold text-black">
                    ✒️ Black Ink
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">White Paper</div>
                  <div className="text-[10px] text-slate-400">Standard print</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadTestPreset('blue_on_white')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-slate-50 text-left transition-all"
                >
                  <div className="w-full h-8 rounded bg-white border border-slate-300 flex items-center justify-center mb-1 text-[10px] font-serif font-bold text-blue-700">
                    ✒️ Blue Pen
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">Blue on White</div>
                  <div className="text-[10px] text-slate-400">Ballpoint ink</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadTestPreset('dark_on_cream')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-slate-50 text-left transition-all"
                >
                  <div className="w-full h-8 rounded bg-[#FBF5E6] border border-amber-300 flex items-center justify-center mb-1 text-[10px] font-serif font-bold text-stone-900">
                    ✒️ Dark Ink
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">Cream / Parchment</div>
                  <div className="text-[10px] text-slate-400">Warm paper</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadTestPreset('photo_grey')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-slate-50 text-left transition-all"
                >
                  <div className="w-full h-8 rounded bg-[#EAECEF] border border-slate-300 flex items-center justify-center mb-1 text-[10px] font-serif font-bold text-slate-900">
                    📷 Phone Photo
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">Grey Shadowed</div>
                  <div className="text-[10px] text-slate-400">Camera lighting</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoadTestPreset('thin_strokes')}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-slate-50 text-left transition-all"
                >
                  <div className="w-full h-8 rounded bg-white border border-slate-300 flex items-center justify-center mb-1 text-[10px] font-serif font-medium text-indigo-900">
                    ~ Fine Cursive ~
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">Thin Delicate</div>
                  <div className="text-[10px] text-slate-400">Stroke preservation</div>
                </button>

                <button
                  type="button"
                  onClick={handleLoadCleanSample}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-slate-50 text-left transition-all"
                >
                  <div className="w-full h-8 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center mb-1 text-[10px] font-serif font-bold text-emerald-800">
                    ✨ Clean Vector
                  </div>
                  <div className="font-semibold text-slate-800 text-[11px]">Transparent PNG</div>
                  <div className="text-[10px] text-slate-400">Executive cursive</div>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Status / Replacement Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-600" />
                  <span>Signature Status</span>
                </h4>

                {signature && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-all"
                      title="Replace signature"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSignatureLoaded(null)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Remove signature"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {signature ? (
                <div className="space-y-3 text-xs">
                  {/* Clean Checkerboard Preview Frame */}
                  <div
                    className="w-full h-36 rounded-xl border border-slate-200 flex items-center justify-center p-3 relative overflow-hidden"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                        linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                        linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
                      `,
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    }}
                  >
                    <img
                      src={signature.dataUrl}
                      alt={signature.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">
                      {signature.width} × {signature.height} px
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200/70 rounded-xl text-emerald-800 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-[11px]">Ready for Certificate Placement</div>
                      <div className="text-[11px] text-emerald-700">
                        Placed as a transparent overlay in Step 3 and in all generated PDFs. No white box will be visible.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-4 text-center text-slate-400">
                  <PenTool className="w-7 h-7 mb-1.5 stroke-[1.5]" />
                  <p className="text-xs font-medium">No signature uploaded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload an image or select one of the test presets
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Manual Correction & Brush Editor (Section 4) */}
        {signature && (
          <SignatureBrushEditor
            signature={signature}
            onUpdateSignature={onSignatureLoaded}
            onRestoreOriginal={handleRestoreOriginal}
          />
        )}
      </div>
    </div>
  );
};
