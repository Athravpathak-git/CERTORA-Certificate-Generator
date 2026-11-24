import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Award,
  Sparkles,
  Calendar as CalendarIcon,
  PenTool,
  Users,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Sliders,
  RefreshCw,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  ShieldCheck,
  Check,
  RotateCw,
  FolderArchive,
  Save,
  Globe,
  FileType,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Edit2,
  Plus,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import saveAs from 'file-saver';
import confetti from 'canvas-confetti';
import {
  ActiveView,
  CertificateField,
  CertificateTemplate,
  CertIdSettings,
  DateSettings,
  Participant,
  SerialNumberSettings,
  SignatureData,
} from '../types';
import {
  AVAILABLE_MONTHS,
  MonthlyTemplateInfo,
  createMonthlyTemplates,
  createUniversalTemplates,
  UNIVERSAL_TEMPLATE_SPECS,
  getCurrentMonthKey,
} from '../services/templateCatalog';
import { removeSignatureBackground } from '../services/signatureRemover';
import {
  generateParticipantPdf,
  generateCombinedPdf,
  loadPdfTemplate,
  loadImageTemplate,
  loadSignatureFile,
} from '../services/pdfService';
import {
  downloadCertificatesAsZip,
  downloadSingleCertificate,
  downloadCombinedCertificatePdf,
} from '../services/zipService';
import { buildVerificationManifest } from '../services/verificationService';
import { sanitizeFilename } from '../utils/fileSanitizer';
import { parseExcelWorkbook, ExcelWorkbookData } from '../services/excelService';
import { AppLanguage, t } from '../services/i18n';
import { AVAILABLE_FONTS } from '../constants/fonts';
import { SAMPLE_PARTICIPANTS, getDefaultFields } from '../constants/sampleData';

// Shared Components & Modals
import { CertificateCanvas } from './CertificateCanvas';
import { SimpleEditorModal } from './SimpleEditorModal';
import { AboutModal } from './AboutModal';
import { ExcelImportModal } from './ExcelImportModal';
import { SavedProjectsModal } from './SavedProjectsModal';
import { SignatureBrushEditor } from './SignatureBrushEditor';
import { PdfPreviewModal } from './PdfPreviewModal';
import { FontSizeControl } from './FontSizeControl';

interface MainStudioPortalProps {
  // Templates
  template: CertificateTemplate | null;
  templates: CertificateTemplate[];
  activeTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onAddTemplate: (tpl: CertificateTemplate) => void;
  onDeleteTemplate: (id: string) => void;

  // Signature
  signature: SignatureData | null;
  onSignatureLoaded: (sig: SignatureData | null) => void;

  // Fields & Typography
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFields: (fields: CertificateField[]) => void;

  // Participants
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;

  // Settings
  dateSettings: DateSettings;
  onUpdateDateSettings: (ds: DateSettings) => void;
  certIdSettings: CertIdSettings;
  onUpdateCertIdSettings: (cs: CertIdSettings) => void;
  serialSettings: SerialNumberSettings;
  onUpdateSerialSettings: (ss: SerialNumberSettings) => void;

  // Projects & Storage
  storedProjects: any[];
  currentProjectName: string;
  onSaveProject: () => void;
  onLoadProjectById: (id: string) => void;
  onRefreshProjects: () => void;
  onExportProject: () => void;
  onImportProjectFile: (file: File) => void;

  // Language & Branding
  language: AppLanguage;
  onUpdateLanguage: (lang: AppLanguage) => void;
}

