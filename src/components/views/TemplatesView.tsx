import React, { useRef, useState } from 'react';
import {
  Layers,
  FileUp,
  Plus,
  Trash2,
  Copy,
  Tag,
  Check,
  FileCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertCircle,
} from 'lucide-react';
import { ActiveView, CertificateField, CertificateTemplate } from '../../types';
import { loadPdfTemplate, loadImageTemplate } from '../../services/pdfService';
import { generateSampleCertificateImage } from '../../constants/sampleData';

const TEMPLATE_CATEGORIES = [
  'Participation',
  'Achievement',
  'Internship',
  'Completion',
  'Appreciation',
  'Winner',
  'Workshop',
  'Competition',
  'Custom',
];

interface TemplatesViewProps {
  template: CertificateTemplate | null;
  templates: CertificateTemplate[];
  activeTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onAddTemplate: (template: CertificateTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onUpdateTemplateCategory: (templateId: string, category: string) => void;
  onNavigate: (view: ActiveView) => void;
  fields: CertificateField[];
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  template,
  templates,
  activeTemplateId,
  onSelectTemplate,
  onAddTemplate,
  onDeleteTemplate,
  onUpdateTemplateCategory,
  onNavigate,
  fields,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      loaded.fieldConfig = [...fields];
      onAddTemplate(loaded);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to read certificate template file.');
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
      modern_violet: 'Global Tech & AI Summit',
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
      fieldConfig: [...fields],
    };

    onAddTemplate(tpl);
  };

  const activeList = templates.length > 0 ? templates : template ? [template] : [];

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-gold-dark bg-gold/15 px-2.5 py-1 rounded-md border border-gold/30">
            Multi-Template Management
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#182536] mt-2">
            Certificate Template Library &amp; Categories
          </h2>
          <p className="text-xs text-[#77818C] mt-1">
            Maintain multiple certificate designs for different award tiers. Each template keeps its own independent field layout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-gold px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Upload New Template</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-status-error/15 border border-status-error/30 text-status-error text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Dropzone */}
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
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
          <FileUp className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-[#182536]">
          Upload Certificate Template (PDF, PNG, JPG)
        </h3>
        <p className="text-xs text-[#77818C] mt-1 max-w-sm mx-auto">
          Drag &amp; drop your original file, or <span className="text-gold-dark font-semibold underline">browse local files</span>
        </p>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-semibold text-[#182536]">Parsing template...</p>
          </div>
        )}
      </div>

      {/* Templates Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#182536] flex items-center gap-2">
            <Layers className="w-4 h-4 text-gold" />
            <span>Active Project Templates ({activeList.length})</span>
          </h3>
          <span className="text-xs text-[#77818C]">
            Click to activate • Coordinates preserved independently
          </span>
        </div>

        {activeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeList.map((tpl) => {
              const isActive = (activeTemplateId || template?.id) === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onClick={() => onSelectTemplate(tpl.id)}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all relative group flex flex-col justify-between shadow-xs ${
                    isActive
                      ? 'border-gold shadow-sm ring-1 ring-gold/40'
                      : 'border-[#E8E5DD] hover:border-gold/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Thumbnail Frame */}
                    <div className="relative aspect-[16/10] rounded-lg bg-[#FAF8F5] overflow-hidden border border-[#E8E5DD] flex items-center justify-center p-1.5">
                      <img
                        src={tpl.previewImageUrl}
                        alt={tpl.name}
                        className="max-h-full max-w-full object-contain"
                      />
                      {isActive && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-gold text-midnight text-[9px] font-bold uppercase">
                          Active
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div>
                      <div className="text-xs font-bold text-[#182536] truncate" title={tpl.name}>
                        {tpl.name}
                      </div>
                      <div className="text-[10px] text-[#77818C] mt-0.5">
                        {Math.round(tpl.originalWidth)} × {Math.round(tpl.originalHeight)} pt • {tpl.fileType.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Category Selector & Actions */}
                  <div className="pt-3 border-t border-[#E8E5DD] flex items-center justify-between gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={tpl.category || 'Participation'}
                      onChange={(e) => onUpdateTemplateCategory(tpl.id, e.target.value)}
                      className="input-clean text-[10px] py-1 px-2"
                    >
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {activeList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove template "${tpl.name}"?`)) {
                            onDeleteTemplate(tpl.id);
                          }
                        }}
                        className="p-1 text-[#77818C] hover:text-status-error transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8E5DD] p-10 text-center text-[#77818C] shadow-xs">
            <Layers className="w-10 h-10 mx-auto text-gold opacity-30 mb-2" />
            <p className="text-xs font-semibold text-[#182536]">No templates in project yet</p>
            <p className="text-[11px] text-[#77818C] mt-0.5">
              Upload your certificate above or load one of the pre-designed templates below.
            </p>
          </div>
        )}
      </div>

      {/* Ready-to-use Sample Templates */}
      <div className="bg-white rounded-2xl border border-[#E8E5DD] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#182536]">
              Ready-Made Professional Templates
            </h4>
          </div>
          <span className="text-[11px] text-[#77818C]">Pre-calibrated typography</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => loadSample('gold_navy', 'Achievement')}
            className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/50 text-left transition-all group"
          >
            <div className="w-full h-24 rounded-lg bg-[#FCFBF7] border border-gold/30 flex items-center justify-center mb-2.5 overflow-hidden">
              <span className="text-[10px] font-serif font-bold text-[#182536] px-2 py-0.5 border border-gold rounded">
                CERTIFICATE
              </span>
            </div>
            <div className="text-xs font-bold text-[#182536] group-hover:text-gold-dark transition-colors">
              Executive Gold &amp; Navy
            </div>
            <div className="text-[11px] text-[#77818C] mt-0.5">Classic prestige (Achievement)</div>
          </button>

          <button
            type="button"
            onClick={() => loadSample('modern_violet', 'Participation')}
            className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/50 text-left transition-all group"
          >
            <div className="w-full h-24 rounded-lg bg-[#0B0F19] border border-gold/30 flex items-center justify-center mb-2.5 overflow-hidden">
              <span className="text-[10px] font-sans font-bold text-gold px-2 py-0.5 border border-gold rounded">
                GLOBAL SUMMIT
              </span>
            </div>
            <div className="text-xs font-bold text-[#182536] group-hover:text-gold-dark transition-colors">
              Modern Cyber Slate
            </div>
            <div className="text-[11px] text-[#77818C] mt-0.5">Tech &amp; Summit (Participation)</div>
          </button>

          <button
            type="button"
            onClick={() => loadSample('academic_ivory', 'Winner')}
            className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] hover:border-gold/50 text-left transition-all group"
          >
            <div className="w-full h-24 rounded-lg bg-[#FFFDF9] border border-gold/30 flex items-center justify-center mb-2.5 overflow-hidden">
              <span className="text-[10px] font-serif font-bold text-[#182536] px-2 py-0.5 border border-gold rounded">
                ACADEMIC MERIT
              </span>
            </div>
            <div className="text-xs font-bold text-[#182536] group-hover:text-gold-dark transition-colors">
              Academic Ivory
            </div>
            <div className="text-[11px] text-[#77818C] mt-0.5">Fellowship &amp; Honor (Winner)</div>
          </button>
        </div>
      </div>
    </div>
  );
};
