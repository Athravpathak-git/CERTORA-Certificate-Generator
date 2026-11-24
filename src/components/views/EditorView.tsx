import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Eye,
  Sliders,
  Type,
  Move,
  Plus,
  Trash2,
  Check,
  Sparkles,
  QrCode,
  Hash,
  PenTool,
  Calendar,
  Award,
  Layers,
  Save,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Lock,
  Unlock,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  User,
} from 'lucide-react';
import {
  ActiveView,
  AiSuggestion,
  CertificateField,
  CertificateTemplate,
  CertIdSettings,
  DateSettings,
  FieldType,
  Participant,
  SignatureData,
} from '../../types';
import { AVAILABLE_FONTS } from '../../constants/fonts';
import { AppLanguage, t } from '../../services/i18n';
import { ensureGoogleSansLoaded } from '../../services/pdfService';

interface EditorViewProps {
  template: CertificateTemplate | null;
  signature: SignatureData | null;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFields: (fields: CertificateField[]) => void;
  onNavigate: (view: ActiveView) => void;
  onSaveProject: () => void;
  participants?: Participant[];
  dateSettings?: DateSettings;
  certIdSettings?: CertIdSettings;
  language?: AppLanguage;
}

export const EditorView: React.FC<EditorViewProps> = ({
  template,
  signature,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateFields,
  onNavigate,
  onSaveProject,
  participants = [],
  dateSettings,
  certIdSettings,
  language = 'en',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'typography' | 'ai_assistant'>('typography');

  // Collapsible sections for simplified UX (Sections 6, 7, 8, 10)
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const [isAdvancedTypographyOpen, setIsAdvancedTypographyOpen] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

  // Test Candidate Name input for instant interactive preview
  const [testCandidateName, setTestCandidateName] = useState('Athrav Pathak');

  // Participant cycling for bulk realism preview
  const [activeParticipantIdx, setActiveParticipantIdx] = useState(0);

  // Drag & Resize state
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

  // Undo / Redo History Stack
  const [history, setHistory] = useState<CertificateField[][]>([fields]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoAction = useRef(false);

  // Dismissed AI suggestion IDs
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Active Field selection
  const activeField = fields.find((f) => f.id === selectedFieldId) || fields[0] || null;

  // Ensure Google Sans Bold font is loaded in browser
  useEffect(() => {
    ensureGoogleSansLoaded();
  }, []);

  // Push to history when fields change by user action
  const pushHistory = useCallback(
    (newFields: CertificateField[]) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }
      const newHist = history.slice(0, historyIndex + 1);
      if (newHist.length >= 40) newHist.shift();
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

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Arrow keys for precision nudging)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Nudge with arrow keys (0.2% default, 1.0% with Shift)
      if (activeField && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (activeField.isLocked) return;
        e.preventDefault();
        const delta = e.shiftKey ? 1.0 : 0.2;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -delta;
        if (e.key === 'ArrowDown') dy = delta;
        if (e.key === 'ArrowLeft') dx = -delta;
        if (e.key === 'ArrowRight') dx = delta;

        const updated = fields.map((f) => {
          if (f.id === activeField.id) {
            return {
              ...f,
              xPercent: Math.max(0, Math.min(100 - f.widthPercent, f.xPercent + dx)),
              yPercent: Math.max(0, Math.min(100 - f.heightPercent, f.yPercent + dy)),
            };
          }
          return f;
        });
        onUpdateFields(updated);
        pushHistory(updated);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, activeField, fields, onUpdateFields, pushHistory]);

  // Update a single field
  const updateActiveField = (patch: Partial<CertificateField>) => {
    if (!activeField) return;
    const updated = fields.map((f) => (f.id === activeField.id ? { ...f, ...patch } : f));
    onUpdateFields(updated);
    pushHistory(updated);
  };

  // Toggle element ON / OFF
  const toggleFieldEnabled = (fieldId: string) => {
    const updated = fields.map((f) => {
      if (f.id === fieldId) {
        return { ...f, enabled: !f.enabled };
      }
      return f;
    });
    onUpdateFields(updated);
    pushHistory(updated);
  };

  // Duplicate an element
  const handleDuplicateField = (fieldId: string) => {
    const target = fields.find((f) => f.id === fieldId);
    if (!target) return;
    const duplicated: CertificateField = {
      ...target,
      id: `field-${Date.now()}`,
      label: `${target.label} (Copy)`,
      xPercent: Math.min(85, target.xPercent + 2),
      yPercent: Math.min(85, target.yPercent + 2),
      isLocked: false,
    };
    const updated = [...fields, duplicated];
    onUpdateFields(updated);
    pushHistory(updated);
    onSelectField(duplicated.id);
  };

  // Delete an element
  const handleDeleteField = (fieldId: string) => {
    if (fields.length <= 1) return;
    const updated = fields.filter((f) => f.id !== fieldId);
    onUpdateFields(updated);
    pushHistory(updated);
    if (selectedFieldId === fieldId) {
      onSelectField(updated[0]?.id || null);
    }
  };

  // Reorder elements (Bring Forward / Send Backward)
  const handleBringForward = (fieldId: string) => {
    const index = fields.findIndex((f) => f.id === fieldId);
    if (index < fields.length - 1) {
      const updated = [...fields];
      const [item] = updated.splice(index, 1);
      updated.splice(index + 1, 0, item);
      onUpdateFields(updated);
      pushHistory(updated);
    }
  };

  const handleSendBackward = (fieldId: string) => {
    const index = fields.findIndex((f) => f.id === fieldId);
    if (index > 0) {
      const updated = [...fields];
      const [item] = updated.splice(index, 1);
      updated.splice(index - 1, 0, item);
      onUpdateFields(updated);
      pushHistory(updated);
    }
  };

  // Add a new custom field manually
  const handleAddNewField = (type: FieldType = 'custom_text', customLabel?: string) => {
    const newId = `field-${Date.now()}`;
    const defaultLabels: Record<FieldType, string> = {
      candidate_name: 'Candidate Name',
      date: 'Date of Issue',
      signature: 'Authorized Signature',
      cert_id: 'Certificate ID',
      serial_number: 'Serial Number',
      qr_code: 'Verification QR Code',
      performance: 'Performance Grade',
      rank: 'Rank Position',
      score: 'Final Score',
      achievement: 'Achievement Honor',
      event_name: 'Event Title',
      custom_text: 'Custom Text Field',
      custom_image: 'Custom Graphic Stamp',
    };

    const isSig = type === 'signature';
    const sigCount = fields.filter((f) => f.type === 'signature').length;
    let defX = 35;
    let defY = 48;
    let defW = type === 'qr_code' ? 12 : 30;
    let defH = type === 'qr_code' ? 12 : 6;

    if (isSig) {
      defW = 18;
      defH = 9;
      defY = 74;
      if (sigCount === 1) defX = 16;
      else if (sigCount === 2) defX = 42;
      else defX = Math.min(76, 12 + (sigCount * 22) % 72);
    }

    const newField: CertificateField = {
      id: newId,
      type,
      label: customLabel || defaultLabels[type] || 'New Element',
      enabled: true,
      isStatic: true,
      staticValue: type === 'qr_code' ? 'VERIFIED:ATH-2026-0001' : 'Sample Text',
      fieldKey: `${type}_${Date.now()}`,
      xPercent: defX,
      yPercent: defY,
      widthPercent: defW,
      heightPercent: defH,
      fontFamily: 'Google Sans Bold',
      fontSize: type === 'candidate_name' ? 48 : 18,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#182536',
      letterSpacing: 0,
      align: 'center',
      autoFit: true,
      transform: 'none',
      signatureData: isSig ? (signature || undefined) : undefined,
      rotation: 0,
    };

    const updated = [...fields, newField];
    onUpdateFields(updated);
    pushHistory(updated);
    onSelectField(newId);
  };

  // Pointer drag/resize logic using normalized container percentages
  const handlePointerDown = (
    e: React.PointerEvent,
    fieldId: string,
    mode: 'move' | 'se' | 'sw' | 'ne' | 'nw' | 'e' | 's'
  ) => {
    e.stopPropagation();
    onSelectField(fieldId);

    const targetField = fields.find((f) => f.id === fieldId);
    if (!targetField || targetField.isLocked) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveDrag({
      fieldId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      initialX: targetField.xPercent,
      initialY: targetField.yPercent,
      initialW: targetField.widthPercent,
      initialH: targetField.heightPercent,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width / zoom;
    const containerH = rect.height / zoom;

    const deltaX = ((e.clientX - activeDrag.startX) / containerW) * 100;
    const deltaY = ((e.clientY - activeDrag.startY) / containerH) * 100;

    const updated = fields.map((f) => {
      if (f.id !== activeDrag.fieldId) return f;

      if (activeDrag.mode === 'move') {
        const newX = Math.max(0, Math.min(100 - f.widthPercent, activeDrag.initialX + deltaX));
        const newY = Math.max(0, Math.min(100 - f.heightPercent, activeDrag.initialY + deltaY));
        return { ...f, xPercent: Math.round(newX * 10) / 10, yPercent: Math.round(newY * 10) / 10 };
      }

      if (activeDrag.mode === 'se') {
        const newW = Math.max(4, Math.min(100 - f.xPercent, activeDrag.initialW + deltaX));
        let newH = Math.max(2, Math.min(100 - f.yPercent, activeDrag.initialH + deltaY));
        if (f.type === 'signature') {
          const sigObj = f.signatureData || (f.id === 'field-signature' || !f.signatureData ? signature : null);
          const ratio = sigObj?.aspectRatio || 2.5;
          const canvasAspect = template?.aspectRatio || (16 / 9);
          newH = Math.max(2, Math.min(100 - f.yPercent, (newW * canvasAspect) / ratio));
        }
        return { ...f, widthPercent: Math.round(newW * 10) / 10, heightPercent: Math.round(newH * 10) / 10 };
      }

      if (activeDrag.mode === 'e') {
        const newW = Math.max(4, Math.min(100 - f.xPercent, activeDrag.initialW + deltaX));
        return { ...f, widthPercent: Math.round(newW * 10) / 10 };
      }

      if (activeDrag.mode === 's') {
        const newH = Math.max(2, Math.min(100 - f.yPercent, activeDrag.initialH + deltaY));
        return { ...f, heightPercent: Math.round(newH * 10) / 10 };
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
      pushHistory(fields);
    }
  };

  // Rule-based layout AI recommendations
  const generateAiSuggestions = (): AiSuggestion[] => {
    const list: AiSuggestion[] = [];

    fields.forEach((f) => {
      if (!f.enabled) return;

      if (f.type === 'candidate_name') {
        if (!f.fontFamily.toLowerCase().includes('google sans')) {
          list.push({
            id: `google-sans-${f.id}`,
            title: 'Use Google Sans Bold Typography',
            description: 'Apply the official Google Sans Bold font for maximum visual weight and authoritative prestige on the certificate.',
            category: 'typography',
            fieldId: f.id,
            patch: { fontFamily: 'Google Sans Bold', fontWeight: 'bold' },
            actionLabel: 'Apply Google Sans Bold',
          });
        }

        if (f.widthPercent < 50) {
          list.push({
            id: `name-width-${f.id}`,
            title: 'Expand Candidate Name Safe Zone',
            description: 'A width proportion of at least 65% prevents long student and dignitary names from clipping or overflowing.',
            category: 'layout',
            fieldId: f.id,
            patch: { widthPercent: 70, xPercent: 15 },
            actionLabel: 'Set 70% Centered Bounds',
          });
        }
      }

      if (f.xPercent + f.widthPercent > 96) {
        list.push({
          id: `margin-${f.id}`,
          title: `Right Margin Clearance: ${f.label}`,
          description: `Element extends to ${Math.round(f.xPercent + f.widthPercent)}% width, risking print border clipping.`,
          category: 'overflow',
          fieldId: f.id,
          patch: { xPercent: Math.max(0, 96 - f.widthPercent) },
          actionLabel: 'Reposition Inside Margin',
        });
      }
    });

    return list.filter((s) => !dismissedSuggestions.has(s.id));
  };

  const aiSuggestions = generateAiSuggestions();

  const handleApplyAiSuggestion = (suggestion: AiSuggestion) => {
    if (!suggestion.fieldId || !suggestion.patch) return;
    const updated = fields.map((f) =>
      f.id === suggestion.fieldId ? { ...f, ...suggestion.patch } : f
    );
    onUpdateFields(updated);
    pushHistory(updated);
    setDismissedSuggestions((prev) => new Set(prev).add(suggestion.id));
  };

  const handleDismissAiSuggestion = (id: string) => {
    setDismissedSuggestions((prev) => new Set(prev).add(id));
  };

  // Determine current display text for a field in canvas
  const getDisplayValue = (field: CertificateField): string => {
    if (field.type === 'candidate_name') {
      if (participants.length > 0 && participants[activeParticipantIdx]?.name) {
        return participants[activeParticipantIdx].name;
      }
      return testCandidateName || 'Athrav Pathak';
    }

    if (field.type === 'date') {
      if (dateSettings?.mode === 'custom' && dateSettings.customDate) {
        return dateSettings.customDate;
      }
      return '15 November 2026';
    }

    if (field.type === 'cert_id') {
      if (participants.length > 0 && participants[activeParticipantIdx]?.certId) {
        return participants[activeParticipantIdx].certId!;
      }
      return 'ATH-2026-0001';
    }

    if (field.type === 'serial_number') {
      if (participants.length > 0 && participants[activeParticipantIdx]?.serialNumber) {
        return participants[activeParticipantIdx].serialNumber!;
      }
      return '001';
    }

    if (field.type === 'performance') return 'Outstanding Distinction';
    if (field.type === 'rank') return 'First Rank (प्रथम)';
    if (field.type === 'score') return '98.5%';
    if (field.type === 'achievement') return 'Academic Excellence';
    if (field.type === 'event_name') return 'Annual Conference 2026';

    return field.staticValue || 'Sample Field Text';
  };

  return (
    <div className={`space-y-4 animate-fadeIn ${isFullscreen ? 'fixed inset-0 z-50 bg-midnight p-6 overflow-auto' : ''}`}>
      {/* Top Editor Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E8E5DD] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1.5 border-r border-[#E8E5DD] pr-3">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/60 text-[#182536] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/60 text-[#182536] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 border-r border-[#E8E5DD] pr-3">
          <button
            type="button"
            onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}
            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-[#182536] hover:border-gold transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-mono font-bold text-[#182536]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(1.8, zoom + 0.1))}
            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-[#182536] hover:border-gold transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-[#182536] hover:border-gold transition-colors text-xs font-semibold"
            title="100% Zoom"
          >
            100%
          </button>
        </div>

        {/* Participant Switcher (Section 11 & 22) */}
        {participants.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] px-2 py-1 rounded-xl border border-[#E8E5DD]">
            <button
              type="button"
              onClick={() => setActiveParticipantIdx((prev) => (prev > 0 ? prev - 1 : participants.length - 1))}
              className="p-1 rounded text-[#77818C] hover:text-[#182536]"
              title="Previous Participant"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-gold-dark font-bold">
              {activeParticipantIdx + 1}/{participants.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveParticipantIdx((prev) => (prev < participants.length - 1 ? prev + 1 : 0))}
              className="p-1 rounded text-[#77818C] hover:text-[#182536]"
              title="Next Participant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#182536] max-w-[120px] truncate hidden md:inline font-semibold ml-1">
              {participants[activeParticipantIdx]?.name}
            </span>
          </div>
        )}

        {/* View toggles & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showGuidelines
                ? 'bg-gold/15 border-gold text-gold-dark font-bold'
                : 'bg-[#FAF8F5] border-[#E8E5DD] text-[#77818C] hover:text-[#182536]'
            }`}
            title="Toggle alignment guides"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guides</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPreviewMode
                ? 'btn-gold font-bold shadow-xs'
                : 'bg-[#FAF8F5] border-[#E8E5DD] text-[#182536] hover:border-gold'
            }`}
            title="Toggle realistic preview mode"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-[#182536] hover:border-gold transition-colors"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen Preview'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onSaveProject}
            className="btn-gold py-1.5 px-3.5 text-xs font-bold"
            title="Save project locally"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ============================================================== */}
        {/* LEFT PANEL: Certificate Elements (Core + Advanced Accordion)   */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-4 max-h-[820px] overflow-y-auto shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#182536] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-gold" />
                <span>Certificate Elements</span>
              </h4>
              <p className="text-[10px] text-[#77818C] mt-0.5">
                Position name, date and signature
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddNewField('custom_text')}
              className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-gold/20 text-[#182536] border border-[#E8E5DD] hover:border-gold transition-colors"
              title="Add Custom Text Element"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Core Elements (Candidate Name, Date, Signature) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#77818C] block">
              Core Elements
            </span>
            {fields
              .filter((f) => ['candidate_name', 'date', 'signature'].includes(f.type))
              .map((field) => {
                const isSelected = selectedFieldId === field.id;
                const isName = field.type === 'candidate_name';

                return (
                  <div
                    key={field.id}
                    onClick={() => onSelectField(field.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gold/10 border-gold shadow-xs ring-1 ring-gold/40'
                        : 'bg-[#FAF8F5] border-[#E8E5DD] hover:border-gold/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${
                            field.enabled
                              ? 'bg-gold/20 text-gold-dark border border-gold/30'
                              : 'bg-white text-[#77818C]'
                          }`}
                        >
                          {field.type === 'candidate_name' && <Award className="w-3.5 h-3.5" />}
                          {field.type === 'signature' && <PenTool className="w-3.5 h-3.5" />}
                          {field.type === 'date' && <Calendar className="w-3.5 h-3.5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#182536] truncate flex items-center gap-1.5">
                            <span>{field.label}</span>
                            {field.isLocked && <Lock className="w-2.5 h-2.5 text-status-warning" />}
                          </div>
                          <div className="text-[10px] text-[#77818C] truncate">
                            {Math.round(field.xPercent)}% X, {Math.round(field.yPercent)}% Y
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleFieldEnabled(field.id)}
                          className={`p-1 rounded transition-colors ${
                            field.enabled ? 'text-gold-dark' : 'text-[#77818C]/40 hover:text-[#77818C]'
                          }`}
                          title={field.enabled ? 'Enabled' : 'Disabled'}
                        >
                          {field.enabled ? (
                            <ToggleRight className="w-5 h-5 fill-gold/20" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Section 10: Expandable Advanced Certificate Options */}
          <div className="pt-2 border-t border-[#E8E5DD]">
            <button
              type="button"
              onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/50 text-left transition-all"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-bold text-[#182536]">Advanced Certificate Options</span>
                {fields.filter((f) => !['candidate_name', 'date', 'signature'].includes(f.type) && f.enabled).length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-gold/15 text-gold-dark font-bold">
                    {fields.filter((f) => !['candidate_name', 'date', 'signature'].includes(f.type) && f.enabled).length} Active
                  </span>
                )}
              </div>
              {isAdvancedOptionsOpen ? (
                <ChevronUp className="w-4 h-4 text-[#77818C]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#77818C]" />
              )}
            </button>

            {isAdvancedOptionsOpen && (
              <div className="space-y-2 mt-2 animate-fadeIn">
                <p className="text-[10px] text-[#77818C] mb-1">
                  Optional fields with independent ON/OFF switches:
                </p>
                {fields
                  .filter((f) => !['candidate_name', 'date', 'signature'].includes(f.type))
                  .map((field) => {
                    const isSelected = selectedFieldId === field.id;

                    return (
                      <div
                        key={field.id}
                        onClick={() => onSelectField(field.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gold/10 border-gold shadow-xs ring-1 ring-gold/40'
                            : 'bg-white border-[#E8E5DD] hover:border-gold/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center text-[9px] flex-shrink-0 ${
                                field.enabled
                                  ? 'bg-gold/20 text-gold-dark'
                                  : 'bg-[#FAF8F5] text-[#77818C]'
                              }`}
                            >
                              {field.type === 'qr_code' && <QrCode className="w-3 h-3" />}
                              {field.type === 'cert_id' && <Hash className="w-3 h-3" />}
                              {field.type === 'custom_text' && <Type className="w-3 h-3" />}
                              {!['qr_code', 'cert_id', 'custom_text'].includes(field.type) && (
                                <Sliders className="w-3 h-3" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#182536] truncate">
                                {field.label}
                              </div>
                              <div className="text-[9px] text-[#77818C] truncate">
                                {Math.round(field.xPercent)}% X, {Math.round(field.yPercent)}% Y
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleFieldEnabled(field.id)}
                              className={`p-1 rounded transition-colors ${
                                field.enabled ? 'text-gold-dark' : 'text-[#77818C]/40 hover:text-[#77818C]'
                              }`}
                              title={field.enabled ? 'Enabled' : 'Disabled'}
                            >
                              {field.enabled ? (
                                <ToggleRight className="w-5 h-5 fill-gold/20" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteField(field.id)}
                              className="p-1 text-[#77818C] hover:text-status-error transition-colors"
                              title="Remove field"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleAddNewField('custom_text')}
                    className="py-2 px-2.5 rounded-xl border border-dashed border-[#E8E5DD] hover:border-gold text-xs font-semibold text-[#182536] hover:text-gold-dark flex items-center justify-center gap-1.5 bg-[#FAF8F5]"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>Add Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sigCount = fields.filter((f) => f.type === 'signature').length;
                      handleAddNewField('signature', `Signature ${sigCount + 1}`);
                    }}
                    className="py-2 px-2.5 rounded-xl border border-dashed border-[#C4A878] hover:border-[#182536] text-xs font-semibold text-[#182536] flex items-center justify-center gap-1.5 bg-[#FAF8F5] hover:bg-gold/10"
                  >
                    <PenTool className="w-3.5 h-3.5 text-gold" />
                    <span>Add Signature</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#E8E5DD] text-[11px] text-[#77818C] leading-relaxed">
            💡 <strong>Exact Manual Positioning:</strong> Click any element to drag, or select it and use arrow keys for precision nudges.
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER PANEL: Large Certificate Drag & Drop Canvas             */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 rounded-2xl border border-[#E8E5DD] p-4 overflow-hidden flex flex-col items-center justify-center min-h-[580px] max-h-[820px] bg-[#182536] relative shadow-xs">
          {template ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
              <div
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: activeDrag ? 'none' : 'transform 0.15s ease-out',
                }}
                className="relative select-none cert-canvas-shadow rounded-lg overflow-hidden bg-white max-w-full"
              >
                {/* Base Template Image */}
                <img
                  src={template.previewImageUrl}
                  alt={template.name}
                  draggable={false}
                  className="w-full h-auto block pointer-events-none"
                  style={{ minWidth: '650px', maxWidth: '850px' }}
                />

                {/* Overlaid Draggable Fields */}
                <div className="absolute inset-0 pointer-events-auto">
                  {fields.map((field) => {
                    if (!field.enabled) return null;
                    const isSelected = selectedFieldId === field.id && !isPreviewMode;

                    // 1. Signature Element (Supports multiple distinct authority signatures)
                    if (field.type === 'signature') {
                      const sigObj = field.signatureData || (field.id === 'field-signature' || !field.signatureData ? signature : null);
                      return (
                        <div
                          key={field.id}
                          onPointerDown={(e) => handlePointerDown(e, field.id, 'move')}
                          style={{
                            left: `${field.xPercent}%`,
                            top: `${field.yPercent}%`,
                            width: `${field.widthPercent}%`,
                            height: `${field.heightPercent}%`,
                            cursor: field.isLocked ? 'default' : isPreviewMode ? 'default' : 'move',
                            opacity: 1,
                            transform: (field as any).rotation ? `rotate(${(field as any).rotation}deg)` : undefined,
                          }}
                          className={`absolute flex items-center justify-center ${
                            isSelected
                              ? 'ring-2 ring-gold border border-gold bg-gold/10'
                              : showGuidelines && !isPreviewMode
                              ? 'border border-dashed border-gold/50 bg-gold/5'
                              : ''
                          }`}
                        >
                          {sigObj ? (
                            <img
                              src={sigObj.dataUrl}
                              alt={field.label || 'Signature'}
                              className="max-h-full max-w-full object-contain pointer-events-none select-none"
                              style={{
                                opacity: 1,
                                mixBlendMode: 'normal',
                                filter: 'none',
                              }}
                            />
                          ) : (
                            <div className="text-[10px] font-mono text-gold/70 flex items-center gap-1">
                              <PenTool className="w-3 h-3" />
                              <span className="truncate px-1">{field.label || 'Signature Area'}</span>
                            </div>
                          )}

                          {isSelected && !field.isLocked && (
                            <div
                              onPointerDown={(e) => handlePointerDown(e, field.id, 'se')}
                              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gold cursor-se-resize shadow-xs"
                            />
                          )}
                        </div>
                      );
                    }

                    // 2. QR Code Element
                    if (field.type === 'qr_code') {
                      return (
                        <div
                          key={field.id}
                          onPointerDown={(e) => handlePointerDown(e, field.id, 'move')}
                          style={{
                            left: `${field.xPercent}%`,
                            top: `${field.yPercent}%`,
                            width: `${field.widthPercent}%`,
                            height: `${field.heightPercent}%`,
                            cursor: field.isLocked ? 'default' : isPreviewMode ? 'default' : 'move',
                          }}
                          className={`absolute flex items-center justify-center p-1 bg-white rounded shadow-sm ${
                            isSelected
                              ? 'ring-2 ring-gold border border-gold'
                              : showGuidelines && !isPreviewMode
                              ? 'border border-dashed border-midnight-border'
                              : ''
                          }`}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border border-slate-200 text-slate-800 rounded">
                            <QrCode className="w-6 h-6 text-slate-900" />
                            <span className="text-[8px] font-mono font-bold mt-0.5">VERIFY</span>
                          </div>

                          {isSelected && !field.isLocked && (
                            <div
                              onPointerDown={(e) => handlePointerDown(e, field.id, 'se')}
                              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gold cursor-se-resize shadow-xs"
                            />
                          )}
                        </div>
                      );
                    }

                    // 3. Text Fields (Candidate Name, Date, Cert ID, Custom)
                    const sampleText = getDisplayValue(field);

                    let formattedText = sampleText;
                    if (field.transform === 'uppercase') formattedText = formattedText.toUpperCase();
                    if (field.transform === 'capitalize') {
                      formattedText = formattedText
                        .split(' ')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');
                    }

                    const isGoogleSansFont = (field.fontFamily || '').toLowerCase().includes('google sans');
                    const resolvedFontFamily = isGoogleSansFont
                      ? '"Google Sans", "Google Sans Bold", sans-serif'
                      : `"${field.fontFamily}", "Noto Sans Devanagari", "Mukta", sans-serif`;

                    return (
                      <div
                        key={field.id}
                        onPointerDown={(e) => handlePointerDown(e, field.id, 'move')}
                        style={{
                          left: `${field.xPercent}%`,
                          top: `${field.yPercent}%`,
                          width: `${field.widthPercent}%`,
                          height: `${field.heightPercent}%`,
                          cursor: field.isLocked ? 'default' : isPreviewMode ? 'default' : 'move',
                        }}
                        className={`absolute flex items-center ${
                          field.align === 'center'
                            ? 'justify-center text-center'
                            : field.align === 'right'
                            ? 'justify-end text-right'
                            : 'justify-start text-left'
                        } ${
                          isSelected
                            ? 'ring-2 ring-gold border border-gold bg-gold/10'
                            : showGuidelines && !isPreviewMode
                            ? 'border border-dashed border-gold/40 bg-gold/5'
                            : ''
                        }`}
                      >
                        <span
                          style={{
                            fontFamily: resolvedFontFamily,
                            fontSize: `${field.fontSize * 0.7}px`,
                            fontWeight: field.fontWeight === 'bold' || isGoogleSansFont ? 'bold' : 'normal',
                            fontStyle: field.fontStyle,
                            color: field.color,
                            letterSpacing: `${field.letterSpacing || 0}px`,
                            textDecoration: field.underline ? 'underline' : 'none',
                            lineHeight: 1.1,
                          }}
                          className="w-full truncate px-1 pointer-events-none"
                        >
                          {formattedText}
                        </span>

                        {/* Resize Handles (SE, E, S) */}
                        {isSelected && !field.isLocked && (
                          <>
                            <div
                              onPointerDown={(e) => handlePointerDown(e, field.id, 'se')}
                              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-gold cursor-se-resize shadow-xs"
                            />
                            <div
                              onPointerDown={(e) => handlePointerDown(e, field.id, 'e')}
                              className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-4 rounded bg-gold cursor-e-resize shadow-xs"
                            />
                            <div
                              onPointerDown={(e) => handlePointerDown(e, field.id, 's')}
                              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 rounded bg-gold cursor-s-resize shadow-xs"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 py-16 text-secondary-text">
              <Award className="w-12 h-12 mx-auto text-gold opacity-40" />
              <p className="text-sm font-bold text-ivory">No Certificate Template Loaded</p>
              <p className="text-xs max-w-sm">
                Upload your certificate template or choose a sample from the Template Gallery.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('templates')}
                className="btn-gold py-2 px-4 text-xs mt-2"
              >
                Go to Template Gallery
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: Context-Aware Properties (Sections 6, 7, 8)       */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E8E5DD] p-5 space-y-4 max-h-[820px] overflow-y-auto shadow-xs text-[#253246]">
          {/* Header Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E5DD]">
            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'typography'
                  ? 'bg-white text-[#182536] shadow-xs'
                  : 'text-[#77818C] hover:text-[#182536]'
              }`}
            >
              Properties
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai_assistant')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ai_assistant'
                  ? 'bg-white text-[#182536] shadow-xs'
                  : 'text-[#77818C] hover:text-[#182536]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>AI Assistant</span>
              {aiSuggestions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-gold text-midnight text-[9px] font-extrabold flex items-center justify-center">
                  {aiSuggestions.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'typography' && activeField ? (
            <div className="space-y-4">
              {/* ============================================================ */}
              {/* CASE 1: SIGNATURE PROPERTIES (Section 8)                    */}
              {/* ============================================================ */}
              {activeField.type === 'signature' ? (
                <div className="space-y-4">
                  {/* Active Element Header */}
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#77818C]">
                        Active Element
                      </span>
                      <div className="text-xs font-bold text-[#182536] mt-0.5">{activeField.label}</div>
                    </div>
                    {activeField.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-warning/15 border border-status-warning/30 text-status-warning text-[10px] font-semibold">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Signature Preview Thumbnail */}
                  {(() => {
                    const activeSig = activeField.signatureData || (activeField.id === 'field-signature' || !activeField.signatureData ? signature : null);
                    return activeSig ? (
                      <div className="p-3 rounded-xl border border-[#E8E5DD] bg-checkerboard flex items-center justify-center h-28">
                        <img
                          src={activeSig.dataUrl}
                          alt={activeField.label || 'Signature'}
                          className="max-h-full max-w-full object-contain select-none"
                          style={{
                            opacity: 1,
                            mixBlendMode: 'normal',
                            filter: 'none',
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-[#E8E5DD] text-center text-xs text-[#77818C]">
                        No signature image uploaded for {activeField.label} yet.
                      </div>
                    );
                  })()}

                  {/* Sizing Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#182536]">Signature Width</span>
                      <span className="font-mono text-gold-dark bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E5DD]">
                        {Math.round(activeField.widthPercent)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={activeField.widthPercent}
                      onChange={(e) => {
                        const w = Number(e.target.value);
                        const ratio = activeField.signatureData?.aspectRatio || signature?.aspectRatio || 2.5;
                        updateActiveField({
                          widthPercent: w,
                          heightPercent: Math.max(4, Math.round((w / ratio) * 10) / 10),
                        });
                      }}
                      className="w-full accent-gold cursor-pointer"
                    />
                  </div>

                  {/* Reset Position Button */}
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveField({
                        xPercent: 70,
                        yPercent: 78,
                        widthPercent: 22,
                        heightPercent: 12,
                      })
                    }
                    className="btn-secondary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Position</span>
                  </button>

                  {/* Expandable Advanced Settings (X, Y, Lock) */}
                  <div className="pt-2 border-t border-[#E8E5DD]">
                    <button
                      type="button"
                      onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-xs font-bold text-[#182536]"
                    >
                      <span>Advanced Settings</span>
                      {isAdvancedSettingsOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#77818C]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#77818C]" />
                      )}
                    </button>

                    {isAdvancedSettingsOpen && (
                      <div className="p-3 mt-2 rounded-xl border border-[#E8E5DD] bg-[#FAF8F5] space-y-3 animate-fadeIn text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">X Position (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={Math.round(activeField.xPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ xPercent: Math.max(0, Math.min(100, Number(e.target.value))) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">Y Position (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={Math.round(activeField.yPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ yPercent: Math.max(0, Math.min(100, Number(e.target.value))) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E8E5DD]">
                          <span className="text-xs text-[#182536] font-semibold">Lock Position</span>
                          <button
                            type="button"
                            onClick={() => updateActiveField({ isLocked: !activeField.isLocked })}
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                              activeField.isLocked
                                ? 'bg-status-warning/20 border-status-warning text-status-warning'
                                : 'bg-white border-[#E8E5DD] text-[#77818C]'
                            }`}
                          >
                            {activeField.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{activeField.isLocked ? 'Locked' : 'Unlocked'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeField.type === 'qr_code' ? (
                /* ============================================================ */
                /* CASE 2: QR CODE PROPERTIES                                   */
                /* ============================================================ */
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#77818C]">
                        Active Element
                      </span>
                      <div className="text-xs font-bold text-[#182536] mt-0.5">{activeField.label}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#182536]">Verification Payload</label>
                    <select
                      value={activeField.qrSettings?.payloadType || 'cert_id'}
                      onChange={(e) =>
                        updateActiveField({
                          qrSettings: {
                            ...activeField.qrSettings,
                            includeId: true,
                            errorCorrectionLevel: activeField.qrSettings?.errorCorrectionLevel || 'M',
                            payloadType: e.target.value as any,
                          },
                        })
                      }
                      className="input-clean w-full text-xs"
                    >
                      <option value="cert_id">Certificate ID (Unique)</option>
                      <option value="summary">Name + Cert ID Summary</option>
                      <option value="custom_url">Custom Verification URL</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#182536]">QR Size</span>
                      <span className="font-mono text-gold-dark bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E5DD]">
                        {Math.round(activeField.widthPercent)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={activeField.widthPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateActiveField({ widthPercent: val, heightPercent: val });
                      }}
                      className="w-full accent-gold cursor-pointer"
                    />
                  </div>

                  {/* Expandable Advanced Settings */}
                  <div className="pt-2 border-t border-[#E8E5DD]">
                    <button
                      type="button"
                      onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-xs font-bold text-[#182536]"
                    >
                      <span>Advanced Settings</span>
                      {isAdvancedSettingsOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#77818C]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#77818C]" />
                      )}
                    </button>

                    {isAdvancedSettingsOpen && (
                      <div className="p-3 mt-2 rounded-xl border border-[#E8E5DD] bg-[#FAF8F5] space-y-3 animate-fadeIn text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">X Position (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={Math.round(activeField.xPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ xPercent: Number(e.target.value) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">Y Position (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={Math.round(activeField.yPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ yPercent: Number(e.target.value) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E8E5DD]">
                          <span className="text-xs text-[#182536] font-semibold">Lock Position</span>
                          <button
                            type="button"
                            onClick={() => updateActiveField({ isLocked: !activeField.isLocked })}
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                              activeField.isLocked
                                ? 'bg-status-warning/20 border-status-warning text-status-warning'
                                : 'bg-white border-[#E8E5DD] text-[#77818C]'
                            }`}
                          >
                            {activeField.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{activeField.isLocked ? 'Locked' : 'Unlocked'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ============================================================ */
                /* CASE 3: TEXT PROPERTIES (Sections 6 & 7)                     */
                /* ============================================================ */
                <div className="space-y-4">
                  {/* Active Element Header */}
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#77818C]">
                        Active Element
                      </span>
                      <div className="text-xs font-bold text-[#182536] mt-0.5">{activeField.label}</div>
                    </div>
                    {activeField.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-warning/15 border border-status-warning/30 text-status-warning text-[10px] font-semibold">
                        <Lock className="w-3 h-3" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>

                  {/* Dedicated Live Test Candidate Name Input (Candidate Name only) */}
                  {activeField.type === 'candidate_name' && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-gold/10 border border-gold/40">
                      <label className="text-xs font-bold text-[#182536] flex items-center justify-between">
                        <span>Live Test Candidate Name</span>
                        <span className="text-[10px] text-[#77818C] font-normal">Real-time Preview</span>
                      </label>
                      <input
                        type="text"
                        value={testCandidateName}
                        onChange={(e) => setTestCandidateName(e.target.value)}
                        placeholder="Type candidate name (e.g. Athrav Pathak or अथर्व पाठक)"
                        className="input-clean w-full text-xs font-bold text-[#182536] bg-white"
                      />
                    </div>
                  )}

                  {/* 1. Font Family Selector (Section 7: Google Sans Bold default) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#182536]">Font Family</label>
                    <select
                      value={activeField.fontFamily}
                      onChange={(e) => updateActiveField({ fontFamily: e.target.value })}
                      className="input-clean w-full text-xs font-semibold"
                    >
                      <optgroup label="Official Uploaded Font (Bold)">
                        <option value="Google Sans Bold">Google Sans Bold (Default)</option>
                        <option value="Google Sans">Google Sans</option>
                      </optgroup>
                      <optgroup label="Standard &amp; Modern Sans-Serif">
                        <option value="Arial">Arial (Standard)</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Noto Sans">Noto Sans</option>
                        <option value="Inter">Inter</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                      </optgroup>
                      <optgroup label="Marathi &amp; Devanagari Unicode">
                        <option value="Noto Sans Devanagari">Noto Sans Devanagari (मराठी)</option>
                        <option value="Noto Serif Devanagari">Noto Serif Devanagari (मराठी)</option>
                        <option value="Mukta">Mukta</option>
                        <option value="Hind">Hind</option>
                      </optgroup>
                      <optgroup label="Classic Certificate Serif">
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Cinzel">Cinzel</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* 2. Font Size Slider & Number Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#182536]">Font Size</span>
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={activeField.fontSize}
                        onChange={(e) => updateActiveField({ fontSize: Number(e.target.value) || 24 })}
                        className="w-16 px-2 py-0.5 text-center font-mono text-gold-dark bg-[#FAF8F5] rounded border border-[#E8E5DD] text-xs font-bold"
                      />
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={activeField.fontSize}
                      onChange={(e) => updateActiveField({ fontSize: Number(e.target.value) })}
                      className="w-full accent-gold cursor-pointer"
                    />
                  </div>

                  {/* 3. Bold & Italic Controls */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#77818C] block">Text Styling</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateActiveField({ fontWeight: activeField.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                          activeField.fontWeight === 'bold' || activeField.fontFamily.includes('Google Sans')
                            ? 'bg-gold/20 border-gold text-gold-dark font-bold'
                            : 'bg-[#FAF8F5] border-[#E8E5DD] text-[#77818C] hover:text-[#182536]'
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                        <span>Bold</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateActiveField({ fontStyle: activeField.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                          activeField.fontStyle === 'italic'
                            ? 'bg-gold/20 border-gold text-gold-dark font-bold'
                            : 'bg-[#FAF8F5] border-[#E8E5DD] text-[#77818C] hover:text-[#182536]'
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                        <span>Italic</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Text Alignment */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#77818C] block">Alignment</label>
                    <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E8E5DD]">
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'left' })}
                        className={`py-1 flex justify-center rounded ${
                          activeField.align === 'left' ? 'bg-white text-gold-dark font-bold shadow-xs' : 'text-[#77818C]'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'center' })}
                        className={`py-1 flex justify-center rounded ${
                          activeField.align === 'center' ? 'bg-white text-gold-dark font-bold shadow-xs' : 'text-[#77818C]'
                        }`}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActiveField({ align: 'right' })}
                        className={`py-1 flex justify-center rounded ${
                          activeField.align === 'right' ? 'bg-white text-gold-dark font-bold shadow-xs' : 'text-[#77818C]'
                        }`}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 5. Text Color & Swatches */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#182536]">Text Color</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: 'Midnight', hex: '#182536' },
                        { name: 'Gold', hex: '#C4A878' },
                        { name: 'Slate', hex: '#253246' },
                        { name: 'Black', hex: '#000000' },
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => updateActiveField({ color: c.hex })}
                          className={`p-1.5 rounded-lg border text-center transition-all ${
                            activeField.color.toLowerCase() === c.hex.toLowerCase()
                              ? 'border-gold bg-gold/10'
                              : 'border-[#E8E5DD] bg-[#FAF8F5] hover:border-gold/30'
                          }`}
                        >
                          <div
                            style={{ backgroundColor: c.hex }}
                            className="w-4 h-4 rounded-full mx-auto border border-[#E8E5DD] mb-1"
                          />
                          <span className="text-[9px] font-medium text-[#182536] truncate block">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="color"
                        value={activeField.color}
                        onChange={(e) => updateActiveField({ color: e.target.value })}
                        className="w-8 h-8 rounded border border-[#E8E5DD] cursor-pointer bg-white"
                      />
                      <input
                        type="text"
                        value={activeField.color}
                        onChange={(e) => updateActiveField({ color: e.target.value })}
                        className="input-clean flex-1 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Section 7: Expandable Advanced Typography */}
                  <div className="pt-2 border-t border-[#E8E5DD]">
                    <button
                      type="button"
                      onClick={() => setIsAdvancedTypographyOpen(!isAdvancedTypographyOpen)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-xs font-bold text-[#182536]"
                    >
                      <span>Advanced Typography</span>
                      {isAdvancedTypographyOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#77818C]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#77818C]" />
                      )}
                    </button>

                    {isAdvancedTypographyOpen && (
                      <div className="p-3 mt-2 rounded-xl border border-[#E8E5DD] bg-[#FAF8F5] space-y-3 animate-fadeIn text-xs">
                        {/* Letter Spacing */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-[#182536]">Letter Spacing</span>
                            <span className="font-mono text-gold-dark bg-white px-2 py-0.5 rounded border border-[#E8E5DD]">
                              {activeField.letterSpacing || 0} px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-2"
                            max="15"
                            value={activeField.letterSpacing || 0}
                            onChange={(e) => updateActiveField({ letterSpacing: Number(e.target.value) })}
                            className="w-full accent-gold cursor-pointer"
                          />
                        </div>

                        {/* Underline Toggle */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[#182536] font-semibold">Underline Text</span>
                          <button
                            type="button"
                            onClick={() => updateActiveField({ underline: !activeField.underline })}
                            className={`p-1.5 rounded-lg border text-xs font-bold ${
                              activeField.underline
                                ? 'bg-gold/20 border-gold text-gold-dark'
                                : 'bg-white border-[#E8E5DD] text-[#77818C]'
                            }`}
                          >
                            <Underline className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Auto-Fit Toggle */}
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <div className="font-semibold text-[#182536]">Auto-Fit Font Size</div>
                            <div className="text-[10px] text-[#77818C]">Shrinks font if text overflows box</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateActiveField({ autoFit: !activeField.autoFit })}
                            className={`p-1 rounded transition-colors ${
                              activeField.autoFit ? 'text-gold-dark' : 'text-[#77818C]/40'
                            }`}
                          >
                            {activeField.autoFit ? (
                              <ToggleRight className="w-5 h-5 fill-gold/20" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 6: Expandable Advanced Settings (X, Y, Size, Lock, Z-Order) */}
                  <div className="pt-2 border-t border-[#E8E5DD]">
                    <button
                      type="button"
                      onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-xs font-bold text-[#182536]"
                    >
                      <span>Advanced Settings (Position, Size, Lock)</span>
                      {isAdvancedSettingsOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#77818C]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#77818C]" />
                      )}
                    </button>

                    {isAdvancedSettingsOpen && (
                      <div className="p-3 mt-2 rounded-xl border border-[#E8E5DD] bg-[#FAF8F5] space-y-3 animate-fadeIn text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">X Position (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={Math.round(activeField.xPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ xPercent: Math.max(0, Math.min(100, Number(e.target.value))) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">Y Position (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={Math.round(activeField.yPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ yPercent: Math.max(0, Math.min(100, Number(e.target.value))) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">Width (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="2"
                              max="100"
                              value={Math.round(activeField.widthPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ widthPercent: Math.max(2, Math.min(100, Number(e.target.value))) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#77818C] block mb-0.5">Height (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              min="2"
                              max="100"
                              value={Math.round(activeField.heightPercent * 10) / 10}
                              onChange={(e) => updateActiveField({ heightPercent: Math.max(2, Math.min(100, Number(e.target.value))) })}
                              className="input-clean w-full py-1 px-2 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E8E5DD]">
                          <span className="text-xs text-[#182536] font-semibold">Lock Position</span>
                          <button
                            type="button"
                            onClick={() => updateActiveField({ isLocked: !activeField.isLocked })}
                            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                              activeField.isLocked
                                ? 'bg-status-warning/20 border-status-warning text-status-warning'
                                : 'bg-white border-[#E8E5DD] text-[#77818C]'
                            }`}
                          >
                            {activeField.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{activeField.isLocked ? 'Locked' : 'Unlocked'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-[#E8E5DD]">
                          <button
                            type="button"
                            onClick={() => handleDuplicateField(activeField.id)}
                            className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1"
                            title="Duplicate element"
                          >
                            <Copy className="w-3 h-3 text-gold" />
                            <span>Duplicate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBringForward(activeField.id)}
                            className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1"
                            title="Bring Forward"
                          >
                            <ArrowUp className="w-3 h-3" />
                            <span>Forward</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendBackward(activeField.id)}
                            className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1"
                            title="Send Backward"
                          >
                            <ArrowDown className="w-3 h-3" />
                            <span>Backward</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* AI Assistant Suggestions Panel */
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold text-[#182536]">Rule-Based Layout Checks</span>
                </div>
                <span className="text-[10px] text-gold-dark font-mono font-bold">
                  {aiSuggestions.length} Notice(s)
                </span>
              </div>

              {aiSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {aiSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="p-3.5 rounded-xl bg-[#FAF8F5] border border-gold/40 space-y-2 relative"
                    >
                      <div className="text-xs font-bold text-gold-dark">{sug.title}</div>
                      <p className="text-[11px] text-[#77818C] leading-relaxed">
                        {sug.description}
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E8E5DD]">
                        <button
                          type="button"
                          onClick={() => handleDismissAiSuggestion(sug.id)}
                          className="text-[11px] text-[#77818C] hover:text-[#182536] font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyAiSuggestion(sug)}
                          className="btn-gold py-1 px-3 text-[11px]"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{sug.actionLabel || 'Apply'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-[#77818C] space-y-2">
                  <ShieldCheck className="w-8 h-8 mx-auto text-status-success" />
                  <p className="text-xs font-bold text-[#182536]">Layout Checks Passed</p>
                  <p className="text-[11px] text-[#77818C]">
                    All elements are within safe print margins and typography is balanced.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
