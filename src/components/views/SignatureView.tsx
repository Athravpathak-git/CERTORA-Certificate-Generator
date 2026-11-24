import React, { useRef, useState } from 'react';
import {
  PenTool,
  CheckCircle,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Sliders,
  Layers,
  Wand2,
  Download,
  Upload,
} from 'lucide-react';
import saveAs from 'file-saver';
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

interface SignatureViewProps {
  signature: SignatureData | null;
  onSignatureLoaded: (sig: SignatureData | null) => void;
}

export const SignatureView: React.FC<SignatureViewProps> = ({
  signature,
  onSignatureLoaded,
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

  // Test Presets for QA verification
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

  // Download Transparent PNG
  const handleDownloadPng = () => {
    if (!signature) return;
    const byteCharacters = atob(signature.dataUrl.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    saveAs(blob, `Transparent_${signature.name}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Title Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-gold-dark bg-gold/15 px-2.5 py-1 rounded-md border border-gold/30">
            Smart Signature Studio
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#182536] mt-2">
            Automatic Signature Background Remover &amp; Brush Studio
          </h2>
          <p className="text-xs text-[#77818C] mt-1">
            Upload any handwritten signature. White, cream, and grey paper backgrounds are instantly converted to transparent PNG with edge anti-aliasing.
          </p>
        </div>

        {signature && (
          <button
            type="button"
            onClick={handleDownloadPng}
            className="btn-gold px-4 py-2 text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Transparent PNG</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-status-error/15 border border-status-error/30 text-status-error text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 space-y-6">
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
                ? 'border-gold bg-gold/5 scale-[1.01]'
                : 'border-[#E8E5DD] hover:border-gold/60 bg-white hover:bg-[#FAF8F5]'
            } shadow-xs`}
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

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
              <PenTool className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-[#182536]">
              {signature ? 'Replace Signature Image' : 'Drop your Signature here'}
            </h3>
            <p className="text-xs text-[#77818C] mt-1 max-w-sm mx-auto">
              PNG, JPG, or JPEG. Background is automatically detected and made transparent.
            </p>

            {isProcessing && (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-semibold text-[#182536]">
                  Analyzing paper contrast &amp; removing background...
                </p>
              </div>
            )}
          </div>

          {/* Test Presets for QA verification */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#182536]">
                Test Background Remover On Different Papers
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleLoadTestPreset('black_on_white')}
                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/40 text-left transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-[#182536]">1. Black on White Paper</span>
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => handleLoadTestPreset('blue_on_white')}
                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/40 text-left transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-[#182536]">2. Blue Pen Ink</span>
                <span className="w-3 h-3 rounded-full bg-blue-600 border border-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => handleLoadTestPreset('dark_on_cream')}
                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/40 text-left transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-[#182536]">3. Dark on Cream Paper</span>
                <span className="w-3 h-3 rounded-full bg-[#FBF5E6] border border-amber-300" />
              </button>

              <button
                type="button"
                onClick={() => handleLoadTestPreset('photo_grey')}
                className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/40 text-left transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-[#182536]">4. Photographed Grey Paper</span>
                <span className="w-3 h-3 rounded-full bg-[#EAECEF] border border-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleLoadTestPreset('thin_strokes')}
                className="sm:col-span-2 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/40 text-left transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-[#182536]">5. Thin Delicate Hairline Strokes</span>
                <span className="text-[10px] font-mono text-gold-dark font-bold">1-2px strokes preserved</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Before/After Preview */}
        <div className="lg:col-span-6 space-y-5">
          {signature ? (
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#182536] flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-status-success" />
                  <span>Transparent Signature Ready</span>
                </h4>

                <button
                  type="button"
                  onClick={() => onSignatureLoaded(null)}
                  className="text-xs text-status-error hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Before & After Comparison */}
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                {signature.originalDataUrl && (
                  <div className="space-y-1 text-center">
                    <span className="text-[10px] font-bold uppercase text-[#77818C]">
                      Original Upload
                    </span>
                    <div className="h-32 rounded-xl bg-white p-2 border border-[#E8E5DD] flex items-center justify-center overflow-hidden">
                      <img
                        src={signature.originalDataUrl}
                        alt="Original"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Processed on Checkerboard */}
                <div className={`space-y-1 text-center ${!signature.originalDataUrl ? 'col-span-2' : ''}`}>
                  <span className="text-[10px] font-bold uppercase text-gold-dark">
                    Transparent Output
                  </span>
                  <div
                    className="h-32 rounded-xl p-2 border border-gold/40 flex items-center justify-center overflow-hidden bg-checkerboard"
                  >
                    <img
                      src={signature.dataUrl}
                      alt="Transparent Signature"
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Info Pill */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-[11px] text-[#77818C] leading-relaxed">
                ✓ <strong>Certificate Integration:</strong> This transparent PNG is automatically used across all certificates with zero white box behind it!
              </div>

              {/* Manual Correction Brush Editor */}
              <SignatureBrushEditor
                signature={signature}
                onUpdateSignature={(sig) => onSignatureLoaded(sig)}
                onRestoreOriginal={() => {
                  if (signature.originalDataUrl) {
                    onSignatureLoaded({
                      ...signature,
                      dataUrl: signature.originalDataUrl,
                      isBackgroundRemoved: false,
                    });
                  }
                }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-12 text-center text-[#77818C] shadow-xs">
              <PenTool className="w-10 h-10 mx-auto text-gold opacity-30 mb-2" />
              <p className="text-xs font-semibold text-[#182536]">No signature uploaded</p>
              <p className="text-[11px] text-[#77818C] mt-0.5">
                Upload a signature on the left or click one of the test presets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
