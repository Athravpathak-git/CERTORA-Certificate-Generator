import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Plus,
  Save,
  Trash2,
  Download,
  Upload,
  Calendar,
  Users,
  X,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Edit2,
  HardDrive,
} from 'lucide-react';
import saveAs from 'file-saver';
import { ProjectData, ProjectSummary } from '../types';
import {
  deleteProjectFromStorage,
  exportProjectFile,
  getProjectFromStorage,
  listStoredProjects,
  saveProjectToStorage,
  validateAndParseProjectFile,
} from '../services/projectStorage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectData;
  onLoadProject: (project: ProjectData) => void;
  onNewProject: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onNewProject,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectNameInput, setProjectNameInput] = useState(currentProject.name);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const importFileRef = useRef<HTMLInputElement>(null);

  const refreshProjectsList = async () => {
    try {
      const list = await listStoredProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to list projects:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setProjectNameInput(currentProject.name);
      refreshProjectsList();
    }
  }, [isOpen, currentProject]);

  if (!isOpen) return null;

  // Save Current Project
  const handleSaveCurrent = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const updated: ProjectData = {
        ...currentProject,
        name: projectNameInput.trim() || 'Untitled Project',
        updatedAt: Date.now(),
      };
      await saveProjectToStorage(updated);
      onLoadProject(updated);
      await refreshProjectsList();
      setStatusMessage('Project saved successfully to local browser storage.');
    } catch (err: any) {
      setStatusMessage('Error saving project: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save As New Project
  const handleSaveAs = async () => {
    const newName = prompt('Enter new project name:', `${projectNameInput} (Copy)`);
    if (!newName || !newName.trim()) return;

    setIsLoading(true);
    try {
      const newProj: ProjectData = {
        ...currentProject,
        id: `proj-${Date.now()}`,
        name: newName.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveProjectToStorage(newProj);
      onLoadProject(newProj);
      await refreshProjectsList();
      setStatusMessage(`Created and switched to project: "${newName}"`);
    } catch (err: any) {
      setStatusMessage('Failed to save project copy: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Open an existing project
  const handleOpen = async (id: string) => {
    setIsLoading(true);
    try {
      const proj = await getProjectFromStorage(id);
      if (proj) {
        onLoadProject(proj);
        onClose();
      } else {
        alert('Could not find selected project.');
      }
    } catch (err: any) {
      alert('Error opening project: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete project
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      try {
        await deleteProjectFromStorage(id);
        await refreshProjectsList();
      } catch (err: any) {
        alert('Error deleting project: ' + err.message);
      }
    }
  };

  // Export portable file
  const handleExport = () => {
    const blob = exportProjectFile(currentProject);
    const filename = `${currentProject.name.replace(/\s+/g, '_')}.certproj`;
    saveAs(blob, filename);
  };

  // Import portable file
  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = validateAndParseProjectFile(text);
      await saveProjectToStorage(parsed);
      onLoadProject(parsed);
      await refreshProjectsList();
      setStatusMessage(`Imported and loaded project: "${parsed.name}"`);
    } catch (err: any) {
      alert('Failed to import project file: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shadow-sm">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900">Project Manager</h3>
              <p className="text-xs text-slate-500">
                Save, reopen, export and continue your certificate projects anytime
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Project Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Active Project Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    placeholder="Enter project name..."
                    className="flex-1 px-3.5 py-1.5 rounded-xl border border-slate-300 font-bold text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrent}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={handleSaveAs}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs transition-all shadow-sm"
                >
                  Save As...
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Export project file for backup"
                >
                  <Download className="w-3.5 h-3.5 text-brand-600" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>

            <div className="flex items-center gap-2">
              <input
                ref={importFileRef}
                type="file"
                accept=".certproj,.json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImportFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Import Project Package</span>
              </button>
            </div>
          </div>

          {/* Saved Projects Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recently Saved Projects ({projects.length})
              </h4>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>IndexedDB Storage</span>
              </span>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const isCurrent = proj.id === currentProject.id;
                  const dateStr = new Date(proj.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={proj.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-400/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-xs text-navy-900 truncate">
                            {proj.name}
                          </h5>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{proj.participantCount} names</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{dateStr}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpen(proj.id)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          {isCurrent ? 'Current Project' : 'Open Project'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(proj.id, proj.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No saved projects yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "Save" above to save your current certificate project
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
