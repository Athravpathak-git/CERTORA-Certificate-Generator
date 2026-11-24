import React, { useState } from 'react';
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  User,
  PenTool,
  Calendar,
  Type,
  Plus,
  Trash2,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  RotateCw,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  CertificateField,
  CertificateTemplate,
  Participant,
  SignatureData,
} from '../types';
import { CertificateCanvas } from './CertificateCanvas';
import { AVAILABLE_FONTS } from '../constants/fonts';
import { FontSizeControl } from './FontSizeControl';

interface SimpleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: CertificateTemplate | null;
  signature: SignatureData | null;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFields: (fields: CertificateField[]) => void;
  onSignatureLoaded: (sig: SignatureData | null) => void;
  onOpenBrushEditor: () => void;
  formattedDate: string;
}

export const SimpleEditorModal: React.FC<SimpleEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  signature,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateFields,
  onSignatureLoaded,
  onOpenBrushEditor,
  formattedDate,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showGuidelines, setShowGuidelines] = useState(true);

  if (!isOpen) return null;

  const activeField = fields.find((f) => f.id === selectedFieldId) || fields[0];

  const updateActiveField = (patch: Partial<CertificateField>) => {
    if (!activeField) return;
    onUpdateFields(
      fields.map((f) => (f.id === activeField.id ? { ...f, ...patch } : f))
    );
  };

  // Rotate signature 90 deg
  const handleRotateSignature = () => {
    if (!activeField || activeField.type !== 'signature') return;
    const currentRot = (activeField as any).rotation || 0;
    const nextRot = (currentRot + 90) % 360;
    updateActiveField({ rotation: nextRot } as any);
  };

  // Add custom text field
  const handleAddCustomText = (isDynamic: boolean = false) => {
    const count = fields.filter((f) => f.type === 'custom_text').length;
    const newId = `field-custom-${Date.now()}`;
    const defaultKey = isDynamic ? `field_${count + 1}` : `custom_${count + 1}`;
    const newField: CertificateField = {
      id: newId,
      type: 'custom_text',
      label: isDynamic ? `Dynamic Field ${count + 1}` : `Custom Text ${count + 1}`,
      placeholder: isDynamic ? `{{${defaultKey}}}` : undefined,
      enabled: true,
      isStatic: !isDynamic,
      staticValue: isDynamic ? `{{${defaultKey}}}` : 'Honorary Distinction',
      fieldKey: defaultKey,
      xPercent: 25,
      yPercent: Math.min(75, 45 + (count * 6)),
      widthPercent: 50,
      heightPercent: 5,
      fontFamily: 'Montserrat',
      fontSize: 16,
      fontWeight: '600',
      fontStyle: 'normal',
      letterSpacing: 0.5,
      autoFit: true,
      transform: 'none',
      color: '#182536',
      align: 'center',
    };
    onUpdateFields([...fields, newField]);
    onSelectField(newField.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col p-2 sm:p-4 overflow-hidden animate-fade-in font-sans">
      {/* Top Header Bar */}
      <div className="bg-[#182536] text-white px-5 py-3 rounded-t-2xl flex items-center justify-between border-b border-[#C4A878]/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#263B50] border border-[#C4A878]/40 text-[#C4A878] flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F5F1E8]">
              Certificate Layout Designer
            </h2>
            <p className="text-[11px] text-[#C4A878]">
              Directly drag, reposition and resize elements on the canvas
            </p>
          </div>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-[#263B50] p-1 rounded-xl border border-[#C4A878]/20 text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1.5 text-[#C4A878]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.8, Math.round((z + 0.1) * 10) / 10))}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-gold py-1.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply &amp; Done</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main 3-Panel Editor Body */}
      <div className="flex-1 bg-[#FAF8F5] rounded-b-2xl border-x border-b border-[#E8E5DD] flex flex-col lg:flex-row overflow-hidden shadow-2xl">
        {/* ============================================================== */}
        {/* LEFT PANEL: SIMPLE ELEMENTS TOOLBAR                            */}
        {/* ============================================================== */}
        <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#E8E5DD] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#182536] uppercase tracking-wider">
                Certificate Elements
              </h3>
              <p className="text-[11px] text-[#77818C]">
                Click an element to customize its position &amp; style
              </p>
            </div>

            {/* List of Essential Elements */}
            <div className="space-y-2">
              {fields.map((f) => {
                const isSelected = selectedFieldId === f.id;
                let Icon = Type;
                if (f.type === 'candidate_name') Icon = User;
                if (f.type === 'signature') Icon = PenTool;
                if (f.type === 'date') Icon = Calendar;

                return (
                  <div
                    key={f.id}
                    onClick={() => onSelectField(f.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#182536] text-[#F5F1E8] border-[#182536] shadow-xs'
                        : 'bg-white hover:bg-[#FAF8F5] border-[#E8E5DD] text-[#253246]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#C4A878]' : 'text-slate-500'
                        }`}
                      />
                      <span className="text-xs font-bold truncate">{f.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateFields(
                            fields.map((item) =>
                              item.id === f.id ? { ...item, enabled: e.target.checked } : item
                            )
                          );
                        }}
                        className="rounded text-[#C4A878] focus:ring-[#C4A878] cursor-pointer"
                        title="Enable/disable element on certificate"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Text & Dynamic Field Buttons */}
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleAddCustomText(false)}
                className="w-full py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-slate-100 border border-dashed border-[#C4A878] text-[#182536] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#C4A878]" />
                <span>Add Static Text Element</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddCustomText(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#182536] hover:bg-[#263B50] text-[#C4A878] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Add a dynamic field that replaces with participant data e.g. {{event_name}}, {{location}}, {{duration}}"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dynamic Participant Field</span>
              </button>
            </div>
          </div>

          {/* Quick Help */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E5DD] text-[11px] text-[#77818C] space-y-1 mt-4">
            <span className="font-bold text-[#182536] block">Direct Canvas Editing</span>
            <p>You can drag any element directly on the center canvas. Use the bottom-right handle to resize.</p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER PANEL: LARGE CERTIFICATE CANVAS                         */}
        {/* ============================================================== */}
        <div className="flex-1 bg-slate-900/5 p-4 sm:p-6 overflow-auto flex items-center justify-center relative min-h-[350px]">
          <div className="w-full max-w-4xl">
            <CertificateCanvas
              template={template}
              fields={fields}
              signature={signature}
              formattedDate={formattedDate}
              selectedFieldId={selectedFieldId}
              onSelectField={onSelectField}
              onUpdateFields={onUpdateFields}
              isInteractive={true}
              zoom={zoom}
              showGuidelines={showGuidelines}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: CONTEXT-AWARE PROPERTIES                          */}
        {/* ============================================================== */}
        <div className="w-full lg:w-72 bg-white border-t lg:border-t-0 lg:border-l border-[#E8E5DD] p-4 shrink-0 overflow-y-auto space-y-4">
          <div>
            <span className="text-[10px] font-bold text-[#C4A878] uppercase tracking-wider block">
              Element Properties
            </span>
            <h3 className="text-sm font-bold text-[#182536]">{activeField?.label || 'Select Element'}</h3>
          </div>

          {activeField && (
            <div className="space-y-4 text-xs">
              {/* 1. If Candidate Name */}
              {activeField.type === 'candidate_name' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="font-bold text-[#77818C] block mb-1">Font Family</label>
                    <select
                      value={activeField.fontFamily || 'Google Sans Bold'}
                      onChange={(e) => updateActiveField({ fontFamily: e.target.value })}
                      className="input-clean text-xs py-2 w-full font-medium"
                    >
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E5DD]">
                    <FontSizeControl
                      fontSize={activeField.fontSize || 44}
                      defaultFontSize={activeField.defaultFontSize || 44}
                      min={4}
                      step={1}
                      presets={[24, 32, 44, 48, 80, 150, 300, 500]}
                      onChange={(newSize) => updateActiveField({ fontSize: newSize, autoFit: false })}
                      onReset={() => updateActiveField({ fontSize: activeField.defaultFontSize || 44, autoFit: false })}
                    />
                  </div>

                  {/* Bold / Italic / Alignment */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E5DD]">
                    <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E8E5DD]">
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveField({
                            fontWeight: activeField.fontWeight === 'bold' ? 'normal' : 'bold',
                          })
                        }
                        className={`p-1.5 rounded font-bold ${
                          activeField.fontWeight === 'bold'
                            ? 'bg-[#182536] text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveField({
                            fontStyle: activeField.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`p-1.5 rounded font-bold ${
                          activeField.fontStyle === 'italic'
                            ? 'bg-[#182536] text-white'
                            : 'text-slate-600'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E8E5DD]">
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'left' })}
                        className={`p-1.5 rounded ${
                          activeField.align === 'left' ? 'bg-[#182536] text-white' : 'text-slate-600'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'center' })}
                        className={`p-1.5 rounded ${
                          activeField.align === 'center' ? 'bg-[#182536] text-white' : 'text-slate-600'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'right' })}
                        className={`p-1.5 rounded ${
                          activeField.align === 'right' ? 'bg-[#182536] text-white' : 'text-slate-600'
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="color"
                      value={activeField.color || '#182536'}
                      onChange={(e) => updateActiveField({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#E8E5DD]"
                    />
                  </div>
                </div>
              )}

              {/* 2. If Signature */}
              {activeField.type === 'signature' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E5DD] flex items-center justify-between">
                    <span className="font-bold text-[#182536]">Active Signature</span>
                    <button
                      type="button"
                      onClick={handleRotateSignature}
                      className="p-1.5 rounded-lg bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536]"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenBrushEditor}
                    className="btn-midnight w-full py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#C4A878]" />
                    <span>Fine-Tune Brush &amp; Clean Edges</span>
                  </button>

                  <div>
                    <div className="flex justify-between font-bold text-[#77818C] mb-1">
                      <span>Width Scale</span>
                      <span className="text-[#182536] font-mono">{activeField.widthPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="40"
                      value={activeField.widthPercent || 18}
                      onChange={(e) => {
                        const newW = Number(e.target.value);
                        const ratio = activeField.signatureData?.aspectRatio || signature?.aspectRatio || 2.5;
                        updateActiveField({
                          widthPercent: newW,
                          heightPercent: Math.max(3, Math.round((newW / ratio) * 10) / 10),
                        });
                      }}
                      className="w-full accent-[#C4A878] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* 3. If Date */}
              {activeField.type === 'date' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E5DD]">
                    <FontSizeControl
                      fontSize={activeField.fontSize || 16}
                      defaultFontSize={activeField.defaultFontSize || 16}
                      min={4}
                      step={1}
                      presets={[10, 12, 14, 16, 18, 24, 32, 48, 80]}
                      onChange={(newSize) => updateActiveField({ fontSize: newSize, autoFit: false })}
                      onReset={() => updateActiveField({ fontSize: activeField.defaultFontSize || 16, autoFit: false })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#77818C]">Color</span>
                    <input
                      type="color"
                      value={activeField.color || '#334155'}
                      onChange={(e) => updateActiveField({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#E8E5DD]"
                    />
                  </div>
                </div>
              )}

              {/* 4. If Custom Text / Universal Dynamic Field (Event, Course, Initiative, Rank, etc.) */}
              {activeField.type !== 'signature' && activeField.type !== 'candidate_name' && activeField.type !== 'date' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="font-bold text-[#77818C] block mb-1">Field Label / Title</label>
                    <input
                      type="text"
                      value={activeField.label}
                      onChange={(e) => updateActiveField({ label: e.target.value })}
                      className="input-clean text-xs py-1.5 w-full font-medium"
                      placeholder="e.g. Event Name, Course, Duration"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#77818C] block mb-1">
                      Dynamic Placeholder (Spreadsheet Mapping)
                    </label>
                    <input
                      type="text"
                      value={activeField.placeholder || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanKey = val.replace(/[{}]/g, '').trim();
                        updateActiveField({
                          placeholder: val,
                          fieldKey: cleanKey || activeField.fieldKey,
                        });
                      }}
                      className="input-clean text-xs py-1.5 w-full font-mono font-medium text-[#C4A878]"
                      placeholder="e.g. {{event_name}}, {{duration}}"
                    />
                    <span className="text-[10px] text-[#77818C] mt-0.5 block">
                      Matches column header in Excel/CSV during bulk generation
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-[#77818C] block mb-1">Default / Template Text</label>
                    <textarea
                      rows={2}
                      value={activeField.staticValue}
                      onChange={(e) => updateActiveField({ staticValue: e.target.value })}
                      className="input-clean text-xs py-1.5 w-full font-medium leading-relaxed"
                      placeholder="Default text or template sentence e.g. For attending {{event_name}}"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#77818C] block mb-1">Font Family</label>
                    <select
                      value={activeField.fontFamily || 'Montserrat'}
                      onChange={(e) => updateActiveField({ fontFamily: e.target.value })}
                      className="input-clean text-xs py-1.5 w-full font-medium"
                    >
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E5DD]">
                    <FontSizeControl
                      fontSize={activeField.fontSize || 18}
                      defaultFontSize={activeField.defaultFontSize || 18}
                      min={4}
                      step={1}
                      presets={[14, 18, 24, 32, 48, 80, 150, 300, 500]}
                      onChange={(newSize) => updateActiveField({ fontSize: newSize, autoFit: false })}
                      onReset={() => updateActiveField({ fontSize: activeField.defaultFontSize || 18, autoFit: false })}
                    />
                  </div>

                  {/* Bold / Italic / Alignment / Color */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8E5DD]">
                    <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E8E5DD]">
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveField({
                            fontWeight: activeField.fontWeight === 'bold' ? 'normal' : 'bold',
                          })
                        }
                        className={`p-1.5 rounded font-bold ${
                          activeField.fontWeight === 'bold'
                            ? 'bg-[#182536] text-white'
                            : 'text-slate-600'
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateActiveField({
                            fontStyle: activeField.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`p-1.5 rounded font-bold ${
                          activeField.fontStyle === 'italic'
                            ? 'bg-[#182536] text-white'
                            : 'text-slate-600'
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E8E5DD]">
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'left' })}
                        className={`p-1.5 rounded ${
                          activeField.align === 'left' ? 'bg-[#182536] text-white' : 'text-slate-600'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'center' })}
                        className={`p-1.5 rounded ${
                          activeField.align === 'center' ? 'bg-[#182536] text-white' : 'text-slate-600'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'right' })}
                        className={`p-1.5 rounded ${
                          activeField.align === 'right' ? 'bg-[#182536] text-white' : 'text-slate-600'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="color"
                      value={activeField.color || '#253246'}
                      onChange={(e) => updateActiveField({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#E8E5DD]"
                      title="Text Color"
                    />
                  </div>

                  {/* Width Scale */}
                  <div>
                    <div className="flex justify-between font-bold text-[#77818C] mb-1">
                      <span>Width Bounding Box</span>
                      <span className="text-[#182536] font-mono">{activeField.widthPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={activeField.widthPercent}
                      onChange={(e) => updateActiveField({ widthPercent: Number(e.target.value) })}
                      className="w-full accent-[#C4A878] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Position Coordinate Sliders (X & Y) */}
              <div className="pt-3 border-t border-[#E8E5DD] space-y-3">
                <span className="font-bold text-[#182536] block">Exact Coordinate Position</span>
                <div>
                  <div className="flex justify-between text-[11px] text-[#77818C] mb-1">
                    <span>Horizontal (X)</span>
                    <span className="font-mono text-[#182536]">{Math.round(activeField.xPercent)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={100 - activeField.widthPercent}
                    value={activeField.xPercent}
                    onChange={(e) => updateActiveField({ xPercent: Number(e.target.value) })}
                    className="w-full accent-[#182536] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#77818C] mb-1">
                    <span>Vertical (Y)</span>
                    <span className="font-mono text-[#182536]">{Math.round(activeField.yPercent)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={100 - activeField.heightPercent}
                    value={activeField.yPercent}
                    onChange={(e) => updateActiveField({ yPercent: Number(e.target.value) })}
                    className="w-full accent-[#182536] cursor-pointer"
                  />
                </div>
              </div>

              {/* Delete Custom Field */}
              {activeField.type === 'custom_text' && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateFields(fields.filter((f) => f.id !== activeField.id));
                    onSelectField(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold flex items-center justify-center gap-1.5 transition-colors mt-4"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Custom Element</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
