import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Eraser,
  Paintbrush,
  RotateCcw,
  Undo2,
  Redo2,
  Download,
  Sliders,
  Sparkles,
  Check,
  Eye,
  RefreshCw,
  Info,
} from 'lucide-react';
import saveAs from 'file-saver';
import { SignatureData } from '../types';
import {
  removeSignatureBackground,
  DEFAULT_SIGNATURE_OPTIONS,
  SignatureProcessingOptions,
  loadImageElement,
} from '../services/signatureRemover';

interface SignatureBrushEditorProps {
  signature: SignatureData;
  onUpdateSignature: (sig: SignatureData) => void;
  onRestoreOriginal: () => void;
  onClose?: () => void;
}

type BrushMode = 'eraser' | 'restore' | 'none';
type PreviewBg = 'checker' | 'ivory' | 'white' | 'dark';

export const SignatureBrushEditor: React.FC<SignatureBrushEditorProps> = ({
  signature,
  onUpdateSignature,
  onRestoreOriginal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const origCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Brush settings
  const [brushMode, setBrushMode] = useState<BrushMode>('eraser');
  const [brushSize, setBrushSize] = useState<number>(18);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Background preview mode
  const [previewBg, setPreviewBg] = useState<PreviewBg>('checker');

  // Algorithm Sliders
  const [threshold, setThreshold] = useState<number>(
    signature.settings?.threshold ?? DEFAULT_SIGNATURE_OPTIONS.threshold
  );
  const [smoothness, setSmoothness] = useState<number>(
    signature.settings?.smoothness ?? DEFAULT_SIGNATURE_OPTIONS.smoothness
  );
  const [contrastBoost, setContrastBoost] = useState<number>(
    signature.settings?.contrastBoost ?? DEFAULT_SIGNATURE_OPTIONS.contrastBoost
  );
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Load and initialize canvases
  useEffect(() => {
    let isCancelled = false;

    const setupCanvases = async () => {
      try {
        const transImg = await loadImageElement(signature.dataUrl);
        const origImg = await loadImageElement(
          signature.originalDataUrl || signature.dataUrl
        );

        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = transImg.naturalWidth || transImg.width;
        canvas.height = transImg.naturalHeight || transImg.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(transImg, 0, 0);

        // Setup original canvas offscreen
        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })!;
        offCtx.drawImage(origImg, 0, 0, canvas.width, canvas.height);
        origCanvasRef.current = offCanvas;

        // Push initial state to history
        const initialImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialImageData]);
        setHistoryIndex(0);
      } catch (err) {
        console.error('Failed to setup brush canvas:', err);
      }
    };

    setupCanvases();

    return () => {
      isCancelled = true;
    };
  }, [signature.dataUrl]);

  // Push current canvas state to history
  const pushState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    if (newHistory.length >= 25) {
      newHistory.shift();
    }
    newHistory.push(currentData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Update parent signature with new transparent data URL
    const updatedDataUrl = canvas.toDataURL('image/png');
    onUpdateSignature({
      ...signature,
      dataUrl: updatedDataUrl,
    });
  }, [history, historyIndex, onUpdateSignature, signature]);

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.putImageData(history[prevIdx], 0, 0);
      setHistoryIndex(prevIdx);

      const updatedDataUrl = canvas.toDataURL('image/png');
      onUpdateSignature({
        ...signature,
        dataUrl: updatedDataUrl,
      });
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.putImageData(history[nextIdx], 0, 0);
      setHistoryIndex(nextIdx);

      const updatedDataUrl = canvas.toDataURL('image/png');
      onUpdateSignature({
        ...signature,
        dataUrl: updatedDataUrl,
      });
    }
  };

  // Canvas drawing coordinate mapper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawBrushStroke = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || brushMode === 'none') return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (brushMode === 'eraser') {
      // Erase mode: destination-out
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (brushMode === 'restore') {
      // Restore mode: copy from original canvas within circle
      const origCanvas = origCanvasRef.current;
      if (!origCanvas) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(origCanvas, 0, 0);
      ctx.restore();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (brushMode === 'none') return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    drawBrushStroke(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setCursorPos({ x, y });

    if (!isDrawing || brushMode === 'none') return;
    drawBrushStroke(x, y);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      pushState();
    }
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    if (isDrawing) {
      setIsDrawing(false);
      pushState();
    }
  };

  // Reprocess signature with current sliders
  const handleReprocess = async () => {
    if (!signature.originalDataUrl) return;
    setIsReprocessing(true);
    try {
      const opts: Partial<SignatureProcessingOptions> = {
        threshold,
        smoothness,
        contrastBoost,
        removeHalo: true,
      };

      const result = await removeSignatureBackground(signature.originalDataUrl, opts);

      onUpdateSignature({
        ...signature,
        dataUrl: result.transparentDataUrl,
        isBackgroundRemoved: true,
        detectedPaperColor: result.detectedPaperColor,
        settings: {
          threshold,
          smoothness,
          contrastBoost,
          removeHalo: true,
        },
      });
    } catch (err) {
      console.error('Reprocess error:', err);
    } finally {
      setIsReprocessing(false);
    }
  };

  // Download transparent PNG directly
  const handleDownloadTransparentPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, 'signature_transparent.png');
      }
    }, 'image/png');
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Background Automatically Removed</span>
            </span>
            {signature.detectedPaperColor && (
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Detected: <strong>{signature.detectedPaperColor.name}</strong>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fine-tune edges, use the Eraser/Restore brushes, or adjust removal sensitivity below.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTransparentPng}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-sm transition-all active:scale-95"
            title="Download transparent PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={onRestoreOriginal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-all"
            title="Restore original uploaded image"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Original</span>
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Canvas & Brush View */}
        <div className="lg:col-span-8 space-y-4">
          {/* Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
            {/* Brush Tool Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setBrushMode('eraser')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  brushMode === 'eraser'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Erase unwanted spots or borders"
              >
                <Eraser className="w-4 h-4 text-rose-500" />
                <span>Eraser Brush</span>
              </button>

              <button
                type="button"
                onClick={() => setBrushMode('restore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  brushMode === 'restore'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Paint back clipped handwritten strokes from original"
              >
                <Paintbrush className="w-4 h-4 text-brand-600" />
                <span>Restore Brush</span>
              </button>
            </div>

            {/* Brush Size Slider */}
            {brushMode !== 'none' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Size:</span>
                <input
                  type="range"
                  min="4"
                  max="60"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-24 accent-brand-600 cursor-pointer"
                />
                <span className="font-mono text-slate-700 w-8">{brushSize}px</span>
              </div>
            )}

            {/* Undo / Redo */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Viewport Frame */}
          <div
            className={`w-full min-h-[260px] rounded-2xl border border-slate-300 flex items-center justify-center p-6 relative overflow-hidden ${
              previewBg === 'checker'
                ? ''
                : previewBg === 'ivory'
                ? 'bg-[#FCFBF7]'
                : previewBg === 'white'
                ? 'bg-white'
                : 'bg-slate-900'
            }`}
            style={
              previewBg === 'checker'
                ? {
                    backgroundImage: `
                      linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                      linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                      linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
                    `,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#ffffff',
                  }
                : undefined
            }
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className={`max-w-full max-h-[300px] object-contain transition-all ${
                brushMode !== 'none' ? 'cursor-crosshair' : 'cursor-default'
              }`}
              style={{
                opacity: 1,
                mixBlendMode: 'normal',
                filter: 'none',
              }}
            />

            {/* Interactive Brush Cursor Indicator */}
            {cursorPos && brushMode !== 'none' && (
              <div
                className="pointer-events-none fixed z-50 rounded-full border border-brand-600 bg-brand-500/20 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${brushSize}px`,
                  height: `${brushSize}px`,
                  left: `${cursorPos.x}px`,
                  top: `${cursorPos.y}px`,
                }}
              />
            )}
          </div>

          {/* Background Preview Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Preview Against Background:</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewBg('checker')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  previewBg === 'checker'
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Checkerboard (Transparent)
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('ivory')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  previewBg === 'ivory'
                    ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Certificate Ivory
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  previewBg === 'dark'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dark Certificate
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sensitivity Controls & Original Comparison */}
        <div className="lg:col-span-4 space-y-4">
          {/* Sliders Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-navy-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-600" />
                <span>Detection & Edge Controls</span>
              </h4>
            </div>

            {/* Removal Strength / Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-700">Removal Strength (Threshold)</span>
                <span className="font-mono text-brand-600">{threshold}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Gentle</span>
                <span>Balanced</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* Edge Smoothness / Feathering */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-700">Edge Smoothness (Anti-Aliasing)</span>
                <span className="font-mono text-brand-600">{smoothness}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="75"
                value={smoothness}
                onChange={(e) => setSmoothness(parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Crisp Edge</span>
                <span>Soft Feather</span>
              </div>
            </div>

            {/* Ink Contrast Boost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-700">Ink Contrast & Depth</span>
                <span className="font-mono text-brand-600">+{contrastBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                value={contrastBoost}
                onChange={(e) => setContrastBoost(parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Natural Ink</span>
                <span>Enhanced Stroke</span>
              </div>
            </div>

            {/* Reprocess Button */}
            <button
              type="button"
              onClick={handleReprocess}
              disabled={isReprocessing}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
              <span>{isReprocessing ? 'Re-analyzing...' : 'Re-process with Sliders'}</span>
            </button>
          </div>

          {/* Original Reference Box */}
          {signature.originalDataUrl && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Original Uploaded Reference</span>
                <span className="text-[10px] text-slate-400 font-mono">Unmodified</span>
              </div>
              <div className="w-full h-24 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-2 overflow-hidden">
                <img
                  src={signature.originalDataUrl}
                  alt="Original"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Use the <strong>Restore Brush</strong> to paint back any strokes from this original image onto the transparent canvas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
