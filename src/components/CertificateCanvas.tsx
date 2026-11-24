import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  CertificateField,
  CertificateTemplate,
  Participant,
  SignatureData,
} from '../types';
import { PenTool, Calendar, User, Type, QrCode } from 'lucide-react';
import { resolveFieldText } from '../services/pdfService';

interface CertificateCanvasProps {
  template: CertificateTemplate | null;
  fields: CertificateField[];
  signature: SignatureData | null;
  participant?: Participant | null;
  formattedDate: string;
  selectedFieldId?: string | null;
  onSelectField?: (id: string | null) => void;
  onUpdateFields?: (fields: CertificateField[]) => void;
  isInteractive?: boolean;
  zoom?: number;
  showGuidelines?: boolean;
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  template,
  fields,
  signature,
  participant,
  formattedDate,
  selectedFieldId = null,
  onSelectField,
  onUpdateFields,
  isInteractive = false,
  zoom = 1,
  showGuidelines = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateWidth = () => {
      if (el) setContainerWidth(el.clientWidth);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const checkTextOverflow = (text: string, font: string, maxWidth: number): boolean => {
    if (!text || maxWidth <= 0) return false;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.font = font;
      return ctx.measureText(text).width > maxWidth;
    } catch {
      return false;
    }
  };

  const [activeDrag, setActiveDrag] = useState<{
    fieldId: string;
    mode: 'move' | 'se' | 'e' | 's';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  // Template aspect ratio
  const aspectRatio = template?.aspectRatio || (template?.originalWidth && template?.originalHeight ? template.originalWidth / template.originalHeight : 16 / 9);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [template?.id, template?.previewImageUrl]);

