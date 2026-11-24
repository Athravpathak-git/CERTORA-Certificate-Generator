import React, { useRef, useState } from 'react';
import {
  FileUp,
  FileCheck,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertCircle,
  Plus,
  Trash2,
  Tag,
  FolderPlus,
} from 'lucide-react';
import { CertificateTemplate } from '../../types';
import { loadPdfTemplate, loadImageTemplate } from '../../services/pdfService';
import { generateSampleCertificateImage } from '../../constants/sampleData';

const TEMPLATE_CATEGORIES = [
  'Participation',
  'Achievement',
  'Winner',
  'Appreciation',
  'Completion',
  'Custom',
];

interface Step1UploadTemplateProps {
  template: CertificateTemplate | null;
  templates?: CertificateTemplate[];
  activeTemplateId?: string;
  onTemplateLoaded: (template: CertificateTemplate) => void;
  onSelectTemplate?: (templateId: string) => void;
  onAddTemplate?: (template: CertificateTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onUpdateTemplateCategory?: (templateId: string, category: string) => void;
  onNext: () => void;
}

export const Step1UploadTemplate: React.FC<Step1UploadTemplateProps> = ({
  template,
  templates = [],
  activeTemplateId,
  onTemplateLoaded,
  onSelectTemplate,
  onAddTemplate,
  onDeleteTemplate,
  onUpdateTemplateCategory,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetAction, setTargetAction] = useState<'replace' | 'add'>('replace');

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage =
        file.type.startsWith('image/') ||
        file.name.toLowerCase().endsWith('.png') ||
        file.name.toLowerCase().endsWith('.jpg') ||
        file.name.toLowerCase().endsWith('.jpeg');

      if (!isPdf && !isImage) {
        throw new Error('Unsupported format. Please upload a PDF, PNG, JPG, or JPEG file.');
      }

      let loaded: CertificateTemplate;
      if (isPdf) {
        const buffer = await file.arrayBuffer();
        loaded = await loadPdfTemplate(buffer, file.name, 1);
      } else {
        loaded = await loadImageTemplate(file, file.name);
      }

      loaded.category = 'Participation';

      if (targetAction === 'add' && onAddTemplate) {
        onAddTemplate(loaded);
      } else {
        onTemplateLoaded(loaded);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to read certificate template file.');
    } finally {
      setIsLoading(false);
      setTargetAction('replace');
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!template || template.fileType !== 'pdf' || !template.pdfBytes) return;
    setIsLoading(true);
    try {
      const reloaded = await loadPdfTemplate(
        template.pdfBytes.buffer as ArrayBuffer,
        template.name,
        newPage
      );
      onTemplateLoaded(reloaded);
    } catch (err: any) {
      setError('Failed to switch PDF page: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = (
    theme: 'gold_navy' | 'modern_violet' | 'academic_ivory',
    category: string = 'Achievement'
  ) => {
    const titles = {
      gold_navy: 'Executive Certificate of Excellence',
      modern_violet: 'Global Tech & AI Summit 2026',
      academic_ivory: 'Academic Merit & Distinction',
    };
    const sample = generateSampleCertificateImage(theme);
    const tpl: CertificateTemplate = {
      id: `sample-${theme}-${Date.now()}`,
      name: `${titles[theme]}.png`,
      fileType: 'image',
      originalWidth: sample.width,
      originalHeight: sample.height,
      aspectRatio: sample.width / sample.height,
      pageCount: 1,
      selectedPage: 1,
      previewImageUrl: sample.dataUrl,
      detectedFonts: [],
      category,
    };

    if (targetAction === 'add' && onAddTemplate) {
      onAddTemplate(tpl);
    } else {
      onTemplateLoaded(tpl);
    }
    setTargetAction('replace');
  };

  const activeTemplatesList = templates.length > 0 ? templates : template ? [template] : [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 1 of 12 • Template Setup
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Upload & Manage Certificate Templates
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload your base certificate design in PDF or high-resolution image format. You can manage multiple templates for different award categories.
          </p>
        </div>

        {template && (
          <button
            onClick={onNext}
            type="button"
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <span>Continue to Signature</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Multiple Templates Gallery Bar (When multiple templates exist) */}
      {activeTemplatesList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Project Templates Gallery ({activeTemplatesList.length})
              </span>
              <span className="text-xs text-slate-400">• Independent layout per template</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setTargetAction('add');
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {activeTemplatesList.map((tpl) => {
              const isActive = (activeTemplateId || template?.id) === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => onSelectTemplate && onSelectTemplate(tpl.id)}
                  className={`group relative rounded-xl border p-3 cursor-pointer transition-all ${
                    isActive
                      ? 'border-brand-500 bg-brand-50/40 shadow-sm ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-9 rounded bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-300">
                      <img
                        src={tpl.previewImageUrl}
                        alt={tpl.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate" title={tpl.name}>
                        {tpl.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <select
                          value={tpl.category || 'Participation'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (onUpdateTemplateCategory) {
                              onUpdateTemplateCategory(tpl.id, e.target.value);
                            }
                          }}
                          className="text-[10px] font-medium bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:border-brand-500"
                        >
                          {TEMPLATE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {activeTemplatesList.length > 1 && onDeleteTemplate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove template "${tpl.name}" from this batch?`)) {
                          onDeleteTemplate(tpl.id);
                        }
                      }}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Upload Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
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
            className={`cursor-pointer relative rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-brand-400 bg-white hover:bg-slate-50/50'
            } shadow-sm`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
              <FileUp className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-navy-900">
              {template ? 'Upload or Replace Certificate Template' : 'Drop your Certificate Template here'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Drag & drop your original PDF or image file, or{' '}
              <span className="text-brand-600 font-semibold underline underline-offset-2">
                browse files
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs text-slate-400 font-medium">
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">PDF (Vector preserved)</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">PNG</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">JPG / JPEG</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md">Up to 50MB</span>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-semibold text-slate-700">
                  Parsing certificate vector & fonts...
                </p>
              </div>
            )}
          </div>

          {/* Sample Templates Section */}
          <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold uppercase tracking-wide">
                  Or pick a ready-to-use template
                </h4>
              </div>
              <span className="text-xs text-slate-400">Pre-calibrated typography</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => loadSample('gold_navy', 'Achievement')}
                className="group relative text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="w-full h-20 rounded-lg bg-[#FCFBF7] border border-amber-300 flex items-center justify-center relative overflow-hidden mb-2.5">
                  <div className="text-[10px] font-serif font-bold text-navy-900 border border-amber-400 px-2 py-0.5 rounded">
                    CERTIFICATE
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                  Executive Gold & Navy
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Classic prestige (Achievement)</div>
              </button>

              <button
                type="button"
                onClick={() => loadSample('modern_violet', 'Participation')}
                className="group relative text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all"
              >
                <div className="w-full h-20 rounded-lg bg-[#0B0F19] border border-indigo-500/50 flex items-center justify-center relative overflow-hidden mb-2.5">
                  <div className="text-[10px] font-sans font-bold text-indigo-300 border border-indigo-400 px-2 py-0.5 rounded">
                    GLOBAL SUMMIT
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                  Modern Cyber Slate
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Tech & hackathons (Participation)</div>
              </button>

              <button
                type="button"
                onClick={() => loadSample('academic_ivory', 'Winner')}
                className="group relative text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:shadow-md transition-all"
              >
                <div className="w-full h-20 rounded-lg bg-[#FFFDF9] border border-rose-300 flex items-center justify-center relative overflow-hidden mb-2.5">
                  <div className="text-[10px] font-serif font-bold text-rose-900 border border-rose-400 px-2 py-0.5 rounded">
                    ACADEMIC MERIT
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                  Academic Ivory
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Formal fellowship (Winner)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Template Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-600" />
                <span>Active Template Inspector</span>
              </h4>

              {template && (
                <div className="flex items-center gap-1.5">
                  {template.category && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                      {template.category}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md">
                    {template.fileType.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {template ? (
              <div className="space-y-4">
                {/* Preview Image Frame */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 aspect-[16/10] flex items-center justify-center p-2">
                  <img
                    src={template.previewImageUrl}
                    alt={template.name}
                    className="max-h-full max-w-full object-contain rounded shadow-sm"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 backdrop-blur-sm text-white text-[10px] rounded-md font-mono">
                    {Math.round(template.originalWidth)} × {Math.round(template.originalHeight)} pt
                  </div>
                </div>

                {/* PDF Multi-Page Controls */}
                {template.fileType === 'pdf' && template.pageCount > 1 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-slate-400" />
                      Page {template.selectedPage} of {template.pageCount}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePageChange(template.selectedPage - 1)}
                        disabled={template.selectedPage <= 1}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageChange(template.selectedPage + 1)}
                        disabled={template.selectedPage >= template.pageCount}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Specs List */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-400">Orientation</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {template.aspectRatio >= 1 ? 'Landscape' : 'Portrait'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-slate-400">Detected Fonts</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {template.detectedFonts.length > 0
                        ? `${template.detectedFonts.length} embedded`
                        : 'Visual match'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-[16/10] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Maximize2 className="w-8 h-8 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium">No template loaded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload a PDF/Image or click one of the ready templates
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
