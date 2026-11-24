import React from 'react';
import { X, Check, Sliders, Maximize2 } from 'lucide-react';
import { EditorView } from './views/EditorView';
import {
  ActiveView,
  CertificateField,
  CertificateTemplate,
  CertIdSettings,
  DateSettings,
  Participant,
  SignatureData,
} from '../types';
import { AppLanguage } from '../services/i18n';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: CertificateTemplate | null;
  signature: SignatureData | null;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFields: (fields: CertificateField[]) => void;
  onSaveProject: () => void;
  participants?: Participant[];
  dateSettings?: DateSettings;
  certIdSettings?: CertIdSettings;
  language?: AppLanguage;
}

export const EditorModal: React.FC<EditorModalProps> = ({
  isOpen,
  onClose,
  template,
  signature,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateFields,
  onSaveProject,
  participants = [],
  dateSettings,
  certIdSettings,
  language = 'en',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col p-2 sm:p-4 overflow-hidden animate-fade-in">
      {/* Top Modal Header */}
      <div className="bg-[#182536] text-white px-5 py-3 rounded-t-2xl flex items-center justify-between border-b border-[#C4A878]/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C4A878]/20 text-[#C4A878] flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F5F1E8]">
              Certificate Designer &amp; Layout Customizer
            </h2>
            <p className="text-[11px] text-[#C4A878]">
              Drag and drop name, date, signature and optional fields to adjust exact positions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-gold py-1.5 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply &amp; Done</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 bg-[#FAF8F5] rounded-b-2xl overflow-y-auto p-3 sm:p-4 border-x border-b border-[#E8E5DD] shadow-2xl">
        <EditorView
          template={template}
          signature={signature}
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelectField={onSelectField}
          onUpdateFields={onUpdateFields}
          onNavigate={() => {}}
          onSaveProject={onSaveProject}
          participants={participants}
          dateSettings={dateSettings}
          certIdSettings={certIdSettings}
          language={language}
        />
      </div>
    </div>
  );
};