  // Drag handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    fieldId: string,
    mode: 'move' | 'se' | 'e' | 's'
  ) => {
    if (!isInteractive || !onUpdateFields) return;
    e.stopPropagation();
    if (onSelectField) onSelectField(fieldId);

    const target = fields.find((f) => f.id === fieldId);
    if (!target || target.isLocked) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveDrag({
      fieldId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initialX: target.xPercent,
      initialY: target.yPercent,
      initialW: target.widthPercent,
      initialH: target.heightPercent,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !containerRef.current || !onUpdateFields) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width;
    const containerH = rect.height;

    const deltaX = ((e.clientX - activeDrag.startX) / containerW) * 100;
    const deltaY = ((e.clientY - activeDrag.startY) / containerH) * 100;

    const updated = fields.map((f) => {
      if (f.id !== activeDrag.fieldId) return f;

      if (activeDrag.mode === 'move') {
        const newX = Math.max(0, Math.min(100 - f.widthPercent, activeDrag.initialX + deltaX));
        const newY = Math.max(0, Math.min(100 - f.heightPercent, activeDrag.initialY + deltaY));
        return {
          ...f,
          xPercent: Math.round(newX * 10) / 10,
          yPercent: Math.round(newY * 10) / 10,
        };
      }

      if (activeDrag.mode === 'se') {
        const newW = Math.max(4, Math.min(100 - f.xPercent, activeDrag.initialW + deltaX));
        let newH = Math.max(2, Math.min(100 - f.yPercent, activeDrag.initialH + deltaY));
        if (f.type === 'signature') {
          const sigObj = f.signatureData || (f.id === 'field-signature' || !f.signatureData ? signature : null);
          const sigAspect = sigObj?.aspectRatio || 2.5;
          const canvasAspect = aspectRatio || (16 / 9);
          newH = Math.max(2, Math.min(100 - f.yPercent, (newW * canvasAspect) / sigAspect));
        }
        return {
          ...f,
          widthPercent: Math.round(newW * 10) / 10,
          heightPercent: Math.round(newH * 10) / 10,
        };
      }

      return f;
    });

    onUpdateFields(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
    }
  };

  if (!template) {
    return (
      <div className="w-full h-80 rounded-2xl bg-white border border-[#E8E5DD] flex flex-col items-center justify-center text-slate-400 p-6">
        <p className="text-sm font-medium">Please upload or select a certificate template to start</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden select-none flex items-center justify-center"
      style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
    >
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (onSelectField && isInteractive) onSelectField(null);
        }}
        className="relative w-full max-w-full rounded-2xl overflow-hidden shadow-md bg-white border border-[#E8E5DD]"
        style={{
          aspectRatio: `${aspectRatio}`,
        }}
      >
        {/* Base Certificate Template Image / Render */}
        {template.previewImageUrl && !imgError ? (
          <img
            src={template.previewImageUrl}
            alt={template.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-contain pointer-events-none transition-opacity duration-200 ${
              imgLoaded ? 'opacity-100' : 'opacity-40'
            }`}
          />
        ) : (
          <div className="w-full h-full bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <p className="text-sm font-semibold text-[#182536]">Certificate Template</p>
            <p className="text-xs text-[#77818C] mt-1">{template.name}</p>
          </div>
        )}

        {!imgLoaded && !imgError && template.previewImageUrl && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 border-2 border-[#C4A878] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Dynamic Overlaid Elements */}
        {fields.map((field) => {
          if (!field.enabled) return null;
          const isSelected = isInteractive && selectedFieldId === field.id;

          // 1. Signature Field (Supports multiple distinct authority signatures)
          if (field.type === 'signature') {
            const currentSig = field.signatureData || (field.id === 'field-signature' || !field.signatureData ? signature : null);
            return (
              <div
                key={field.id}
                onPointerDown={(e) => handlePointerDown(e, field.id, 'move')}
                style={{
                  left: `${field.xPercent}%`,
                  top: `${field.yPercent}%`,
                  width: `${field.widthPercent}%`,
                  height: `${field.heightPercent}%`,
                  cursor: isInteractive ? 'move' : 'default',
                  opacity: 1,
                  transform: (field as any).rotation ? `rotate(${(field as any).rotation}deg)` : undefined,
                }}
                className={`absolute flex items-center justify-center p-0.5 transition-shadow ${
                  isSelected
                    ? 'ring-2 ring-[#C4A878] border border-[#C4A878] bg-[#C4A878]/10'
                    : showGuidelines && isInteractive
                    ? 'border border-dashed border-[#C4A878]/60 hover:bg-[#C4A878]/5'
                    : ''
                }`}
              >
                {currentSig ? (
                  <img
                    src={currentSig.dataUrl}
                    alt={field.label || 'Authorized Signature'}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    style={{
                      opacity: 1,
                      mixBlendMode: 'normal',
                      filter: 'none',
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded border border-dashed border-[#C4A878]/60 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#182536]/70 bg-white/60">
                    <PenTool className="w-3.5 h-3.5 text-[#C4A878]" />
                    <span className="truncate px-1">{field.label || 'Signature Area'}</span>
                  </div>
                )}

                {/* Resize Handle (bottom-right) */}
                {isSelected && isInteractive && !field.isLocked && (
                  <div
                    onPointerDown={(e) => handlePointerDown(e, field.id, 'se')}
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C4A878] border-2 border-white cursor-se-resize shadow-xs"
                  />
                )}
              </div>
            );
          }

          const baseWidth = template?.originalWidth || 1920;
          const scaleRatio = containerWidth > 0 ? containerWidth / baseWidth : (800 / baseWidth);
          const renderedFontSize = Math.max(6, Math.round((field.fontSize || 16) * scaleRatio));
          const boxWidthPx = (field.widthPercent / 100) * (containerWidth || 800);

          // 2. Candidate Name Field
          if (field.type === 'candidate_name') {
            const displayName = resolveFieldText(field, participant, formattedDate) || participant?.name || 'Candidate Name';
            const fontFamily = field.fontFamily || 'Google Sans Bold';
            const fontSpec = `${field.fontStyle === 'italic' ? 'italic ' : ''}${field.fontWeight === 'bold' ? 'bold ' : 'normal '}${renderedFontSize}px "${fontFamily}", sans-serif`;
            const isOverflowing = checkTextOverflow(displayName, fontSpec, boxWidthPx - 6);

            return (
              <div
                key={field.id}
                onPointerDown={(e) => handlePointerDown(e, field.id, 'move')}
                style={{
                  left: `${field.xPercent}%`,
                  top: `${field.yPercent}%`,
                  width: `${field.widthPercent}%`,
                  height: `${field.heightPercent}%`,
                  cursor: isInteractive ? 'move' : 'default',
                }}
                className={`absolute flex items-center justify-center transition-shadow ${
                  field.align === 'left'
                    ? 'justify-start text-left'
                    : field.align === 'right'
                    ? 'justify-end text-right'
                    : 'justify-center text-center'
                } ${
                  isOverflowing
                    ? 'ring-2 ring-amber-500 border border-amber-500 bg-amber-500/10'
                    : isSelected
                    ? 'ring-2 ring-[#C4A878] border border-[#C4A878] bg-[#C4A878]/15 shadow-sm'
                    : showGuidelines && isInteractive
                    ? 'border border-dashed border-[#C4A878]/60 hover:bg-[#C4A878]/5'
                    : ''
                }`}
              >
                {/* Visual Overflow Warning Badge */}
                {isOverflowing && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1 z-30 pointer-events-none">
                    <span>⚠️ Text Overflow ({field.fontSize}px)</span>
                  </div>
                )}

                {/* Selected Field Indicator & Font Size Badge */}
                {isSelected && (
                  <div className="absolute -bottom-5 left-0 bg-[#182536] text-[#C4A878] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none flex items-center gap-1">
                    <span>{field.label}</span>
                    <span className="text-white">({field.fontSize}px)</span>
                  </div>
                )}

                <span
                  style={{
                    fontFamily: `${fontFamily}, "Google Sans", sans-serif`,
                    fontSize: `${renderedFontSize}px`,
                    fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                    fontStyle: field.fontStyle === 'italic' ? 'italic' : 'normal',
                    color: field.color || '#182536',
                    letterSpacing: `${field.letterSpacing || 1}px`,
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  }}
                  className="pointer-events-none select-none"
                >
                  {displayName}
                </span>

                {isSelected && isInteractive && !field.isLocked && (
                  <div
                    onPointerDown={(e) => handlePointerDown(e, field.id, 'se')}
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C4A878] border-2 border-white cursor-se-resize shadow-xs"
                  />
                )}
              </div>
            );
          }

          // 3. Date Field
          if (field.type === 'date') {
            const displayDate = resolveFieldText(field, participant, formattedDate) || formattedDate;
            const fontSpec = `${field.fontWeight === 'bold' || field.fontWeight === '600' ? '600 ' : 'normal '}${renderedFontSize}px "${field.fontFamily || 'Montserrat'}", sans-serif`;
            const isOverflowing = checkTextOverflow(displayDate, fontSpec, boxWidthPx - 6);

            return (
              <div
                key={field.id}
                onPointerDown={(e) => handlePointerDown(e, field.id, 'move')}
                style={{
                  left: `${field.xPercent}%`,
                  top: `${field.yPercent}%`,
                  width: `${field.widthPercent}%`,
                  height: `${field.heightPercent}%`,
                  cursor: isInteractive ? 'move' : 'default',
                }}
                className={`absolute flex items-center justify-center transition-shadow ${
                  field.align === 'left'
                    ? 'justify-start text-left'
                    : field.align === 'right'
                    ? 'justify-end text-right'
                    : 'justify-center text-center'
                } ${
                  isOverflowing
                    ? 'ring-2 ring-amber-500 border border-amber-500 bg-amber-500/10'
                    : isSelected
                    ? 'ring-2 ring-[#C4A878] border border-[#C4A878] bg-[#C4A878]/15 shadow-sm'
                    : showGuidelines && isInteractive
                    ? 'border border-dashed border-[#C4A878]/60 hover:bg-[#C4A878]/5'
                    : ''
                }`}
              >
                {/* Visual Overflow Warning Badge */}
                {isOverflowing && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1 z-30 pointer-events-none">
                    <span>⚠️ Text Overflow ({field.fontSize}px)</span>
                  </div>
                )}

                {/* Selected Field Indicator & Font Size Badge */}
                {isSelected && (
                  <div className="absolute -bottom-5 left-0 bg-[#182536] text-[#C4A878] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none flex items-center gap-1">
                    <span>{field.label}</span>
                    <span className="text-white">({field.fontSize}px)</span>
                  </div>
                )}

                <span
                  style={{
                    fontFamily: `${field.fontFamily || 'Montserrat'}, sans-serif`,
                    fontSize: `${renderedFontSize}px`,
                    fontWeight: field.fontWeight === 'bold' || field.fontWeight === '600' ? '600' : 'normal',
                    color: field.color || '#253246',
                    whiteSpace: 'nowrap',
                  }}
                  className="pointer-events-none select-none"
                >
                  {displayDate}
                </span>

                {isSelected && isInteractive && !field.isLocked && (
                  <div
                    onPointerDown={(e) => handlePointerDown(e, field.id, 'se')}
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C4A878] border-2 border-white cursor-se-resize shadow-xs"
                  />
                )}
              </div>
            );
          }

          // 4. Custom Text, Universal Dynamic Fields (Course, Event, Location, Duration, Rank, Score, etc.)
          const displayVal =
            resolveFieldText(field, participant, formattedDate) ||
            participant?.fields?.[field.fieldKey] ||
            field.staticValue ||
            field.label;

          const fontSpec = `${field.fontStyle === 'italic' ? 'italic ' : ''}${field.fontWeight === 'bold' ? 'bold ' : 'normal '}${renderedFontSize}px "${field.fontFamily || 'Montserrat'}", sans-serif`;
          const isOverflowing = checkTextOverflow(displayVal, fontSpec, boxWidthPx - 6);

          return (
            <div
              key={field.id}
              onPointerDown={(e) => handlePointerDown(e, field.id, 'move')}
              style={{
                left: `${field.xPercent}%`,
                top: `${field.yPercent}%`,
                width: `${field.widthPercent}%`,
                height: `${field.heightPercent}%`,
                cursor: isInteractive ? 'move' : 'default',
              }}
              className={`absolute flex items-center justify-center transition-shadow ${
                field.align === 'left'
                  ? 'justify-start text-left'
                  : field.align === 'right'
                  ? 'justify-end text-right'
                  : 'justify-center text-center'
              } ${
                isOverflowing
                  ? 'ring-2 ring-amber-500 border border-amber-500 bg-amber-500/10'
                  : isSelected
                  ? 'ring-2 ring-[#C4A878] border border-[#C4A878] bg-[#C4A878]/15 shadow-sm'
                  : showGuidelines && isInteractive
                  ? 'border border-dashed border-[#C4A878]/60'
                  : ''
              }`}
            >
              {/* Visual Overflow Warning Badge */}
              {isOverflowing && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1 z-30 pointer-events-none">
                  <span>⚠️ Text Overflow ({field.fontSize}px)</span>
                </div>
              )}

              {/* Selected Field Indicator & Font Size Badge */}
              {isSelected && (
                <div className="absolute -bottom-5 left-0 bg-[#182536] text-[#C4A878] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none flex items-center gap-1">
                  <span>{field.label}</span>
                  <span className="text-white">({field.fontSize}px)</span>
                </div>
              )}

              <span
                style={{
                  fontFamily: `${field.fontFamily || 'Montserrat'}, sans-serif`,
                  fontSize: `${renderedFontSize}px`,
                  fontWeight: field.fontWeight === 'bold' ? 'bold' : field.fontWeight || 'normal',
                  fontStyle: field.fontStyle === 'italic' ? 'italic' : 'normal',
                  color: field.color || '#253246',
                  whiteSpace: 'nowrap',
                }}
                className="pointer-events-none select-none"
              >
                {displayVal}
              </span>

              {isSelected && isInteractive && !field.isLocked && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, field.id, 'se')}
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#C4A878] border-2 border-white cursor-se-resize shadow-xs"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
