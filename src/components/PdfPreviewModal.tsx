import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck,
} from 'lucide-react';
import { Participant } from '../types';
import { downloadSingleCertificate } from '../services/zipService';

interface PdfPreviewModalProps {
  participant: Participant | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  participant,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderPdf = async () => {
      if (!participant?.pdfBlob) return;
      setLoading(true);
      setError(null);

      try {
        const buffer = await participant.pdfBlob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        if (isCancelled) return;

        // Render at high resolution scale
        const viewport = page.getViewport({ scale: 2.0 * zoom });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (err: any) {
        console.error('PDF preview render error:', err);
        setError('Failed to render PDF: ' + err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    renderPdf();

    return () => {
      isCancelled = true;
    };
  }, [participant, zoom]);

  if (!participant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 truncate max-w-md">
                {participant.name}
              </h3>
              <p className="text-xs font-mono text-slate-500">
                {participant.generatedFilename}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setZoom(Math.max(0.6, zoom - 0.2))}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono font-medium text-slate-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(2.0, zoom + 0.2))}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={() => downloadSingleCertificate(participant)}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Canvas Viewer */}
        <div className="flex-1 overflow-auto p-6 bg-slate-900/5 flex items-center justify-center min-h-[450px]">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold">Rendering high-resolution vector PDF...</p>
            </div>
          )}

          {error && (
            <div className="text-center p-6 text-rose-600 text-sm">
              <p>{error}</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={`cert-canvas-shadow rounded-lg max-w-full h-auto bg-white transition-opacity ${
              loading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
