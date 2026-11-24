import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Move,
  Sliders,
  Type,
  Check,
  Eye,
  Info,
  QrCode,
  Hash,
  Undo2,
  Redo2,
} from 'lucide-react';
import {
  CertificateField,
  CertificateTemplate,
  FieldType,
  SignatureData,
} from '../../types';
import { getDefaultFields } from '../../constants/sampleData';

interface Step3PositionEditorProps {
  template: CertificateTemplate | null;
  signature: SignatureData | null;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFields: (fields: CertificateField[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3PositionEditor: React.FC<Step3PositionEditorProps> = ({
  template,
  signature,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateFields,
  onNext,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [activeDrag, setActiveDrag] = useState<{
    fieldId: string;
    mode: 'move' | 'se' | 'sw' | 'ne' | 'nw' | 'e' | 's';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  const [addFieldDropdownOpen, setAddFieldDropdownOpen] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<CertificateField[][]>([fields]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoAction = useRef(false);

  const pushHistory = useCallback(
    (newFields: CertificateField[]) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }
      const newHist = history.slice(0, historyIndex + 1);
      if (newHist.length >= 30) {
        newHist.shift();
      }
      newHist.push(newFields);
      setHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    },
    [history, historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevIdx = historyIndex - 1;
      const targetState = history[prevIdx];
      setHistoryIndex(prevIdx);
      onUpdateFields(targetState);
    }
  }, [history, historyIndex, onUpdateFields]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextIdx = historyIndex + 1;
      const targetState = history[nextIdx];
      setHistoryIndex(nextIdx);
      onUpdateFields(targetState);
    }
  }, [history, historyIndex, onUpdateFields]);

  // Global Keyboard Shortcuts for Undo/Redo & arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (!selectedFieldId || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const step = e.shiftKey ? 1 : 0.2;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;

      e.preventDefault();
      const updated = fields.map((f) => {
        if (f.id !== selectedFieldId) return f;
        return {
          ...f,
          xPercent: Math.max(0, Math.min(100 - f.widthPercent, f.xPercent + dx)),
          yPercent: Math.max(0, Math.min(100 - f.heightPercent, f.yPercent + dy)),
        };
      });
      onUpdateFields(updated);
      pushHistory(updated);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId, fields, onUpdateFields, handleUndo, handleRedo, pushHistory]);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  // Mouse move handler for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDrag || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaXPercent = ((e.clientX - activeDrag.startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - activeDrag.startY) / rect.height) * 100;

      onUpdateFields(
        fields.map((f) => {
          if (f.id !== activeDrag.fieldId) return f;

          let newX = f.xPercent;
          let newY = f.yPercent;
          let newW = f.widthPercent;
          let newH = f.heightPercent;

          if (activeDrag.mode === 'move') {
            newX = Math.max(0, Math.min(100 - f.widthPercent, activeDrag.initialX + deltaXPercent));
            newY = Math.max(0, Math.min(100 - f.heightPercent, activeDrag.initialY + deltaYPercent));
          } else if (activeDrag.mode === 'se') {
            newW = Math.max(3, Math.min(100 - f.xPercent, activeDrag.initialW + deltaXPercent));
            newH = Math.max(2, Math.min(100 - f.yPercent, activeDrag.initialH + deltaYPercent));
          } else if (activeDrag.mode === 'e') {
            newW = Math.max(3, Math.min(100 - f.xPercent, activeDrag.initialW + deltaXPercent));
          } else if (activeDrag.mode === 's') {
            newH = Math.max(2, Math.min(100 - f.yPercent, activeDrag.initialH + deltaYPercent));
          } else if (activeDrag.mode === 'sw') {
            const possibleX = activeDrag.initialX + deltaXPercent;
            if (possibleX >= 0 && possibleX <= activeDrag.initialX + activeDrag.initialW - 3) {
              newX = possibleX;
              newW = activeDrag.initialW - deltaXPercent;
            }
            newH = Math.max(2, Math.min(100 - f.yPercent, activeDrag.initialH + deltaYPercent));
          } else if (activeDrag.mode === 'ne') {
            const possibleY = activeDrag.initialY + deltaYPercent;
            if (possibleY >= 0 && possibleY <= activeDrag.initialY + activeDrag.initialH - 2) {
              newY = possibleY;
              newH = activeDrag.initialH - deltaYPercent;
            }
            newW = Math.max(3, Math.min(100 - f.xPercent, activeDrag.initialW + deltaXPercent));
          } else if (activeDrag.mode === 'nw') {
            const possibleX = activeDrag.initialX + deltaXPercent;
            const possibleY = activeDrag.initialY + deltaYPercent;
            if (possibleX >= 0 && possibleX <= activeDrag.initialX + activeDrag.initialW - 3) {
              newX = possibleX;
              newW = activeDrag.initialW - deltaXPercent;
            }
            if (possibleY >= 0 && possibleY <= activeDrag.initialY + activeDrag.initialH - 2) {
              newY = possibleY;
              newH = activeDrag.initialH - deltaYPercent;
            }
          }

          return {
            ...f,
            xPercent: Math.round(newX * 10) / 10,
            yPercent: Math.round(newY * 10) / 10,
            widthPercent: Math.round(newW * 10) / 10,
            heightPercent: Math.round(newH * 10) / 10,
          };
        })
      );
    };

    const handleMouseUp = () => {
      if (activeDrag) {
        pushHistory(fields);
        setActiveDrag(null);
      }
    };

    if (activeDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, fields, onUpdateFields, pushHistory]);

  const handleAddField = (type: FieldType, label: string) => {
    const isQr = type === 'qr_code';
    const isCertId = type === 'cert_id';

    const newField: CertificateField = {
      id: `field-${type}-${Date.now()}`,
      type,
      label,
      enabled: true,
      isStatic: type === 'date' || type === 'signature' || isQr,
      staticValue: isCertId
        ? 'CERT-2026-0001'
        : type === 'performance'
        ? 'Distinction'
        : type === 'rank'
        ? '1st Place'
        : '',
      fieldKey: type === 'candidate_name' ? 'candidateName' : isCertId ? 'certId' : type,
      xPercent: isQr ? 46 : isCertId ? 40 : 30,
      yPercent: isQr ? 72 : isCertId ? 88 : 50,
      widthPercent: isQr ? 8 : isCertId ? 20 : 40,
      heightPercent: isQr ? 14 : isCertId ? 4 : 6,
      fontFamily: isCertId ? 'Inter' : 'Montserrat',
      fontSize: isCertId ? 14 : 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#0F172A',
      letterSpacing: 1,
      align: 'center',
      autoFit: true,
      transform: 'none',
      qrSettings: isQr
        ? {
            includeId: true,
            errorCorrectionLevel: 'M',
          }
        : undefined,
    };

    const updated = [...fields, newField];
    onUpdateFields(updated);
    pushHistory(updated);
    onSelectField(newField.id);
    setAddFieldDropdownOpen(false);
  };

  const handleDeleteField = (id: string) => {
    const filtered = fields.filter((f) => f.id !== id);
    onUpdateFields(filtered);
    pushHistory(filtered);
    if (selectedFieldId === id && filtered.length > 0) {
      onSelectField(filtered[0].id);
    }
  };

  const handleResetPositions = () => {
    const defaults = getDefaultFields();
    onUpdateFields(defaults);
    pushHistory(defaults);
  };

  const updateSelectedField = (patch: Partial<CertificateField>) => {
    if (!selectedFieldId) return;
    const updated = fields.map((f) => (f.id === selectedFieldId ? { ...f, ...patch } : f));
    onUpdateFields(updated);
    pushHistory(updated);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 4 of 12
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Certificate Field Position Editor & Layout Studio
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag, resize, and place Candidate Name, Certificate ID, Verification QR, and Signature fields directly on the certificate.
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
            <span>Configure Typography</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Toolbar with Undo/Redo & Zoom */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Add Field Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddFieldDropdownOpen(!addFieldDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Field</span>
            </button>

            {addFieldDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400">
                  Core Fields
                </div>
                <button
                  type="button"
                  onClick={() => handleAddField('candidate_name', 'Candidate Name')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Candidate Name
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('cert_id', 'Certificate ID')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800 flex items-center justify-between"
                >
                  <span>Certificate ID / Serial</span>
                  <span className="text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded font-mono">NEW</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('qr_code', 'Verification QR Code')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800 flex items-center justify-between"
                >
                  <span>Verification QR Code</span>
                  <span className="text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded font-mono">NEW</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('date', 'Date')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Issuance Date
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('signature', 'Signature')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Authorized Signature
                </button>

                <div className="border-t border-slate-100 my-1"></div>
                <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400">
                  Performance & Custom
                </div>
                <button
                  type="button"
                  onClick={() => handleAddField('performance', 'Performance')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Performance / Grade
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('rank', 'Rank')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Rank (e.g. 1st Place)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('score', 'Score')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Score (e.g. 98/100)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('achievement', 'Achievement')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Achievement
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('event_name', 'Event Name')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Event Name
                </button>
                <button
                  type="button"
                  onClick={() => handleAddField('custom_text', 'Custom Text')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-medium text-slate-800"
                >
                  Custom Text Field
                </button>
              </div>
            )}
          </div>

          {/* Undo / Redo Buttons */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetPositions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
            title="Reset to default calibrated positions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1.5 rounded text-slate-600 hover:bg-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono font-medium text-slate-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(1.75, zoom + 0.1))}
              className="p-1.5 rounded text-slate-600 hover:bg-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setZoom(1)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Fit (100%)
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Visual Certificate Canvas */}
        <div className="xl:col-span-8 bg-slate-200/60 rounded-2xl p-4 sm:p-6 overflow-auto max-h-[750px] border border-slate-300/80 flex items-center justify-center">
          {template ? (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="relative select-none cert-canvas-shadow rounded-lg overflow-hidden bg-white max-w-full"
            >
              {/* Template Image Background */}
              <img
                src={template.previewImageUrl}
                alt="Certificate Template"
                className="w-full h-auto block pointer-events-none"
                style={{
                  minWidth: '700px',
                  maxWidth: '1000px',
                }}
              />

              {/* Draggable & Resizable Interactive Overlay Layer */}
              <div ref={containerRef} className="absolute inset-0 z-10">
                {fields.map((field) => {
                  if (!field.enabled) return null;
                  const isSelected = selectedFieldId === field.id;

                  return (
                    <div
                      key={field.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectField(field.id);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onSelectField(field.id);
                        setActiveDrag({
                          fieldId: field.id,
                          mode: 'move',
                          startX: e.clientX,
                          startY: e.clientY,
                          initialX: field.xPercent,
                          initialY: field.yPercent,
                          initialW: field.widthPercent,
                          initialH: field.heightPercent,
                        });
                      }}
                      style={{
                        left: `${field.xPercent}%`,
                        top: `${field.yPercent}%`,
                        width: `${field.widthPercent}%`,
                        height: `${field.heightPercent}%`,
                      }}
                      className={`absolute cursor-move transition-shadow flex items-center justify-center ${
                        isSelected
                          ? 'border-2 border-brand-600 bg-brand-500/10 shadow-lg ring-2 ring-brand-400/40'
                          : 'border border-dashed border-indigo-400/70 hover:border-brand-500 bg-indigo-50/20'
                      }`}
                    >
                      {/* Field Type Badge / Label */}
                      <div
                        className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight whitespace-nowrap shadow-sm pointer-events-none flex items-center gap-1 ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-slate-800/80 text-white'
                        }`}
                      >
                        <span>{field.label}</span>
                      </div>

                      {/* Content Preview inside the field box */}
                      {field.type === 'signature' ? (
                        signature ? (
                          <img
                            src={signature.dataUrl}
                            alt="Signature"
                            className="max-h-full max-w-full object-contain pointer-events-none"
                          />
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 italic">
                            [Signature Placeholder]
                          </span>
                        )
                      ) : field.type === 'qr_code' ? (
                        <div className="w-full h-full bg-white p-1 flex flex-col items-center justify-center border border-slate-300 rounded shadow-inner pointer-events-none">
                          <QrCode className="w-3/4 h-3/4 text-slate-900" />
                          <span className="text-[8px] font-mono font-bold text-slate-600 mt-0.5 uppercase">
                            QR VERIFY
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontFamily: field.fontFamily,
                            fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                            fontStyle: field.fontStyle,
                            color: field.color,
                            letterSpacing: `${field.letterSpacing}px`,
                            textAlign: field.align,
                          }}
                          className="w-full px-2 truncate pointer-events-none text-xs sm:text-sm font-semibold"
                        >
                          {field.type === 'candidate_name'
                            ? 'Athrav Pathak'
                            : field.type === 'cert_id'
                            ? 'CERT-2026-0001'
                            : field.type === 'date'
                            ? '12 November 2026'
                            : field.staticValue || field.label}
                        </span>
                      )}

                      {/* Resize Handles (Active when field is selected) */}
                      {isSelected && (
                        <>
                          {/* SE handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setActiveDrag({
                                fieldId: field.id,
                                mode: 'se',
                                startX: e.clientX,
                                startY: e.clientY,
                                initialX: field.xPercent,
                                initialY: field.yPercent,
                                initialW: field.widthPercent,
                                initialH: field.heightPercent,
                              });
                            }}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-600 border-2 border-white rounded-full cursor-se-resize shadow-md"
                          />
                          {/* E handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setActiveDrag({
                                fieldId: field.id,
                                mode: 'e',
                                startX: e.clientX,
                                startY: e.clientY,
                                initialX: field.xPercent,
                                initialY: field.yPercent,
                                initialW: field.widthPercent,
                                initialH: field.heightPercent,
                              });
                            }}
                            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-4 bg-brand-600 border border-white rounded-sm cursor-e-resize"
                          />
                          {/* S handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setActiveDrag({
                                fieldId: field.id,
                                mode: 's',
                                startX: e.clientX,
                                startY: e.clientY,
                                initialX: field.xPercent,
                                initialY: field.yPercent,
                                initialW: field.widthPercent,
                                initialH: field.heightPercent,
                              });
                            }}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-brand-600 border border-white rounded-sm cursor-s-resize"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Please upload a template in Step 1 first.</p>
          )}
        </div>

        {/* Selected Field Inspector Panel */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-600" />
                <span>Field Inspector</span>
              </h4>

              {selectedField && (
                <button
                  type="button"
                  onClick={() => handleDeleteField(selectedField.id)}
                  disabled={selectedField.type === 'candidate_name'}
                  className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-30 disabled:hover:text-rose-600 flex items-center gap-1"
                  title="Delete field"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            {selectedField ? (
              <div className="space-y-4 text-xs">
                {/* Field Selector Pill Tabs */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                    Active Field
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {fields.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onSelectField(f.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                          f.id === selectedField.id
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field Label Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateSelectedField({ label: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-800"
                  />
                </div>

                {/* QR Code Specific Options */}
                {selectedField.type === 'qr_code' && (
                  <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-200 space-y-2">
                    <span className="font-bold text-navy-900 block">QR Code Properties</span>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                        Error Correction Level
                      </label>
                      <select
                        value={selectedField.qrSettings?.errorCorrectionLevel || 'M'}
                        onChange={(e) =>
                          updateSelectedField({
                            qrSettings: {
                              includeId: true,
                              errorCorrectionLevel: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-medium text-slate-800"
                      >
                        <option value="L">L - Low (7% recovery)</option>
                        <option value="M">M - Medium (15% recovery, recommended)</option>
                        <option value="Q">Q - Quartile (25% recovery)</option>
                        <option value="H">H - High (30% recovery, most resilient)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Coordinates (Normalized % for resolution independence) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      X Position (Left)
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={selectedField.xPercent}
                        onChange={(e) =>
                          updateSelectedField({ xPercent: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-white px-2 py-1 rounded border border-slate-300 font-mono font-bold text-slate-800"
                      />
                      <span className="text-slate-400 font-mono">%</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Y Position (Top)
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={selectedField.yPercent}
                        onChange={(e) =>
                          updateSelectedField({ yPercent: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-white px-2 py-1 rounded border border-slate-300 font-mono font-bold text-slate-800"
                      />
                      <span className="text-slate-400 font-mono">%</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Width
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="3"
                        max="100"
                        step="0.5"
                        value={selectedField.widthPercent}
                        onChange={(e) =>
                          updateSelectedField({ widthPercent: parseFloat(e.target.value) || 10 })
                        }
                        className="w-full bg-white px-2 py-1 rounded border border-slate-300 font-mono font-bold text-slate-800"
                      />
                      <span className="text-slate-400 font-mono">%</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Height
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="2"
                        max="50"
                        step="0.5"
                        value={selectedField.heightPercent}
                        onChange={(e) =>
                          updateSelectedField({ heightPercent: parseFloat(e.target.value) || 5 })
                        }
                        className="w-full bg-white px-2 py-1 rounded border border-slate-300 font-mono font-bold text-slate-800"
                      />
                      <span className="text-slate-400 font-mono">%</span>
                    </div>
                  </div>
                </div>

                {/* Text Alignment */}
                {selectedField.type !== 'signature' && selectedField.type !== 'qr_code' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                      Horizontal Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                      {(['left', 'center', 'right'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateSelectedField({ align })}
                          className={`py-1.5 text-xs font-semibold capitalize rounded-md transition-all ${
                            selectedField.align === align
                              ? 'bg-white text-navy-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Helpful Keyboard Hint */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-500 text-[11px] flex items-start gap-2">
                  <Info className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Use arrow keys for nudges. Press <strong>Ctrl+Z</strong> to Undo and <strong>Ctrl+Y</strong> to Redo.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Select a field on the canvas to inspect.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
