import React, { useState } from 'react';
import {
  X,
  FolderArchive,
  Download,
  Upload,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCode,
} from 'lucide-react';
import { ProjectSummary } from '../types';
import { exportProjectFile } from '../services/projectStorage';

interface SavedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storedProjects: ProjectSummary[];
  onLoadProject: (id: string) => void;
  onRefreshProjects: () => void;
  onExportCurrentProject: () => void;
  onImportProjectFile: (file: File) => void;
  currentProjectName: string;
}

export const SavedProjectsModal: React.FC<SavedProjectsModalProps> = ({
  isOpen,
  onClose,
  storedProjects,
  onLoadProject,
  onRefreshProjects,
  onExportCurrentProject,
  onImportProjectFile,
  currentProjectName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = storedProjects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportProjectFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#E8E5DD] relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#182536] text-[#C4A878] flex items-center justify-center font-bold">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#182536]">
                My Saved Certificate Projects
              </h2>
              <p className="text-xs text-[#77818C]">
                Saved locally inside your browser's private IndexedDB storage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#182536] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Import / Export Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E8E5DD]">
          <div>
            <span className="text-xs font-bold text-[#182536] block">
              Active Project: {currentProjectName}
            </span>
            <span className="text-[11px] text-[#77818C]">
              Export your setup or import an existing .certproj file
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportCurrentProject}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#C4A878]" />
              <span>Export .certproj</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-[#182536] hover:bg-[#263B50] text-[#F5F1E8] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95">
              <Upload className="w-3.5 h-3.5 text-[#C4A878]" />
              <span>Import .certproj</span>
              <input
                type="file"
                accept=".certproj,application/json"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search saved projects by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-clean text-xs py-2 w-full"
          />
        </div>

        {/* Projects List */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {filtered.length > 0 ? (
            filtered.map((proj) => {
              const dateStr = new Date(proj.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={proj.id}
                  className="p-3.5 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#182536] truncate group-hover:text-[#C4A878] transition-colors">
                      {proj.name}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-[#77818C]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#C4A878]" />
                        <span>{dateStr}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#C4A878]" />
                        <span>{proj.participantCount} participants</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadProject(proj.id);
                      onClose();
                    }}
                    className="btn-gold py-1.5 px-3 text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <span>Load Project</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FolderArchive className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-500">No saved projects found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Save your active certificate setup anytime to resume later.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#E8E5DD] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
