import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  PenTool,
  Award,
  Layers,
  Users,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Eye,
  Sliders,
  PlayCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import saveAs from 'file-saver';
import {
  ActiveView,
  CertificateField,
  CertificateTemplate,
  CertIdSettings,
  DateSettings,
  Participant,
  SerialNumberSettings,
  SignatureData,
} from '../../types';
import { loadPdfTemplate, loadSignatureFile } from '../../services/pdfService';
import { removeSignatureBackground } from '../../services/signatureRemover';
import { generateSampleCertificateImage, generateSampleSignatureImage } from '../../constants/sampleData';
import { SignatureBrushEditor } from '../SignatureBrushEditor';
import { EditorView } from './EditorView';
import { ParticipantsView } from './ParticipantsView';
import { GenerationView } from './GenerationView';
import { AppLanguage, t } from '../../services/i18n';

interface CreateCertificateWizardProps {
  template: CertificateTemplate | null;
  templates: CertificateTemplate[];
  activeTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onAddTemplate: (tpl: CertificateTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  signature: SignatureData | null;
  onSignatureLoaded: (sig: SignatureData | null) => void;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFields: (fields: CertificateField[]) => void;
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  dateSettings: DateSettings;
  certIdSettings: CertIdSettings;
  serialSettings: SerialNumberSettings;
  onSaveProject: () => void;
  language?: AppLanguage;
  onNavigate: (view: ActiveView) => void;
}

export const CreateCertificateWizard: React.FC<CreateCertificateWizardProps> = ({
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
  certIdSettings,
  serialSettings,
  onSaveProject,
  language = 'en',
  onNavigate,
}) => {
  // Wizard Step: 1 = Upload, 2 = Signature, 3 = Design, 4 = Participants, 5 = Generate
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (!template) return 1;
    return 3; // if template already loaded, jump straight to editor
  });

  // Step 1: Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [isProcessingTemplate, setIsProcessingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Multi-page PDF page selector
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');

  // Step 2: Signature State
  const sigFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingSig, setIsDraggingSig] = useState(false);
  const [isProcessingSig, setIsProcessingSig] = useState(false);
  const [sigError, setSigError] = useState<string | null>(null);
  const [activeSigTab, setActiveSigTab] = useState<'transparent' | 'original'>('transparent');
  const [isBrushEditorOpen, setIsBrushEditorOpen] = useState(false);

  // -------------------------------------------------------------
  // STEP 1 HANDLERS: Upload Certificate (PDF, PNG, JPG)
  // -------------------------------------------------------------
  const handleTemplateFile = async (file: File) => {
    setIsProcessingTemplate(true);
    setTemplateError(null);

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        setPdfBuffer(buffer);
        setPdfFileName(file.name);
        const tpl = await loadPdfTemplate(buffer, file.name, 1);
        onAddTemplate(tpl);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const tpl: CertificateTemplate = {
              id: `tpl-${Date.now()}`,
              name: file.name,
              fileType: 'image',
              originalWidth: img.width,
              originalHeight: img.height,
              aspectRatio: img.width / img.height,
              pageCount: 1,
              selectedPage: 1,
              previewImageUrl: img.src,
              detectedFonts: [],
              category: 'General',
            };
            onAddTemplate(tpl);
            setIsProcessingTemplate(false);
          };
          img.onerror = () => {
            setTemplateError('Failed to decode image template.');
            setIsProcessingTemplate(false);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        return;
      } else {
        throw new Error('Unsupported format. Please upload a PDF, PNG, or JPG certificate template.');
      }
    } catch (err: any) {
      console.error(err);
      setTemplateError(err?.message || 'Error parsing certificate file.');
    } finally {
      setIsProcessingTemplate(false);
    }
  };

  const handlePageChange = async (targetPage: number) => {
    if (!pdfBuffer || !template) return;
    setIsProcessingTemplate(true);
    try {
      const updated = await loadPdfTemplate(pdfBuffer, pdfFileName || template.name, targetPage);
      onAddTemplate({ ...updated, id: template.id });
    } catch (err) {
      console.error('Failed to change PDF page:', err);
    } finally {
      setIsProcessingTemplate(false);
    }
  };

  const handleLoadSampleTemplate = () => {
    const cert = generateSampleCertificateImage('gold_navy');
    const tpl: CertificateTemplate = {
      id: `sample-${Date.now()}`,
      name: 'Athrav_Sample_Certificate.png',
      fileType: 'image',
      originalWidth: cert.width,
      originalHeight: cert.height,
      aspectRatio: cert.width / cert.height,
      pageCount: 1,
      selectedPage: 1,
      previewImageUrl: cert.dataUrl,
      detectedFonts: [],
      category: 'Achievement',
    };
    onAddTemplate(tpl);
  };

  // -------------------------------------------------------------
  // STEP 2 HANDLERS: Signature Upload & Background Removal
  // -------------------------------------------------------------
  const handleSignatureFile = async (file: File) => {
    setIsProcessingSig(true);
    setSigError(null);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (PNG, JPG, or JPEG).');
      }
      const loaded = await loadSignatureFile(file);
      onSignatureLoaded(loaded);
    } catch (err: any) {
      console.error(err);
      setSigError(err?.message || 'Failed to process signature image.');
    } finally {
      setIsProcessingSig(false);
    }
  };

  const handleLoadSampleSignature = () => {
    const sig = generateSampleSignatureImage('executive');
    onSignatureLoaded({
      id: `sig-sample-${Date.now()}`,
      name: 'Executive_Signature.png',
      dataUrl: sig.dataUrl,
      format: 'png',
      width: sig.width,
      height: sig.height,
      aspectRatio: sig.width / sig.height,
    });
  };

  const handleDownloadTransparentSignature = () => {
    if (!signature) return;
    saveAs(signature.dataUrl, `${signature.name.replace(/\.[^/.]+$/, '')}_transparent.png`);
  };

  // -------------------------------------------------------------
  // Step Definitions
  // -------------------------------------------------------------
  const STEPS = [
    { number: 1, title: 'Upload Certificate', subtitle: 'PDF, PNG or JPG' },
    { number: 2, title: 'Add Signature', subtitle: 'Auto background remover' },
    { number: 3, title: 'Edit Certificate', subtitle: 'Position name, date & text' },
    { number: 4, title: 'Add Participants', subtitle: 'Names, Excel or CSV' },
    { number: 5, title: 'Generate Certificates', subtitle: 'Individual PDFs & ZIP' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* ============================================================== */}
      {/* TOP PROGRESS BAR / 5-STEP WIZARD HEADER                         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E5DD] pb-5 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold-dark text-xs font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>CERTORA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-google-sans font-bold text-[#182536]">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-xs sm:text-sm text-[#77818C] mt-0.5">
              Step {currentStep} of 5: {STEPS[currentStep - 1].subtitle}
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2 self-start md:self-center">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep < 5 && (
              <button
                type="button"
                disabled={currentStep === 1 && !template}
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                className="btn-midnight px-4 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5-Step Stepper Component */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted =
              (step.number === 1 && !!template) ||
              (step.number === 2 && !!signature) ||
              (step.number === 3 && fields.length > 0) ||
              (step.number === 4 && participants.length > 0) ||
              (step.number === 5 && participants.some((p) => p.pdfBlob));

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setCurrentStep(step.number)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#182536] text-white border-[#182536] shadow-sm'
                    : isCompleted
                    ? 'bg-[#F5F1E8] text-[#182536] border-[#E8E5DD] hover:border-gold/50'
                    : 'bg-white text-[#77818C] border-[#E8E5DD] hover:border-[#182536]/30'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-gold text-midnight'
                      : isCompleted
                      ? 'bg-gold/20 text-gold-dark'
                      : 'bg-[#FAF8F5] text-[#77818C]'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-[#182536]'}`}>
                    {step.title}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-gold' : 'text-[#77818C]'}`}>
                    {step.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* STEP 1: UPLOAD CERTIFICATE TEMPLATE                             */}
      {/* ============================================================== */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upload Area */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8E5DD] p-6 sm:p-8 space-y-5 shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-[#182536]">
                  Upload Certificate Template
                </h3>
                <p className="text-xs text-[#77818C] mt-1">
                  Upload your blank certificate background as a PDF document, PNG image, or JPG photo.
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleTemplateFile(e.target.files[0]);
                }}
              />

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingTemplate(true);
                }}
                onDragLeave={() => setIsDraggingTemplate(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingTemplate(false);
                  if (e.dataTransfer.files?.[0]) handleTemplateFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDraggingTemplate
                    ? 'border-gold bg-gold/5 scale-[1.01]'
                    : 'border-[#E8E5DD] bg-[#FAF8F5] hover:border-gold/60 hover:bg-[#F5F1E8]'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-[#182536]">
                  {isProcessingTemplate ? 'Processing template...' : 'Drag & drop certificate template here'}
                </h4>
                <p className="text-xs text-[#77818C] mt-1 max-w-sm mx-auto">
                  Supports PDF (single or multi-page), PNG, and JPG files up to 25MB.
                </p>
                <button
                  type="button"
                  className="btn-midnight mt-4 py-2 px-5 text-xs font-bold inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File from Computer</span>
                </button>
              </div>

              {templateError && (
                <div className="p-4 rounded-2xl bg-status-error/10 border border-status-error/20 text-status-error text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{templateError}</span>
                </div>
              )}

              {/* Quick Sample Action */}
              <div className="pt-2 border-t border-[#E8E5DD] flex items-center justify-between">
                <span className="text-xs text-[#77818C]">Need a template to test with right away?</span>
                <button
                  type="button"
                  onClick={handleLoadSampleTemplate}
                  className="text-xs font-bold text-gold-dark hover:underline flex items-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4 text-gold" />
                  <span>Use Sample Executive Certificate</span>
                </button>
              </div>
            </div>

            {/* Template Preview Card */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8E5DD] p-6 space-y-4 shadow-xs">
              <h4 className="text-sm font-bold text-[#182536] flex items-center justify-between">
                <span>Active Template Preview</span>
                {template && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success">
                    Ready
                  </span>
                )}
              </h4>

              {template ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-[#E8E5DD] bg-[#FAF8F5] shadow-xs">
                    <img
                      src={template.previewImageUrl}
                      alt={template.name}
                      className="w-full h-auto block object-contain max-h-[300px]"
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E8E5DD]">
                      <span className="text-[#77818C]">File Name:</span>
                      <span className="font-semibold text-[#182536] truncate max-w-[200px]" title={template.name}>
                        {template.name}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E8E5DD]">
                      <span className="text-[#77818C]">Type &amp; Dimensions:</span>
                      <span className="font-mono text-[#182536]">
                        {template.fileType.toUpperCase()} • {Math.round(template.originalWidth)} × {Math.round(template.originalHeight)} pt
                      </span>
                    </div>
                    {template.pageCount > 1 && (
                      <div className="flex items-center justify-between py-1 border-b border-[#E8E5DD]">
                        <span className="text-[#77818C]">Selected Page:</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: template.pageCount }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handlePageChange(p)}
                              className={`px-2 py-0.5 text-xs font-bold rounded ${
                                template.selectedPage === p
                                  ? 'bg-[#182536] text-white'
                                  : 'bg-[#FAF8F5] text-[#182536] border border-[#E8E5DD]'
                              }`}
                            >
                              Page {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary flex-1 py-2 text-xs font-bold"
                    >
                      Replace Template
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTemplate(template.id)}
                      className="p-2 rounded-xl text-status-error hover:bg-status-error/10 border border-status-error/20"
                      title="Remove template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-gold w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Next: Add Signature</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 border-2 border-dashed border-[#E8E5DD] rounded-2xl bg-[#FAF8F5]">
                  <ImageIcon className="w-10 h-10 mx-auto text-[#77818C] opacity-40" />
                  <p className="text-xs font-semibold text-[#182536]">No template uploaded yet</p>
                  <p className="text-[11px] text-[#77818C]">Upload a file on the left to see its preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: ADD SIGNATURE (AUTO BACKGROUND REMOVAL)                 */}
      {/* ============================================================== */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Signature Upload & Controls */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8E5DD] p-6 sm:p-8 space-y-5 shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-[#182536]">
                  Add Signature
                </h3>
                <p className="text-xs text-[#77818C] mt-1">
                  Upload a photo or scan of your signature. The background is automatically removed to create a clean, transparent PNG.
                </p>
              </div>

              <input
                ref={sigFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSignatureFile(e.target.files[0]);
                }}
              />

              {/* Signature Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingSig(true);
                }}
                onDragLeave={() => setIsDraggingSig(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSig(false);
                  if (e.dataTransfer.files?.[0]) handleSignatureFile(e.dataTransfer.files[0]);
                }}
                onClick={() => sigFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all ${
                  isDraggingSig
                    ? 'border-gold bg-gold/5 scale-[1.01]'
                    : 'border-[#E8E5DD] bg-[#FAF8F5] hover:border-gold/60 hover:bg-[#F5F1E8]'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mx-auto mb-3">
                  <PenTool className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-[#182536]">
                  {isProcessingSig ? 'Removing background...' : 'Upload signature image'}
                </h4>
                <p className="text-xs text-[#77818C] mt-1 max-w-sm mx-auto">
                  Automatically extracts handwritten pen strokes and removes white, cream, or grey paper backgrounds.
                </p>
                <button
                  type="button"
                  className="btn-midnight mt-4 py-2 px-4 text-xs font-bold inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select Signature File</span>
                </button>
              </div>

              {sigError && (
                <div className="p-4 rounded-2xl bg-status-error/10 border border-status-error/20 text-status-error text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sigError}</span>
                </div>
              )}

              {/* Sample Signature Loader */}
              <div className="pt-2 border-t border-[#E8E5DD] flex items-center justify-between">
                <span className="text-xs text-[#77818C]">Need a sample signature?</span>
                <button
                  type="button"
                  onClick={handleLoadSampleSignature}
                  className="text-xs font-bold text-gold-dark hover:underline flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>Use Sample Executive Signature</span>
                </button>
              </div>

              {/* Guidance Note */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E5DD] text-xs text-[#77818C] space-y-1">
                <strong className="text-[#182536]">Exact Canvas Positioning:</strong>
                <p>
                  In Step 3 (Edit Certificate), your signature will be placed onto the canvas where you can freely drag it, resize it, and position it wherever you want.
                </p>
              </div>
            </div>

            {/* Signature Preview & Correction Card */}
            <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8E5DD] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#182536]">
                  Signature Background Remover Preview
                </h4>
                {signature && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
                    Transparent PNG Ready
                  </span>
                )}
              </div>

              {signature ? (
                <div className="space-y-4">
                  {/* Tabs: Transparent PNG vs Original */}
                  <div className="flex items-center gap-2 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E5DD]">
                    <button
                      type="button"
                      onClick={() => setActiveSigTab('transparent')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        activeSigTab === 'transparent'
                          ? 'bg-white text-[#182536] shadow-xs'
                          : 'text-[#77818C] hover:text-[#182536]'
                      }`}
                    >
                      Transparent (No Background)
                    </button>
                    {signature.originalDataUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveSigTab('original')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          activeSigTab === 'original'
                            ? 'bg-white text-[#182536] shadow-xs'
                            : 'text-[#77818C] hover:text-[#182536]'
                        }`}
                      >
                        Original Uploaded
                      </button>
                    )}
                  </div>

                  {/* Checkerboard Preview Area */}
                  <div className="relative rounded-2xl overflow-hidden border border-[#E8E5DD] h-48 flex items-center justify-center p-4 bg-checkerboard">
                    <img
                      src={activeSigTab === 'transparent' ? signature.dataUrl : signature.originalDataUrl || signature.dataUrl}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                  </div>

                  {/* Signature Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBrushEditorOpen(true)}
                      className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5"
                      title="Refine signature with eraser / restore brush"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Manual Brush Correction</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTransparentSignature}
                      className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5"
                      title="Download transparent PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSignatureLoaded(null)}
                      className="p-2 rounded-xl text-status-error hover:bg-status-error/10 border border-status-error/20 ml-auto"
                      title="Remove signature"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation to Step 3 */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="btn-gold flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs"
                    >
                      <span>Next: Edit Certificate</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-3 border-2 border-dashed border-[#E8E5DD] rounded-2xl bg-[#FAF8F5]">
                  <PenTool className="w-10 h-10 mx-auto text-[#77818C] opacity-40" />
                  <p className="text-xs font-semibold text-[#182536]">No signature added yet</p>
                  <p className="text-[11px] text-[#77818C] max-w-xs mx-auto">
                    You can upload a signature now, or skip this step if your certificate does not need an automated signature.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="btn-secondary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5 mt-2"
                  >
                    <span>Skip Signature &amp; Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Brush Correction Modal */}
          {isBrushEditorOpen && signature && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-4 relative shadow-2xl border border-[#E8E5DD]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#E8E5DD]">
                  <div>
                    <h3 className="font-bold text-[#182536] text-base">Fine-Tune Signature &amp; Brush Tools</h3>
                    <p className="text-xs text-slate-500">Erase unwanted marks or restore handwritten strokes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBrushEditorOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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
                  onClose={() => setIsBrushEditorOpen(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 3: EDIT CERTIFICATE (3-PANEL CERTIFICATE DESIGNER)         */}
      {/* ============================================================== */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <EditorView
            template={template}
            signature={signature}
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={onSelectField}
            onUpdateFields={onUpdateFields}
            onNavigate={onNavigate}
            onSaveProject={onSaveProject}
            participants={participants}
            dateSettings={dateSettings}
            certIdSettings={certIdSettings}
            language={language}
          />

          {/* Step 3 Footer Navigation */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Signature</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs"
            >
              <span>Next: Add Participants</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 4: ADD PARTICIPANTS (CLEAN ROSTER TABLE & IMPORTS)         */}
      {/* ============================================================== */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <ParticipantsView
            participants={participants}
            onUpdateParticipants={onUpdateParticipants}
          />

          {/* Step 4 Footer Navigation */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Edit Certificate</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs"
            >
              <span>Next: Generate Certificates</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 5: GENERATE CERTIFICATES (SUMMARY & BULK DOWNLOADS)       */}
      {/* ============================================================== */}
      {currentStep === 5 && (
        <div className="space-y-4">
          <GenerationView
            template={template}
            signature={signature}
            fields={fields}
            participants={participants}
            dateSettings={dateSettings}
            onUpdateParticipants={onUpdateParticipants}
            onNavigateToEditor={() => setCurrentStep(3)}
          />

          {/* Step 5 Footer Navigation */}
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Participants</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('certificates')}
              className="btn-midnight py-2.5 px-5 text-xs font-bold flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>View All in My Certificates</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
