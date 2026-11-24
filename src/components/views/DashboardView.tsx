import React from 'react';
import {
  Award,
  Sparkles,
  FilePlus,
  PlayCircle,
  FolderArchive,
  ArrowRight,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ActiveView, CertificateTemplate, Participant, ProjectSummary } from '../../types';

interface DashboardViewProps {
  onNavigate: (view: ActiveView) => void;
  onLoadSample: () => void;
  onNewProject: () => void;
  template: CertificateTemplate | null;
  templates: CertificateTemplate[];
  participants: Participant[];
  completedCertificatesCount: number;
  storedProjects: ProjectSummary[];
  onLoadProjectById: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onLoadSample,
  onNewProject,
  template,
  templates,
  participants,
  completedCertificatesCount,
  storedProjects,
  onLoadProjectById,
}) => {
  const activeTemplateCount = templates.length > 0 ? templates.length : template ? 1 : 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* 1. Clean, Beautiful Welcome Hero */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] p-8 sm:p-12 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold-dark text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>CERTORA • Developed by Athrav Pathak</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-google-sans font-bold text-navy-900 text-[#182536] tracking-tight leading-tight">
            Welcome to CERTORA
          </h1>

          <p className="text-base sm:text-lg text-[#77818C] leading-relaxed">
            Create and generate professional certificates effortlessly.
          </p>

          {/* Prominent CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => onNavigate('create')}
              className="btn-gold px-7 py-3.5 text-sm sm:text-base font-bold flex items-center gap-2.5 shadow-md hover:shadow-lg transition-all"
            >
              <FilePlus className="w-5 h-5 stroke-[2.5]" />
              <span>CREATE NEW CERTIFICATE</span>
            </button>

            <button
              type="button"
              onClick={onLoadSample}
              className="btn-secondary px-5 py-3.5 text-sm font-semibold flex items-center gap-2"
              title="Load sample executive certificate, signature and participants"
            >
              <PlayCircle className="w-4 h-4 text-gold" />
              <span>Try Demo Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Small, Clean Statistics (Section 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#182536] font-mono">
              {completedCertificatesCount}
            </div>
            <div className="text-xs text-[#77818C] font-medium">Certificates Generated</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#182536]/5 text-[#182536] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#182536] font-mono">
              {participants.length}
            </div>
            <div className="text-xs text-[#77818C] font-medium">Active Participants</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#182536] font-mono">
              {activeTemplateCount}
            </div>
            <div className="text-xs text-[#77818C] font-medium">Saved Templates</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center shrink-0">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#182536] font-mono">
              {storedProjects.length}
            </div>
            <div className="text-xs text-[#77818C] font-medium">Saved Projects</div>
          </div>
        </div>
      </div>

      {/* 3. Recent Projects & Recent Certificates (Section 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Recent Projects */}
        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DD]">
            <div>
              <h2 className="text-base font-bold text-[#182536] flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-gold" />
                <span>Recent Projects</span>
              </h2>
              <p className="text-xs text-[#77818C] mt-0.5">
                Saved in your browser storage
              </p>
            </div>
            {storedProjects.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('certificates')}
                className="text-xs font-semibold text-gold hover:text-gold-dark transition-colors flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {storedProjects.length > 0 ? (
            <div className="space-y-2.5">
              {storedProjects.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  className="p-3.5 rounded-xl border border-[#E8E5DD] hover:border-gold/50 bg-[#FAF8F5] transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#182536] truncate">
                      {proj.name}
                    </div>
                    <div className="text-xs text-[#77818C] flex items-center gap-2 mt-0.5">
                      <span>{proj.participantCount} participants</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLoadProjectById(proj.id)}
                    className="btn-secondary py-1.5 px-3 text-xs shrink-0"
                  >
                    Open Project
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-[#77818C] space-y-2">
              <FolderArchive className="w-8 h-8 mx-auto text-[#77818C]/40" />
              <p className="text-xs font-medium">No saved projects yet</p>
              <p className="text-[11px]">Click "Create New Certificate" above to start your first project.</p>
            </div>
          )}
        </div>

        {/* Saved Templates Quick Access */}
        <div className="bg-white rounded-2xl border border-[#E8E5DD] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DD]">
            <div>
              <h2 className="text-base font-bold text-[#182536] flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold" />
                <span>Saved Templates</span>
              </h2>
              <p className="text-xs text-[#77818C] mt-0.5">
                Ready-to-use certificate designs
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('templates')}
              className="text-xs font-semibold text-gold hover:text-gold-dark transition-colors flex items-center gap-1"
            >
              <span>Template Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {template ? (
            <div className="p-4 rounded-xl border border-[#E8E5DD] bg-[#FAF8F5] flex items-center gap-4">
              <img
                src={template.previewImageUrl}
                alt={template.name}
                className="w-24 h-16 object-cover rounded-lg border border-[#E8E5DD] shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#182536] truncate">
                  {template.name}
                </div>
                <div className="text-[11px] text-[#77818C] mt-0.5">
                  Category: <span className="font-semibold text-[#182536]">{template.category}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('create')}
                  className="btn-gold py-1 px-3 text-xs mt-2"
                >
                  Edit on Canvas
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-[#77818C] space-y-3">
              <Layers className="w-8 h-8 mx-auto text-[#77818C]/40" />
              <p className="text-xs font-medium">No template currently active</p>
              <button
                type="button"
                onClick={onLoadSample}
                className="btn-secondary py-1.5 px-4 text-xs"
              >
                Load Sample Template
              </button>
            </div>
          )}

          {/* Privacy Guarantee Note */}
          <div className="pt-2 border-t border-[#E8E5DD] flex items-center gap-2 text-xs text-[#77818C]">
            <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
            <span>
              100% Client-Side Privacy: All participant data and generated certificates remain inside your browser.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
