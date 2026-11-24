import React from 'react';
import {
  FileUp,
  PenTool,
  Move,
  Type,
  Users,
  Sliders,
  Hash,
  Eye,
  ShieldAlert,
  Cpu,
  Download,
  FolderArchive,
  CheckCircle2,
} from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  maxStepReached: number;
  hasTemplate: boolean;
  hasSignature: boolean;
  participantCount: number;
  completedCertificatesCount: number;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onSelectStep,
  maxStepReached,
  hasTemplate,
  hasSignature,
  participantCount,
  completedCertificatesCount,
}) => {
  const steps = [
    {
      num: 1,
      title: 'Template Gallery',
      short: 'Template',
      icon: FileUp,
      done: hasTemplate,
    },
    {
      num: 2,
      title: 'Upload Signature',
      short: 'Signature',
      icon: PenTool,
      done: hasSignature,
    },
    {
      num: 3,
      title: 'Position & QR Layout',
      short: 'Position',
      icon: Move,
      done: hasTemplate,
    },
    {
      num: 4,
      title: 'Typography & Marathi',
      short: 'Typography',
      icon: Type,
      done: hasTemplate,
    },
    {
      num: 5,
      title: 'Participants & Excel',
      short: 'Participants',
      icon: Users,
      done: participantCount > 0,
      badge: participantCount > 0 ? participantCount : undefined,
    },
    {
      num: 6,
      title: 'Custom Data & Date',
      short: 'Data & Date',
      icon: Sliders,
      done: hasTemplate,
    },
    {
      num: 7,
      title: 'Serial Certificate IDs',
      short: 'Cert IDs',
      icon: Hash,
      done: hasTemplate,
    },
    {
      num: 8,
      title: 'Bulk Realistic Preview',
      short: 'Preview',
      icon: Eye,
      done: hasTemplate && participantCount > 0,
    },
    {
      num: 9,
      title: 'Pre-flight Validation',
      short: 'Validation',
      icon: ShieldAlert,
      done: hasTemplate && participantCount > 0,
    },
    {
      num: 10,
      title: 'Generate All PDFs',
      short: 'Generate',
      icon: Cpu,
      done: completedCertificatesCount > 0,
    },
    {
      num: 11,
      title: 'Download & Gallery',
      short: 'Download',
      icon: Download,
      done: completedCertificatesCount > 0,
      badge: completedCertificatesCount > 0 ? completedCertificatesCount : undefined,
    },
    {
      num: 12,
      title: 'Projects & Verify',
      short: 'Save & Verify',
      icon: FolderArchive,
      done: hasTemplate,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 shadow-subtle sticky top-20 z-30 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <nav className="flex items-center justify-between min-w-[950px] gap-1.5">
          {steps.map((step) => {
            const isCurrent = currentStep === step.num;
            const isDone = step.done;
            const isClickable = hasTemplate || step.num === 1 || step.num === 12;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (isClickable) {
                    onSelectStep(step.num);
                  }
                }}
                disabled={!isClickable}
                className={`group flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-left transition-all ${
                  isCurrent
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : isDone
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    : isClickable
                    ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-[11px] font-semibold leading-tight whitespace-nowrap ${
                      isCurrent ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {step.short}
                  </span>
                </div>

                {step.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                      isCurrent
                        ? 'bg-white text-brand-700'
                        : 'bg-brand-100 text-brand-700'
                    }`}
                  >
                    {step.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