export const MainStudioPortal: React.FC<MainStudioPortalProps> = ({
  template,
  templates,
  activeTemplateId,
  onSelectTemplate,
  onAddTemplate,
  onDeleteTemplate,
  signature,
  onSignatureLoaded,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateFields,
  participants,
  onUpdateParticipants,
  dateSettings,
  onUpdateDateSettings,
  certIdSettings,
  onUpdateCertIdSettings,
  serialSettings,
  onUpdateSerialSettings,
  storedProjects,
  currentProjectName,
  onSaveProject,
  onLoadProjectById,
  onRefreshProjects,
  onExportProject,
  onImportProjectFile,
  language,
  onUpdateLanguage,
}) => {
  // Modal states
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isBrushEditorOpen, setIsBrushEditorOpen] = useState(false);
  const [selectedForPdfPreview, setSelectedForPdfPreview] = useState<Participant | null>(null);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Section 1: Certificate Month & Type Selection
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => getCurrentMonthKey());
  const [certificateTypeMode, setCertificateTypeMode] = useState<'both' | 'participant' | 'winner'>('both');
  const [customTemplatePair, setCustomTemplatePair] = useState<{
    winner: CertificateTemplate | null;
    participant: CertificateTemplate | null;
  }>({
    winner: null,
    participant: null,
  });

  // Section 3: Raw Participant Textarea Input & manual editing
  const [rawNamesText, setRawNamesText] = useState<string>('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [newParticipantInput, setNewParticipantInput] = useState<string>('');

  // Section: Collapsible Advanced Options (Collapsed by default!)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Section: Preview Controls
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Section: Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingName, setCurrentGeneratingName] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // File Upload input refs
  const templateUploadRef = useRef<HTMLInputElement>(null);
  const signatureUploadRef = useRef<HTMLInputElement>(null);
  const txtUploadRef = useRef<HTMLInputElement>(null);
  const csvUploadRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const [excelWorkbook, setExcelWorkbook] = useState<ExcelWorkbookData | null>(null);

  // Category filter state for Universal Templates
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('All');

  // Initialize Universal Certificate Templates on mount if templates are empty
  useEffect(() => {
    if (templates.length === 0) {
      const universal = createUniversalTemplates();
      universal.forEach((t) => onAddTemplate(t));
      const { winnerTemplate, participantTemplate } = createMonthlyTemplates(selectedMonthKey);
      onAddTemplate(participantTemplate);
      onAddTemplate(winnerTemplate);
      if (universal.length > 0) {
        onSelectTemplate(universal[0].id);
      }
    }
  }, []);

  // When selectedMonthKey changes, generate and activate monthly templates
  const handleMonthChange = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    const { winnerTemplate, participantTemplate } = createMonthlyTemplates(monthKey);
    onAddTemplate(participantTemplate);
    onAddTemplate(winnerTemplate);
    onSelectTemplate(
      certificateTypeMode === 'winner' ? winnerTemplate.id : participantTemplate.id
    );
  };

  const currentMonthInfo = useMemo(() => {
    return AVAILABLE_MONTHS.find((m) => m.monthKey === selectedMonthKey) || AVAILABLE_MONTHS[10];
  }, [selectedMonthKey]);

  const activeWinnerTemplate = useMemo(() => {
    return (
      customTemplatePair.winner ||
      templates.find((t) => t.category === 'Winner' && t.id.includes(selectedMonthKey)) ||
      templates.find((t) => t.category === 'Winner') ||
      template
    );
  }, [customTemplatePair.winner, templates, selectedMonthKey, template]);

  const activeParticipantTemplate = useMemo(() => {
    return (
      customTemplatePair.participant ||
      templates.find((t) => t.category === 'Participant' && t.id.includes(selectedMonthKey)) ||
      templates.find((t) => t.category === 'Participant') ||
      template
    );
  }, [customTemplatePair.participant, templates, selectedMonthKey, template]);

  // Handle Custom Template Upload (PDF, PNG, JPG)
  const handleCustomTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let newTpl: CertificateTemplate;
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const buf = await file.arrayBuffer();
        newTpl = await loadPdfTemplate(buf, file.name);
      } else {
        newTpl = await loadImageTemplate(file, file.name, 'Custom');
      }

      newTpl.category = 'Custom';
      if (!newTpl.fieldConfig || newTpl.fieldConfig.length === 0) {
        newTpl.fieldConfig = getDefaultFields();
      }
      onAddTemplate(newTpl);
      onSelectTemplate(newTpl.id);
    } catch (err: any) {
      alert('Error loading template: ' + (err?.message || 'Unsupported format'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Multiple Signatures State & Management
  const signatureFields = useMemo(() => {
    return fields.filter((f) => f.type === 'signature');
  }, [fields]);

  const [activeSigFieldId, setActiveSigFieldId] = useState<string>('field-signature');
  const [uploadTargetFieldId, setUploadTargetFieldId] = useState<string | null>(null);

  // Sync activeSigFieldId if selectedFieldId is a signature field on the canvas
  useEffect(() => {
    if (selectedFieldId && fields.some((f) => f.id === selectedFieldId && f.type === 'signature')) {
      setActiveSigFieldId(selectedFieldId);
    }
  }, [selectedFieldId, fields]);

  // Keep activeSigFieldId valid
  const activeSignatureField: CertificateField = useMemo(() => {
    return (
      signatureFields.find((f) => f.id === activeSigFieldId) ||
      signatureFields[0] || {
        id: 'field-signature',
        type: 'signature' as const,
        label: 'Authorized Signature',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature',
        xPercent: 68,
        yPercent: 74,
        widthPercent: 20,
        heightPercent: 10,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        color: '#000000',
        letterSpacing: 0,
        align: 'center' as const,
        autoFit: true,
        transform: 'none' as const,
        rotation: 0,
      }
    );
  }, [signatureFields, activeSigFieldId]);

  const activeSignatureData: SignatureData | null = useMemo(() => {
    return (
      activeSignatureField.signatureData ||
      (activeSignatureField.id === 'field-signature' || !activeSignatureField.signatureData
        ? signature
        : null)
    );
  }, [activeSignatureField, signature]);

  const updateActiveSignatureField = (patch: Partial<CertificateField>) => {
    onUpdateFields(
      fields.map((f) => (f.id === activeSignatureField.id ? { ...f, ...patch } : f))
    );
  };

  // Add a new distinct signature slot and prompt for image upload
  const handleAddNewSignature = () => {
    setUploadTargetFieldId('__NEW__');
    signatureUploadRef.current?.click();
  };

  // Replace image for the currently active signature
  const handleReplaceActiveSignature = () => {
    setUploadTargetFieldId(activeSignatureField.id);
    signatureUploadRef.current?.click();
  };

  // Handle Signature Upload with Automatic Background Remover
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processedSig = await loadSignatureFile(file);

      if (uploadTargetFieldId === '__NEW__') {
        const count = signatureFields.length;
        const newId = `field-signature-${Date.now()}`;
        // Smart non-overlapping placements:
        // Sig 1 (existing): right side (x: 68%, y: 74%)
        // Sig 2: left side (x: 16%, y: 74%)
        // Sig 3: center (x: 42%, y: 74%)
        let defaultX = 68;
        let defaultY = 74;
        if (count === 1) {
          defaultX = 16;
        } else if (count === 2) {
          defaultX = 42;
        } else {
          defaultX = Math.min(76, 12 + (count * 22) % 72);
        }

        const newField: CertificateField = {
          id: newId,
          type: 'signature',
          label: `Signature ${count + 1}`,
          enabled: true,
          isStatic: true,
          staticValue: '',
          fieldKey: `signature_${count + 1}`,
          xPercent: defaultX,
          yPercent: defaultY,
          widthPercent: 18,
          heightPercent: 9,
          fontFamily: 'Inter',
          fontSize: 14,
          fontWeight: 'normal',
          fontStyle: 'normal',
          color: '#000000',
          letterSpacing: 0,
          align: 'center',
          autoFit: true,
          transform: 'none',
          signatureData: processedSig,
          rotation: 0,
        };

        onUpdateFields([...fields, newField]);
        setActiveSigFieldId(newId);
        if (onSelectField) onSelectField(newId);
      } else {
        const targetId = uploadTargetFieldId || activeSignatureField.id;
        onUpdateFields(
          fields.map((f) =>
            f.id === targetId ? { ...f, signatureData: processedSig, enabled: true } : f
          )
        );
        if (targetId === 'field-signature' || targetId === signatureFields[0]?.id) {
          onSignatureLoaded(processedSig);
        }
      }
    } catch (err: any) {
      alert('Error loading signature: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploadTargetFieldId(null);
      if (e.target) e.target.value = '';
    }
  };

  // Reset active signature position to default
  const handleResetActiveSignaturePosition = () => {
    updateActiveSignatureField({
      xPercent: 68,
      yPercent: 74,
      widthPercent: 20,
      heightPercent: 10,
      enabled: true,
      rotation: 0,
    });
  };

  // Rotate active signature 90 deg clockwise
  const handleRotateActiveSignature = () => {
    if (!activeSignatureData) return;
    const currentRot = (activeSignatureField as any).rotation || 0;
    const nextRot = (currentRot + 90) % 360;
    updateActiveSignatureField({ rotation: nextRot });
  };

  // Delete active signature
  const handleDeleteActiveSignature = () => {
    if (signatureFields.length > 1) {
      const remaining = fields.filter((f) => f.id !== activeSignatureField.id);
      onUpdateFields(remaining);
      const remainingSig = remaining.find((f) => f.type === 'signature');
      if (remainingSig) {
        setActiveSigFieldId(remainingSig.id);
        if (onSelectField) onSelectField(remainingSig.id);
      }
    } else {
      onSignatureLoaded(null);
      onUpdateFields(
        fields.map((f) =>
          f.id === activeSignatureField.id
            ? { ...f, signatureData: undefined, enabled: false }
            : f
        )
      );
    }
  };

  // Synchronize raw textarea with participants list across Universal Templates
  const parseNamesText = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Get active template's dynamic non-signature fields
    const dynamicFields = fields.filter(
      (f) => f.enabled && f.type !== 'signature' && f.type !== 'qr_code' && f.type !== 'candidate_name'
    );

    const parsed: Participant[] = lines.map((line, idx) => {
      let name = line;
      const participantFields: Record<string, string> = {};

      if (line.includes(',') || line.includes('\t')) {
        const delimiter = line.includes('\t') ? '\t' : ',';
        const parts = line.split(delimiter).map((p) => p.trim());

        if (parts.length > 1) {
          name = parts[0];

          // Check if it's a simple 2-part tag line with W / WINNER or P / PARTICIPANT
          const secondTag = parts[1].toUpperCase();
          if (parts.length === 2 && (secondTag === 'W' || secondTag === 'WINNER' || secondTag === 'P' || secondTag === 'PARTICIPANT')) {
            const isWinner = secondTag === 'W' || secondTag === 'WINNER';
            participantFields['type'] = isWinner ? 'Winner' : 'Participant';
            participantFields['achievement'] = isWinner ? 'Winner' : 'Participant';
          } else {
            // Map remaining columns to template's dynamic fields
            for (let c = 1; c < parts.length; c++) {
              const targetField = dynamicFields[c - 1];
              if (targetField) {
                participantFields[targetField.fieldKey] = parts[c];
              }
            }
          }
        }
      }

      // Respect requirement: Certificate ID is optional and not forced
      const certId = certIdSettings.enabled
        ? `${certIdSettings.prefix}-${certIdSettings.year}-${(certIdSettings.startNumber + idx).toString().padStart(certIdSettings.paddingLength, '0')}`
        : undefined;

      const filename = `${name.replace(/\s+/g, '_')}.pdf`;

      return {
        id: `p-${idx + 1}-${Date.now()}`,
        name,
        certId,
        generatedFilename: filename,
        fields: participantFields,
        status: 'pending',
      };
    });

    onUpdateParticipants(parsed);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawNamesText(val);
    parseNamesText(val);
  };

  // Pre-fill textarea when participants update from outside
  useEffect(() => {
    if (participants.length > 0 && rawNamesText === '') {
      const lines = participants.map((p) => {
        const isWin = p.fields?.type === 'Winner' || p.fields?.achievement === 'Winner';
        return isWin ? `${p.name}, W` : `${p.name}`;
      });
      setRawNamesText(lines.join('\n'));
    }
  }, [participants]);

  // Load Sample Names (3 Demo participants)
  const handleLoadSampleNames = () => {
    const samples = [
      { name: 'Athrav Pathak', type: 'Winner' },
      { name: 'Rahul Patil', type: 'Participant' },
      { name: 'Priya Sharma', type: 'Winner' },
    ];
    const text = samples.map((s) => (s.type === 'Winner' ? `${s.name}, W` : s.name)).join('\n');
    setRawNamesText(text);
    parseNamesText(text);
  };

  // Add individual participant
  const handleAddSingleParticipant = () => {
    if (!newParticipantInput.trim()) return;
    const updatedText = rawNamesText
      ? `${rawNamesText}\n${newParticipantInput.trim()}`
      : newParticipantInput.trim();
    setRawNamesText(updatedText);
    parseNamesText(updatedText);
    setNewParticipantInput('');
  };

  // Delete individual participant
  const handleDeleteParticipant = (id: string) => {
    const filtered = participants.filter((p) => p.id !== id);
    onUpdateParticipants(filtered);
    const updatedText = filtered
      .map((p) => {
        const isWin = p.fields?.type === 'Winner';
        return isWin ? `${p.name}, W` : p.name;
      })
      .join('\n');
    setRawNamesText(updatedText);
  };

  // Save edited participant name
  const handleSaveEditedName = (id: string) => {
    if (!editingNameValue.trim()) return;
    const updated = participants.map((p) =>
      p.id === id ? { ...p, name: editingNameValue.trim(), generatedFilename: `${editingNameValue.trim().replace(/\s+/g, '_')}.pdf` } : p
    );
    onUpdateParticipants(updated);
    const updatedText = updated
      .map((p) => {
        const isWin = p.fields?.type === 'Winner';
        return isWin ? `${p.name}, W` : p.name;
      })
      .join('\n');
    setRawNamesText(updatedText);
    setEditingParticipantId(null);
  };

  // Clear list
  const handleClearList = () => {
    setRawNamesText('');
    onUpdateParticipants([]);
  };

  // Import TXT file
  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawNamesText(content);
        parseNamesText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import CSV file
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const lines = content
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        const dataLines =
          lines.length > 0 && lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;
        const joined = dataLines.join('\n');
        setRawNamesText(joined);
        parseNamesText(joined);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import Excel (.xlsx) file
  const handleExcelFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseExcelWorkbook(file);
      setExcelWorkbook(data);
      setIsExcelOpen(true);
    } catch (err: any) {
      alert('Failed to read Excel workbook: ' + (err?.message || 'Invalid format'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Compute Participant Counts and check duplicates
  const participantStats = useMemo(() => {
    const namesSet = new Set<string>();
    let duplicateCount = 0;
    participants.forEach((p) => {
      const lower = p.name.toLowerCase();
      if (namesSet.has(lower)) duplicateCount++;
      else namesSet.add(lower);
    });

    return {
      total: participants.length,
      duplicateCount,
    };
  }, [participants]);

  // Date Formatter helper
  const formattedDate = useMemo(() => {
    let dateObj: Date;
    if (dateSettings.mode === 'today') {
      dateObj = new Date();
    } else {
      dateObj = new Date(dateSettings.customDate);
      if (isNaN(dateObj.getTime())) dateObj = new Date();
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const monthLong = dateObj.toLocaleDateString('en-US', { month: 'long' });
    const monthNum = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();

    switch (dateSettings.format) {
      case 'MM/DD/YYYY':
        return `${monthNum}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${monthNum}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${monthNum}-${day}`;
      case 'Month DD, YYYY':
        return `${monthLong} ${day}, ${year}`;
      case 'DD Month YYYY':
      default:
        return `${day} ${monthLong} ${year}`;
    }
  }, [dateSettings]);

  // Active Participant for Live Preview
  const currentPreviewParticipant = useMemo(() => {
    if (participants.length === 0) return null;
    const safeIdx = Math.max(0, Math.min(previewIndex, participants.length - 1));
    return participants[safeIdx];
  }, [participants, previewIndex]);

  const currentPreviewTemplate = useMemo(() => {
    if (!currentPreviewParticipant) return template;
    const isWin =
      currentPreviewParticipant.fields?.type === 'Winner' ||
      currentPreviewParticipant.fields?.achievement === 'Winner';
    return isWin ? activeWinnerTemplate : activeParticipantTemplate;
  }, [currentPreviewParticipant, activeWinnerTemplate, activeParticipantTemplate, template]);

  // Candidate Name Field in state
  const candidateNameField = fields.find((f) => f.type === 'candidate_name');

  // Text fields available for live typography & font size adjustments
  const textFields = useMemo(
    () => fields.filter((f) => f.enabled && f.type !== 'signature' && f.type !== 'qr_code'),
    [fields]
  );
  const activeTextControlField =
    textFields.find((f) => f.id === selectedFieldId) ||
    textFields.find((f) => f.type === 'candidate_name') ||
    textFields[0];

  const handleUpdateFont = (fontName: string) => {
    const selected = AVAILABLE_FONTS.find((f) => f.name === fontName);
    onUpdateFields(
      fields.map((f) =>
        f.type === 'candidate_name'
          ? {
              ...f,
              fontFamily: selected ? selected.family : fontName,
              pdfFontFamily: selected?.pdfLibFont,
            }
          : f
      )
    );
  };

  // Filter participants for preview search
  const filteredParticipants = useMemo(() => {
    if (!searchTerm.trim()) return participants;
    return participants.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [participants, searchTerm]);

  // Batch Certificate Generation
  const handleGenerateCertificates = async () => {
    if (participants.length === 0) {
      alert('Please add at least one participant before generating certificates.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCompletedCount(0);
    setErrorCount(0);

    const usedFilenames = new Set<string>();
    const updated = [...participants];

    for (let i = 0; i < updated.length; i++) {
      const p = updated[i];
      setCurrentGeneratingName(p.name);

      // Universal template resolution: If monthly dual template, honor Winner/Participant; otherwise use selected template
      let targetTemplate = template;
      if (template?.id?.startsWith('tpl-0') || template?.id?.startsWith('tpl-1')) {
        const isWin = p.fields?.type === 'Winner' || p.fields?.achievement === 'Winner';
        targetTemplate = (isWin ? activeWinnerTemplate : activeParticipantTemplate) || template;
      }

      if (!targetTemplate) {
        throw new Error('No certificate template available.');
      }

      // Universal field resolution: ALWAYS use current active fields
      const activeFieldsToUse = fields && fields.length > 0 ? fields : (targetTemplate.fieldConfig || []);

      // Filename automatically uses participant name without unnecessary IDs
      const filename = sanitizeFilename(p.name, usedFilenames);
      p.generatedFilename = filename;

      try {
        await new Promise((r) => setTimeout(r, 12));
        const blob = await generateParticipantPdf(
          targetTemplate,
          signature,
          activeFieldsToUse,
          p,
          formattedDate
        );

        p.pdfBlob = blob;
        p.pdfUrl = URL.createObjectURL(blob);
        p.status = 'ready';
        p.error = undefined;
        setCompletedCount((c) => c + 1);
      } catch (err: any) {
        console.error(`Generation error for ${p.name}:`, err);
        p.status = 'error';
        p.error = err?.message || 'PDF render failed';
        setErrorCount((e) => e + 1);
      }

      setGenerationProgress(Math.round(((i + 1) / updated.length) * 100));
      onUpdateParticipants([...updated]);
    }

    setIsGenerating(false);

    try {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    } catch {}
  };

  const readyParticipants = useMemo(() => {
    return participants.filter((p) => p.status === 'ready' && p.pdfBlob);
  }, [participants]);

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    if (readyParticipants.length === 0) {
      alert('Please generate certificates first before downloading the ZIP.');
      return;
    }
    setIsZipping(true);
    setZipProgress(0);

    try {
      const manifest = buildVerificationManifest(
        readyParticipants,
        currentPreviewTemplate?.name || 'Certificate_Template'
      );

      const cleanTplName = (template?.name || 'Certificates').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadCertificatesAsZip(
        readyParticipants,
        `${cleanTplName}_Batch.zip`,
        manifest,
        (pct) => setZipProgress(pct)
      );
    } catch (err: any) {
      alert('Error creating ZIP archive: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  // Download Combined PDF
  const handleDownloadCombinedPdf = async () => {
    if (readyParticipants.length === 0) return;
    const targetTemplate = template || activeParticipantTemplate;
    if (!targetTemplate) {
      alert('No template available to compile combined PDF.');
      return;
    }
    const activeFieldsToUse = fields && fields.length > 0 ? fields : (targetTemplate.fieldConfig || []);
    try {
      const combinedBlob = await generateCombinedPdf(
        targetTemplate,
        signature,
        activeFieldsToUse,
        readyParticipants,
        formattedDate
      );
      const cleanTplName = (template?.name || 'Certificates').replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadCombinedCertificatePdf(
        combinedBlob,
        `${cleanTplName}_Combined.pdf`
      );
    } catch (err: any) {
      alert('Error compiling combined PDF: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#253246] flex flex-col font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER (CERTORA + Official Logo)                        */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#182536] border-b border-[#C4A878]/30 text-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-auto max-w-[130px] flex items-center justify-center shrink-0">
              <img
                src="/images/certora_logo.png"
                alt="CERTORA Logo"
                className="h-full w-auto object-contain max-h-11"
              />
            </div>
            <div className="hidden sm:block border-l border-[#C4A878]/30 pl-3">
              <span className="font-extrabold text-base tracking-wider text-[#F5F1E8] block leading-tight">
                CERTORA
              </span>
              <span className="text-[10px] text-[#C4A878] font-medium tracking-wide block">
                Create. Certify. Celebrate.
              </span>
              <span className="text-[9px] text-[#77818C] block">
                Developed by <strong className="text-[#F5F1E8]">Athrav Pathak</strong>
              </span>
            </div>
          </div>

          {/* Right Navigation & Socials */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onUpdateLanguage(language === 'en' ? 'mr' : 'en')}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#263B50] hover:bg-slate-700 text-xs font-semibold text-[#F5F1E8] border border-[#C4A878]/30 flex items-center gap-1.5 transition-colors"
              title="Toggle English / Marathi"
            >
              <Globe className="w-3.5 h-3.5 text-[#C4A878]" />
              <span className="hidden sm:inline">{language === 'en' ? 'मराठी' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-transparent hover:bg-slate-800 text-xs text-[#F5F1E8] font-medium transition-colors"
            >
              About
            </button>

            <a
              href="https://www.linkedin.com/in/athrav-pathak-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#263B50] hover:bg-[#0A66C2] text-[#F5F1E8] hover:text-white border border-[#C4A878]/30 transition-all active:scale-95"
              title="Athrav Pathak on LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 1.64 1.64 1.64 1.64 0 0 0-1.64-1.64Z" />
              </svg>
            </a>

            <a
              href="https://github.com/Athravpathak-git"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#263B50] hover:bg-slate-700 text-[#F5F1E8] hover:text-white border border-[#C4A878]/30 transition-all active:scale-95"
              title="Athrav Pathak on GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
            </a>

            <button
              type="button"
              onClick={() => setIsProjectsOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#263B50] hover:bg-slate-700 text-xs font-semibold text-[#F5F1E8] border border-[#C4A878]/30 flex items-center gap-1.5 transition-colors"
              title="Open Saved Projects"
            >
              <FolderArchive className="w-3.5 h-3.5 text-[#C4A878]" />
              <span className="hidden md:inline">Projects</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION (Simple, Direct, Beautiful)                    */}
      {/* ============================================================== */}
      <section className="text-center pt-8 pb-6 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#182536] tracking-tight">
          Create Certificates in Minutes
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#77818C] leading-relaxed max-w-xl mx-auto">
          Upload your certificate, add your signature, enter participant names and generate professional certificates effortlessly.
        </p>
      </section>

      {/* ============================================================== */}
      {/* 3. MAIN CERTIFICATE STUDIO FORM (Single-Page Experience)       */}
      {/* ============================================================== */}
      <main className="max-w-3xl w-full mx-auto px-4 pb-16 space-y-6">
        <div className="bg-white rounded-3xl border border-[#E8E5DD] shadow-sm p-6 sm:p-8 space-y-8">
          {/* ---------------------------------------------------------- */}
          {/* STEP 1: UNIVERSAL EDITABLE CERTIFICATE TEMPLATES           */}
          {/* ---------------------------------------------------------- */}
          <div className="space-y-4 pb-6 border-b border-[#E8E5DD]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#182536] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#182536] text-[#C4A878] text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <span>Select Certificate Template ({templates.length})</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => templateUploadRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C4A878]" />
                  <span>Upload Custom (PDF / Image)</span>
                </button>
                <input
                  ref={templateUploadRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={handleCustomTemplateUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#182536] hover:bg-[#223348] text-[#C4A878] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Fields &amp; Layout</span>
                </button>
              </div>
            </div>

            {/* Template Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {['All', 'Participation', 'Achievement', 'Completion', 'Internship', 'Appreciation', 'Workshop', 'Monthly 2026', 'Custom'].map((cat) => {
                const isActive = templateCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTemplateCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#182536] text-[#F5F1E8] shadow-xs font-bold'
                        : 'bg-[#FAF8F5] text-[#77818C] hover:text-[#182536] hover:bg-white border border-[#E8E5DD]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Universal Template Cards Carousel / Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1 pr-1.5 scrollbar-thin">
              {templates
                .filter((t) => {
                  if (templateCategoryFilter === 'All') return true;
                  if (templateCategoryFilter === 'Monthly 2026') {
                    return t.category === 'Winner' || t.category === 'Participant' || t.id.startsWith('tpl-0') || t.id.startsWith('tpl-1');
                  }
                  return t.category.toLowerCase() === templateCategoryFilter.toLowerCase();
                })
                .map((tpl) => {
                  const isSelected = (template && template.id === tpl.id) || activeTemplateId === tpl.id;
                  const fieldCount = tpl.fieldConfig?.length || fields.length;

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => onSelectTemplate(tpl.id)}
                      className={`group p-2.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                        isSelected
                          ? 'border-[#C4A878] bg-[#FAF8F5] shadow-xs ring-2 ring-[#C4A878]/50'
                          : 'border-[#E8E5DD] bg-white hover:border-[#C4A878]/60 hover:shadow-2xs'
                      }`}
                    >
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#182536] text-[#C4A878] flex items-center justify-center shadow-xs z-10">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Thumbnail Preview */}
                      <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden border border-[#E8E5DD] mb-2 flex items-center justify-center relative">
                        {tpl.previewImageUrl ? (
                          <img
                            src={tpl.previewImageUrl}
                            alt={tpl.name}
                            className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Meta */}
                      <div>
                        <h4 className="text-xs font-bold text-[#182536] truncate leading-tight">
                          {tpl.name.replace(/_/g, ' ').replace('.png', '')}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-[#77818C] mt-1">
                          <span className="font-semibold text-[#C4A878]">{tpl.category}</span>
                          <span>{fieldCount} fields</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Monthly Controls (Visible only for monthly templates) */}
            {(templateCategoryFilter === 'Monthly 2026' || template?.id?.startsWith('tpl-0') || template?.id?.startsWith('tpl-1')) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FAF8F5] rounded-2xl border border-[#E8E5DD] text-xs">
                <div>
                  <label className="text-[11px] font-bold text-[#77818C] block mb-1">Select Event Month</label>
                  <select
                    value={selectedMonthKey}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="input-clean text-xs py-1.5 w-full font-medium"
                  >
                    {AVAILABLE_MONTHS.map((m) => (
                      <option key={m.monthKey} value={m.monthKey}>
                        {m.monthName} 2026 ({m.themeTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#77818C] block mb-1">Category Mode</label>
                  <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-[#E8E5DD] text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setCertificateTypeMode('both');
                        if (activeParticipantTemplate) onSelectTemplate(activeParticipantTemplate.id);
                      }}
                      className={`py-1 px-2 rounded-lg font-bold text-center transition-all ${
                        certificateTypeMode === 'both' ? 'bg-[#182536] text-[#F5F1E8]' : 'text-[#77818C]'
                      }`}
                    >
                      Dual
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCertificateTypeMode('participant');
                        if (activeParticipantTemplate) onSelectTemplate(activeParticipantTemplate.id);
                      }}
                      className={`py-1 px-2 rounded-lg font-bold text-center transition-all ${
                        certificateTypeMode === 'participant' ? 'bg-[#182536] text-[#F5F1E8]' : 'text-[#77818C]'
                      }`}
                    >
                      Participant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCertificateTypeMode('winner');
                        if (activeWinnerTemplate) onSelectTemplate(activeWinnerTemplate.id);
                      }}
                      className={`py-1 px-2 rounded-lg font-bold text-center transition-all ${
                        certificateTypeMode === 'winner' ? 'bg-[#182536] text-[#F5F1E8]' : 'text-[#77818C]'
                      }`}
                    >
                      Winner
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Template Dynamic Fields Quick Editor Bar */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E5DD] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#182536]">
                    Configured Fields for {template?.name || 'Current Template'}:
                  </span>
                  <span className="text-[10px] font-mono text-[#77818C] bg-white px-2 py-0.5 rounded border border-[#E8E5DD]">
                    {fields.filter((f) => f.enabled).length} active fields
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const count = fields.filter((f) => f.type === 'custom_text').length;
                      const newId = `field-custom-${Date.now()}`;
                      const defaultKey = `field_${count + 1}`;
                      const newField: CertificateField = {
                        id: newId,
                        type: 'custom_text',
                        label: `Dynamic Field ${count + 1}`,
                        placeholder: `{{${defaultKey}}}`,
                        enabled: true,
                        isStatic: false,
                        staticValue: `{{${defaultKey}}}`,
                        fieldKey: defaultKey,
                        xPercent: 25,
                        yPercent: Math.min(75, 48 + count * 5),
                        widthPercent: 50,
                        heightPercent: 4.5,
                        fontFamily: 'Montserrat',
                        fontSize: 16,
                        fontWeight: '600',
                        fontStyle: 'normal',
                        color: '#253246',
                        letterSpacing: 0.5,
                        align: 'center',
                        autoFit: true,
                        transform: 'none',
                      };
                      onUpdateFields([...fields, newField]);
                      onSelectField(newField.id);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                    title="Add a dynamic field that replaces with participant spreadsheet data"
                  >
                    <Plus className="w-3 h-3 text-[#C4A878]" />
                    <span>Add Dynamic Field</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-[#182536] text-[#C4A878] text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Open Editor</span>
                  </button>
                </div>
              </div>

              {/* Fields Pills List */}
              <div className="flex flex-wrap items-center gap-1.5">
                {fields.map((f) => {
                  const isSelected = selectedFieldId === f.id;
                  const isSignature = f.type === 'signature';
                  const isName = f.type === 'candidate_name';

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectField(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#182536] text-[#F5F1E8] border-[#182536] shadow-xs'
                          : 'bg-white border-[#E8E5DD] text-[#253246] hover:border-[#C4A878]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSignature ? 'bg-emerald-500' : isName ? 'bg-[#C4A878]' : 'bg-blue-500'}`} />
                      <span>{f.label}</span>
                      {f.placeholder && (
                        <span className={`font-mono text-[9px] ${isSelected ? 'text-[#C4A878]' : 'text-[#77818C]'}`}>
                          {f.placeholder}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* STEP 2: MULTIPLE SIGNATURE STUDIO & PLACEMENT             */}
          {/* ---------------------------------------------------------- */}
          <div className="space-y-4 pb-6 border-b border-[#E8E5DD]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#182536] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#182536] text-[#C4A878] text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <span>Signatures ({signatureFields.filter(f => f.enabled && (f.signatureData || signature)).length})</span>
              </label>

              <div className="flex items-center gap-2">
                {activeSignatureData && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Transparent Black Ink Active</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleAddNewSignature}
                  className="px-3 py-1.5 rounded-xl bg-[#182536] hover:bg-[#223348] text-[#C4A878] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  title="Add another signature authority (Principal, Director, Organizer, etc.)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Signature</span>
                </button>
              </div>
            </div>

            {/* Signature Switcher Tabs (when 1 or more signatures exist) */}
            {signatureFields.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {signatureFields.map((sigF, idx) => {
                  const isCurrent = sigF.id === activeSignatureField.id;
                  const hasImg = !!(sigF.signatureData || (sigF.id === 'field-signature' && signature));
                  return (
                    <button
                      key={sigF.id}
                      type="button"
                      onClick={() => {
                        setActiveSigFieldId(sigF.id);
                        if (onSelectField) onSelectField(sigF.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all whitespace-nowrap ${
                        isCurrent
                          ? 'bg-white border-[#C4A878] text-[#182536] shadow-xs ring-1 ring-[#C4A878]/30 font-bold'
                          : 'bg-[#FAF8F5] border-[#E8E5DD] text-[#77818C] hover:text-[#182536] hover:bg-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${hasImg ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <span>{sigF.label || `Signature ${idx + 1}`}</span>
                      <span className="font-mono text-[10px] text-[#77818C]">
                        {Math.round(sigF.xPercent)}%, {Math.round(sigF.yPercent)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Signature Management Card */}
            {activeSignatureData ? (
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E5DD] space-y-4">
                {/* Title / Authority Label input */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <span className="text-[11px] font-bold text-[#77818C] whitespace-nowrap">Authority / Title:</span>
                    <input
                      type="text"
                      value={activeSignatureField.label || ''}
                      onChange={(e) => updateActiveSignatureField({ label: e.target.value })}
                      placeholder="e.g. Principal, Director, Organizer"
                      className="px-3 py-1 text-xs rounded-lg border border-[#E8E5DD] bg-white text-[#182536] font-semibold focus:outline-none focus:border-[#C4A878] w-full"
                    />
                  </div>

                  <div className="text-[11px] text-[#77818C] font-mono">
                    ID: {activeSignatureField.id}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Transparent Checkerboard Signature Box */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-48 h-20 rounded-xl border border-[#E8E5DD] flex items-center justify-center p-2 overflow-hidden shadow-2xs relative bg-white"
                      style={{
                        backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px), radial-gradient(#CBD5E1 1px, #FFFFFF 1px)`,
                        backgroundSize: '12px 12px',
                      }}
                    >
                      <img
                        src={activeSignatureData.dataUrl}
                        alt={activeSignatureField.label || 'Signature'}
                        className="max-h-full max-w-full object-contain pointer-events-none select-none"
                        style={{
                          opacity: 1,
                          mixBlendMode: 'normal',
                          filter: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#182536]">{activeSignatureData.name}</h4>
                      <p className="text-[11px] text-[#77818C]">
                        Transparent PNG • Pure Black Ink (#000000)
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBrushEditorOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                      title="Fine-tune edges and brush"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#C4A878]" />
                      <span>Fine-Tune Brush</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRotateActiveSignature}
                      className="p-1.5 rounded-xl bg-white border border-[#E8E5DD] text-[#77818C] hover:text-[#182536]"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleResetActiveSignaturePosition}
                      className="p-1.5 rounded-xl bg-white border border-[#E8E5DD] text-[#77818C] hover:text-[#182536]"
                      title="Reset position to default"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleReplaceActiveSignature}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] text-[#77818C] hover:text-[#182536] text-xs font-semibold"
                    >
                      Replace Image
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteActiveSignature}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50"
                      title="Delete this signature"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Direct Position & Dimension Sliders */}
                <div className="pt-3 border-t border-[#E8E5DD] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-[#77818C] mb-1">
                      <span>Horizontal (X Position)</span>
                      <span className="font-mono text-[#182536] font-bold">{Math.round(activeSignatureField.xPercent)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={100 - activeSignatureField.widthPercent}
                      value={activeSignatureField.xPercent}
                      onChange={(e) => updateActiveSignatureField({ xPercent: Number(e.target.value) })}
                      className="w-full accent-[#182536] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#77818C] mb-1">
                      <span>Vertical (Y Position)</span>
                      <span className="font-mono text-[#182536] font-bold">{Math.round(activeSignatureField.yPercent)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={100 - activeSignatureField.heightPercent}
                      value={activeSignatureField.yPercent}
                      onChange={(e) => updateActiveSignatureField({ yPercent: Number(e.target.value) })}
                      className="w-full accent-[#182536] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#77818C] mb-1">
                      <span>Size Scale (Aspect Ratio Preserved)</span>
                      <span className="font-mono text-[#182536] font-bold">{Math.round(activeSignatureField.widthPercent)}%</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="40"
                      value={activeSignatureField.widthPercent}
                      onChange={(e) => {
                        const newW = Number(e.target.value);
                        const ratio = activeSignatureData?.aspectRatio || 2.5;
                        const newH = Math.max(3, Math.round((newW / ratio) * 10) / 10);
                        updateActiveSignatureField({ widthPercent: newW, heightPercent: newH });
                      }}
                      className="w-full accent-[#182536] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#77818C] flex items-center justify-between pt-1">
                  <span>💡 Drag and drop each signature directly on the certificate preview to reposition freely.</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setUploadTargetFieldId(activeSignatureField.id);
                  signatureUploadRef.current?.click();
                }}
                className="p-6 rounded-2xl border-2 border-dashed border-[#E8E5DD] hover:border-[#C4A878] bg-[#FAF8F5] text-center cursor-pointer transition-all hover:bg-white space-y-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E5DD] text-[#C4A878] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#182536]">
                  Click to upload signature image (PNG, JPG)
                </h4>
                <p className="text-[11px] text-[#77818C]">
                  White/light background is automatically removed into transparent PNG with pure black ink (#000000).
                </p>
              </div>
            )}

            <input
              ref={signatureUploadRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleSignatureUpload}
              className="hidden"
            />
          </div>

          {/* ---------------------------------------------------------- */}
          {/* STEP 3: ADD PARTICIPANT NAMES                              */}
          {/* ---------------------------------------------------------- */}
          <div className="space-y-4 pb-6 border-b border-[#E8E5DD]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#182536] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#182536] text-[#C4A878] text-[11px] font-bold flex items-center justify-center">
                  3
                </span>
                <span>Add Participant Names</span>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#182536]">
                  Total: {participantStats.total} participants
                </span>
                {participantStats.duplicateCount > 0 && (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] font-bold">
                    {participantStats.duplicateCount} duplicate(s)
                  </span>
                )}
              </div>
            </div>

            {/* Simple Textarea */}
            <div>
              <textarea
                rows={5}
                value={rawNamesText}
                onChange={handleTextareaChange}
                placeholder={`Paste participant names here, one name per line.\n\nExample:\nAthrav Pathak\nRahul Patil\nPriya Sharma`}
                className="input-clean w-full text-xs font-mono p-3.5 leading-relaxed resize-y"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleNames}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C4A878]" />
                  <span>Load Sample Names</span>
                </button>

                <button
                  type="button"
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Import Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => csvUploadRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] text-[#77818C] hover:text-[#182536] text-xs font-semibold shadow-2xs"
                >
                  Import CSV
                </button>

                <button
                  type="button"
                  onClick={() => txtUploadRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] text-[#77818C] hover:text-[#182536] text-xs font-semibold shadow-2xs"
                >
                  Import TXT
                </button>
              </div>

              {rawNamesText && (
                <button
                  type="button"
                  onClick={handleClearList}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                >
                  Clear List
                </button>
              )}

              <input
                ref={csvUploadRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <input
                ref={txtUploadRef}
                type="file"
                accept=".txt"
                onChange={handleTxtUpload}
                className="hidden"
              />
              <input
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFilePicked}
                className="hidden"
              />
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* STEP 4: LIVE CERTIFICATE PREVIEW (Interactive Canvas)      */}
          {/* ---------------------------------------------------------- */}
          <div className="space-y-4 pb-6 border-b border-[#E8E5DD]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#182536] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#182536] text-[#C4A878] text-[11px] font-bold flex items-center justify-center">
                  4
                </span>
                <span>Live Certificate Preview</span>
              </label>

              {/* Essential Zoom & View Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                  className="p-1.5 rounded-lg border border-[#E8E5DD] text-[#182536] hover:bg-slate-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs px-1 text-slate-500">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}
                  className="p-1.5 rounded-lg border border-[#E8E5DD] text-[#182536] hover:bg-slate-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(1)}
                  className="p-1.5 rounded-lg border border-[#E8E5DD] text-[#182536] hover:bg-slate-100"
                  title="Fit to Screen / Reset View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreenPreview(true)}
                  className="p-1.5 rounded-lg border border-[#E8E5DD] text-[#182536] hover:bg-slate-100"
                  title="Full Screen Preview"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Participant Selector */}
                {participants.length > 0 && (
                  <div className="flex items-center gap-1 ml-2 pl-2 border-l border-[#E8E5DD]">
                    <button
                      type="button"
                      disabled={previewIndex <= 0}
                      onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                      className="p-1.5 rounded-lg border border-[#E8E5DD] hover:bg-slate-100 disabled:opacity-40 text-xs text-[#182536]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-[#77818C] font-mono">
                      {previewIndex + 1}/{participants.length}
                    </span>
                    <button
                      type="button"
                      disabled={previewIndex >= participants.length - 1}
                      onClick={() => setPreviewIndex((i) => Math.min(participants.length - 1, i + 1))}
                      className="p-1.5 rounded-lg border border-[#E8E5DD] hover:bg-slate-100 disabled:opacity-40 text-xs text-[#182536]"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Field Font Size & Typography Controller */}
            {activeTextControlField && (
              <div className="p-3.5 bg-white rounded-2xl border border-[#E8E5DD] shadow-2xs space-y-3">
                {/* Active Field Switcher Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E8E5DD]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-[#182536] uppercase tracking-wider mr-1 flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-[#C4A878]" />
                      <span>Live Font Size:</span>
                    </span>
                    {textFields.map((tf) => {
                      const isFieldActive = tf.id === activeTextControlField.id;
                      return (
                        <button
                          key={tf.id}
                          type="button"
                          onClick={() => onSelectField(tf.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                            isFieldActive
                              ? 'bg-[#182536] text-[#F5F1E8] border-[#182536] shadow-xs'
                              : 'bg-[#FAF8F5] text-[#253246] border-[#E8E5DD] hover:border-[#C4A878] hover:bg-white'
                          }`}
                        >
                          <span>{tf.label}</span>
                          <span
                            className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                              isFieldActive
                                ? 'bg-[#263B50] text-[#C4A878]'
                                : 'bg-slate-200/70 text-slate-700'
                            }`}
                          >
                            {tf.fontSize}px
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[10px] text-[#77818C] italic">
                    Real-time PDF Scale
                  </span>
                </div>

                {/* Font Size Slider, Numeric Box, +/- Buttons & Reset */}
                <FontSizeControl
                  fontSize={activeTextControlField.fontSize || 24}
                  defaultFontSize={
                    activeTextControlField.defaultFontSize ||
                    (activeTextControlField.type === 'candidate_name'
                      ? 44
                      : activeTextControlField.type === 'date'
                      ? 16
                      : 20)
                  }
                  min={4}
                  step={1}
                  fieldLabel={activeTextControlField.label}
                  presets={
                    activeTextControlField.type === 'candidate_name'
                      ? [24, 32, 44, 48, 80, 150, 300, 500]
                      : activeTextControlField.type === 'date'
                      ? [10, 12, 14, 16, 18, 24, 32, 48]
                      : [14, 18, 24, 32, 48, 80, 150, 300]
                  }
                  onChange={(newSize) => {
                    onUpdateFields(
                      fields.map((f) =>
                        f.id === activeTextControlField.id
                          ? { ...f, fontSize: newSize, autoFit: false }
                          : f
                      )
                    );
                  }}
                  onReset={() => {
                    const fallbackDefault =
                      activeTextControlField.type === 'candidate_name'
                        ? 44
                        : activeTextControlField.type === 'date'
                        ? 16
                        : 20;
                    const defSize = activeTextControlField.defaultFontSize || fallbackDefault;
                    onUpdateFields(
                      fields.map((f) =>
                        f.id === activeTextControlField.id
                          ? { ...f, fontSize: defSize, autoFit: false }
                          : f
                      )
                    );
                  }}
                />

                {/* Additional Formatting: Font Family, Bold, Italic, Alignment, Color */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E5DD] text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span className="text-[11px] font-bold text-[#77818C] whitespace-nowrap">
                      Font:
                    </span>
                    <select
                      value={activeTextControlField.fontFamily || 'Montserrat'}
                      onChange={(e) => {
                        const newFamily = e.target.value;
                        onUpdateFields(
                          fields.map((f) =>
                            f.id === activeTextControlField.id
                              ? { ...f, fontFamily: newFamily }
                              : f
                          )
                        );
                      }}
                      className="input-clean text-xs py-1 px-2 flex-1 font-medium bg-[#FAF8F5]"
                    >
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.name} ({f.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Bold & Italic */}
                    <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E8E5DD]">
                      <button
                        type="button"
                        onClick={() => {
                          const nextWeight =
                            activeTextControlField.fontWeight === 'bold' ? 'normal' : 'bold';
                          onUpdateFields(
                            fields.map((f) =>
                              f.id === activeTextControlField.id
                                ? { ...f, fontWeight: nextWeight }
                                : f
                            )
                          );
                        }}
                        className={`p-1.5 rounded font-bold ${
                          activeTextControlField.fontWeight === 'bold'
                            ? 'bg-[#182536] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Toggle Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextStyle =
                            activeTextControlField.fontStyle === 'italic' ? 'normal' : 'italic';
                          onUpdateFields(
                            fields.map((f) =>
                              f.id === activeTextControlField.id
                                ? { ...f, fontStyle: nextStyle }
                                : f
                            )
                          );
                        }}
                        className={`p-1.5 rounded font-bold ${
                          activeTextControlField.fontStyle === 'italic'
                            ? 'bg-[#182536] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Toggle Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center gap-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#E8E5DD]">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateFields(
                            fields.map((f) =>
                              f.id === activeTextControlField.id ? { ...f, align: 'left' } : f
                            )
                          );
                        }}
                        className={`p-1.5 rounded ${
                          activeTextControlField.align === 'left'
                            ? 'bg-[#182536] text-white'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateFields(
                            fields.map((f) =>
                              f.id === activeTextControlField.id ? { ...f, align: 'center' } : f
                            )
                          );
                        }}
                        className={`p-1.5 rounded ${
                          activeTextControlField.align === 'center'
                            ? 'bg-[#182536] text-white'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateFields(
                            fields.map((f) =>
                              f.id === activeTextControlField.id ? { ...f, align: 'right' } : f
                            )
                          );
                        }}
                        className={`p-1.5 rounded ${
                          activeTextControlField.align === 'right'
                            ? 'bg-[#182536] text-white'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Color */}
                    <div className="flex items-center gap-1 pl-1 border-l border-[#E8E5DD]">
                      <input
                        type="color"
                        value={activeTextControlField.color || '#182536'}
                        onChange={(e) => {
                          const newColor = e.target.value;
                          onUpdateFields(
                            fields.map((f) =>
                              f.id === activeTextControlField.id ? { ...f, color: newColor } : f
                            )
                          );
                        }}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-[#E8E5DD]"
                        title="Change Text Color"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Certificate Canvas Box (Interactive: Drag elements directly!) */}
            <div className="bg-slate-900/5 rounded-2xl p-2 sm:p-4 border border-[#E8E5DD] flex items-center justify-center">
              <CertificateCanvas
                template={currentPreviewTemplate}
                fields={fields}
                signature={signature}
                participant={currentPreviewParticipant}
                formattedDate={formattedDate}
                selectedFieldId={selectedFieldId}
                onSelectField={onSelectField}
                onUpdateFields={onUpdateFields}
                isInteractive={true}
                zoom={previewZoom}
                showGuidelines={true}
              />
            </div>
            <p className="text-[11px] text-[#77818C] text-center">
              Click and drag the signature, candidate name, or date directly on the preview to adjust their position.
            </p>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* COLLAPSIBLE ADVANCED OPTIONS (Optional, Collapsed)         */}
          {/* ---------------------------------------------------------- */}
          <div className="border border-[#E8E5DD] rounded-2xl overflow-hidden bg-[#FAF8F5]">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C4A878]" />
                <span className="text-xs font-bold text-[#182536]">Advanced Options</span>
                <span className="text-[11px] text-[#77818C]">
                  (Typography, Date Setting, Optional QR &amp; Cert ID)
                </span>
              </div>
              {isAdvancedOpen ? (
                <ChevronUp className="w-4 h-4 text-[#77818C]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#77818C]" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="p-5 bg-white border-t border-[#E8E5DD] space-y-4 text-xs">
                {/* Font Selection */}
                <div>
                  <label className="font-bold text-[#182536] block mb-1">
                    Candidate Name Typography (Default: Google Sans Bold)
                  </label>
                  <select
                    value={candidateNameField?.fontFamily || 'Google Sans Bold'}
                    onChange={(e) => handleUpdateFont(e.target.value)}
                    className="input-clean text-xs py-2 w-full font-medium"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E8E5DD]">
                  <div>
                    <label className="font-bold text-[#182536] block mb-1">Issuance Date</label>
                    <input
                      type="date"
                      value={dateSettings.customDate}
                      onChange={(e) =>
                        onUpdateDateSettings({
                          ...dateSettings,
                          mode: 'custom',
                          customDate: e.target.value,
                        })
                      }
                      className="input-clean text-xs py-1.5 w-full font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#182536] block mb-1">Date Format</label>
                    <select
                      value={dateSettings.format}
                      onChange={(e) =>
                        onUpdateDateSettings({
                          ...dateSettings,
                          format: e.target.value as any,
                        })
                      }
                      className="input-clean text-xs py-1.5 w-full font-medium"
                    >
                      <option value="DD Month YYYY">17 November 2026 (DD Month YYYY)</option>
                      <option value="Month DD, YYYY">November 17, 2026 (Month DD, YYYY)</option>
                      <option value="DD/MM/YYYY">17/11/2026 (DD/MM/YYYY)</option>
                      <option value="MM/DD/YYYY">11/17/2026 (MM/DD/YYYY)</option>
                      <option value="YYYY-MM-DD">2026-11-17 (YYYY-MM-DD)</option>
                    </select>
                  </div>
                </div>

                {/* Optional QR Code & Cert ID (OFF by default!) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E8E5DD]">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="opt-qr"
                      checked={fields.some((f) => f.type === 'qr_code' && f.enabled)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onUpdateFields(
                          fields.map((f) => (f.type === 'qr_code' ? { ...f, enabled: checked } : f))
                        );
                      }}
                      className="rounded text-[#C4A878] mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="opt-qr" className="cursor-pointer">
                      <span className="font-bold text-[#182536] block">Optional QR Code</span>
                      <span className="text-[11px] text-[#77818C]">Print verification QR code</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="opt-id"
                      checked={certIdSettings.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onUpdateCertIdSettings({
                          ...certIdSettings,
                          enabled: checked,
                        });
                        onUpdateFields(
                          fields.map((f) => (f.type === 'cert_id' ? { ...f, enabled: checked } : f))
                        );
                      }}
                      className="rounded text-[#C4A878] mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="opt-id" className="cursor-pointer">
                      <span className="font-bold text-[#182536] block">Optional Certificate ID</span>
                      <span className="text-[11px] text-[#77818C]">Generate ID (ATH-2026-0001)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------- */}
          {/* STEP 5: GENERATE & DOWNLOAD                                */}
          {/* ---------------------------------------------------------- */}
          <div className="space-y-5 pt-2">
            {/* Progress Bar when generating */}
            {isGenerating && (
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E5DD] space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#182536]">
                  <span>Generating: {currentGeneratingName}...</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="w-full bg-[#E8E5DD] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#182536] h-full transition-all duration-150 rounded-full"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Primary Generate Button */}
            <button
              type="button"
              disabled={isGenerating || participants.length === 0}
              onClick={handleGenerateCertificates}
              className="btn-midnight w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C4A878]" />
                  <span>Generating Certificates ({generationProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C4A878]" />
                  <span>GENERATE CERTIFICATES</span>
                </>
              )}
            </button>

            {/* Results Counters & Downloads */}
            {readyParticipants.length > 0 && (
              <div className="p-5 bg-[#FAF8F5] rounded-3xl border border-[#E8E5DD] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-[#182536]">
                  <span>Total: {participants.length}</span>
                  <span className="text-emerald-700">Ready: {readyParticipants.length}</span>
                  {errorCount > 0 && <span className="text-rose-600">Failed: {errorCount}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadAllZip}
                    disabled={isZipping}
                    className="btn-gold py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                  >
                    {isZipping ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Packing ZIP ({zipProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download All as ZIP ({readyParticipants.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCombinedPdf}
                    className="py-3 px-4 rounded-2xl bg-white border border-[#E8E5DD] hover:border-[#182536] text-[#182536] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-[#C4A878]" />
                    <span>Download Combined PDF</span>
                  </button>
                </div>

                {/* Individual Participant List */}
                <div className="pt-3 border-t border-[#E8E5DD] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#182536]">
                      Ready Certificates ({readyParticipants.length}):
                    </h4>
                    <input
                      type="text"
                      placeholder="Search name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-clean text-xs py-1 px-2.5 w-40"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {filteredParticipants
                      .filter((p) => p.status === 'ready' && p.pdfBlob)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-xl bg-white border border-[#E8E5DD] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-[#182536] truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedForPdfPreview(p)}
                              className="p-1 rounded-lg text-slate-500 hover:text-[#182536] hover:bg-slate-100"
                              title="Preview PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadSingleCertificate(p)}
                              className="btn-midnight py-1 px-2.5 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Download className="w-3 h-3 text-[#C4A878]" />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* 5. FOOTER                                                      */}
      {/* ============================================================== */}
      <footer className="mt-auto bg-[#182536] border-t border-[#C4A878]/30 py-6 text-xs text-[#77818C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 text-center sm:text-left">
            <div className="h-6 w-auto max-w-[40px] flex items-center justify-center shrink-0">
              <img src="/images/certora_logo.png" alt="CERTORA Logo" className="h-full w-auto object-contain" />
            </div>
            <span className="font-extrabold text-[#F5F1E8] tracking-wider uppercase">
              CERTORA
            </span>
            <span className="text-[#C4A878]">•</span>
            <span className="text-[#C4A878] font-medium">
              Create. Certify. Celebrate.
            </span>
            <span className="text-[#C4A878]">•</span>
            <span className="text-[#F5F1E8]">
              Developed by <strong className="text-[#C4A878] font-semibold">Athrav Pathak</strong>
            </span>
            <span className="text-[#C4A878]">•</span>
            <span className="text-emerald-400 font-medium">100% Client-Side Privacy</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/in/athrav-pathak-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F5F1E8] hover:text-[#C4A878] flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 1.64 1.64 1.64 1.64 0 0 0-1.64-1.64Z" />
              </svg>
              <span>LinkedIn</span>
            </a>

            <a
              href="https://github.com/Athravpathak-git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F5F1E8] hover:text-[#C4A878] flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 6. MODALS                                                      */}
      {/* ============================================================== */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Fullscreen Certificate Preview Modal */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-white">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-[#F5F1E8]">CERTORA Full Screen Preview</span>
              {currentPreviewParticipant && (
                <span className="text-xs text-[#C4A878] bg-[#263B50] px-2.5 py-1 rounded-full font-semibold">
                  {currentPreviewParticipant.name}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenPreview(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close Full Screen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full max-w-5xl max-h-[85vh] overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 rounded-3xl border border-[#C4A878]/30">
            <CertificateCanvas
              template={currentPreviewTemplate}
              fields={fields}
              signature={signature}
              participant={currentPreviewParticipant}
              formattedDate={formattedDate}
              selectedFieldId={selectedFieldId}
              onSelectField={onSelectField}
              onUpdateFields={onUpdateFields}
              isInteractive={true}
              zoom={1}
              showGuidelines={false}
            />
          </div>
        </div>
      )}

      {/* Simplified 3-Panel Certificate Layout Designer */}
      <SimpleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        template={currentPreviewTemplate}
        signature={signature}
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelectField={onSelectField}
        onUpdateFields={onUpdateFields}
        onSignatureLoaded={onSignatureLoaded}
        onOpenBrushEditor={() => setIsBrushEditorOpen(true)}
        formattedDate={formattedDate}
      />

      {/* Excel (.xlsx) Import Modal with Column Mapping */}
      <ExcelImportModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        workbookData={excelWorkbook}
        templateFields={fields}
        onConfirmImport={(importedParticipants: Participant[]) => {
          onUpdateParticipants(importedParticipants);
          const lines = importedParticipants.map((p) => p.name);
          setRawNamesText(lines.join('\n'));
          setIsExcelOpen(false);
        }}
      />

      {/* Saved Projects Modal */}
      <SavedProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        storedProjects={storedProjects}
        onLoadProject={(id) => {
          onLoadProjectById(id);
          onRefreshProjects();
        }}
        onRefreshProjects={onRefreshProjects}
        onExportCurrentProject={onExportProject}
        onImportProjectFile={onImportProjectFile}
        currentProjectName={currentProjectName}
      />

      {/* Signature Brush Fine-Tune Modal */}
      {isBrushEditorOpen && signature && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-5 relative shadow-2xl border border-[#E8E5DD]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#E8E5DD]">
              <div>
                <h3 className="font-bold text-[#182536] text-base">
                  Signature Cropper &amp; Brush Editor
                </h3>
                <p className="text-xs text-[#77818C]">
                  Fine-tune edges, use eraser brush or restore handwritten strokes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrushEditorOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#182536] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SignatureBrushEditor
              signature={activeSignatureData || signature!}
              onUpdateSignature={(sig) => {
                updateActiveSignatureField({ signatureData: sig });
                if (activeSignatureField.id === 'field-signature' || activeSignatureField.id === signatureFields[0]?.id) {
                  onSignatureLoaded(sig);
                }
              }}
              onRestoreOriginal={() => {
                if (activeSignatureData?.originalDataUrl) {
                  const restored: SignatureData = {
                    ...activeSignatureData,
                    dataUrl: activeSignatureData.originalDataUrl,
                    isBackgroundRemoved: false,
                  };
                  updateActiveSignatureField({ signatureData: restored });
                  if (activeSignatureField.id === 'field-signature' || activeSignatureField.id === signatureFields[0]?.id) {
                    onSignatureLoaded(restored);
                  }
                }
              }}
              onClose={() => setIsBrushEditorOpen(false)}
            />
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {selectedForPdfPreview && (
        <PdfPreviewModal
          participant={selectedForPdfPreview}
          onClose={() => setSelectedForPdfPreview(null)}
        />
      )}
    </div>
  );
};
