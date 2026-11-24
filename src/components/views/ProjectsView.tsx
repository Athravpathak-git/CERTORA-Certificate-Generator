import React, { useState, useEffect, useRef } from 'react';
import {
  FolderArchive,
  Save,
  Download,
  Upload,
  Trash2,
  Edit2,
  Plus,
  HardDrive,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Check,
  X,
} from 'lucide-react';
import saveAs from 'file-saver';
import { ProjectData, ProjectSummary } from '../../types';
import {
  deleteProjectFromStorage,
  exportProjectFile,
  getProjectFromStorage,
  listStoredProjects,
  saveProjectToStorage,
  validateAndParseProjectFile,
} from '../../services/projectStorage';

interface ProjectsViewProps {
  currentProject: ProjectData;
  onLoadProject: (project: ProjectData) => void;
  onNewProject: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentProject,
  onLoadProject,
  onNewProject,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [projectNameInput, setProjectNameInput] = useState(currentProject.name || 'Certora Certificate Batch');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshList = async () => {
    try {
      setIsLoading(true);
      const list = await listStoredProjects();
      setProjects(list);
    } catch (err: any) {
      console.error('Failed to list stored projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleSaveCurrent = async () => {
    setErrorMsg(null);
    try {
      const dataToSave: ProjectData = {
        ...currentProject,
        name: projectNameInput.trim() || 'Certora Certificate Batch',
        updatedAt: Date.now(),
      };
      await saveProjectToStorage(dataToSave);
      setSaveSuccessMsg('Project saved successfully to browser IndexedDB!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      await refreshList();
    } catch (err: any) {
      setErrorMsg('Failed to save project: ' + err.message);
    }
  };

  const handleOpenProject = async (id: string) => {
    try {
      const data = await getProjectFromStorage(id);
      if (data) {
        onLoadProject(data);
      } else {
        alert('Could not find project data.');
      }
    } catch (err: any) {
      alert('Failed to load project: ' + err.message);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from browser storage?`)) {
      await deleteProjectFromStorage(id);
      await refreshList();
    }
  };

  const handleExportCertproj = () => {
    const blob = exportProjectFile({
      ...currentProject,
      name: projectNameInput.trim(),
    });
    saveAs(blob, `${projectNameInput.trim().replace(/\s+/g, '_')}.certproj`);
  };

  const handleImportFile = async (file: File) => {
    setErrorMsg(null);
    try {
      const text = await file.text();
      const project = validateAndParseProjectFile(text);
      await saveProjectToStorage(project);
      onLoadProject(project);
      await refreshList();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import .certproj file');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-midnight-border pb-5">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-gold bg-gold/15 px-2.5 py-1 rounded-md border border-gold/30">
            Local Persistence
          </span>
          <h2 className="text-2xl font-bold text-ivory mt-2">
            Saved Projects &amp; Portable Package Manager
          </h2>
          <p className="text-sm text-ivory-secondary mt-1">
            Save and resume work anytime without a database. Export and import portable <code>.certproj</code> packages across computers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".certproj,application/json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImportFile(e.target.files[0]);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-deep py-2 px-3.5 text-xs"
          >
            <Upload className="w-3.5 h-3.5 text-gold" />
            <span>Import .certproj</span>
          </button>

          <button
            type="button"
            onClick={onNewProject}
            className="btn-outline py-2 px-3.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-status-success/15 border border-status-success/30 text-status-success text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-status-error/15 border border-status-error/30 text-status-error text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Save Current Session Card */}
      <div className="card-luxury p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span>Save Current Project Session</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={projectNameInput}
            onChange={(e) => setProjectNameInput(e.target.value)}
            placeholder="Project Name (e.g. Annual Merit Awards 2026)"
            className="input-luxury flex-1 text-xs w-full"
          />

          <button
            type="button"
            onClick={handleSaveCurrent}
            className="btn-gold py-2.5 px-5 text-xs whitespace-nowrap w-full sm:w-auto"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save to Browser Storage</span>
          </button>

          <button
            type="button"
            onClick={handleExportCertproj}
            className="btn-outline py-2.5 px-4 text-xs whitespace-nowrap w-full sm:w-auto"
            title="Download portable .certproj JSON backup"
          >
            <Download className="w-4 h-4 text-gold" />
            <span>Export .certproj File</span>
          </button>
        </div>

        <div className="text-[11px] text-ivory-secondary">
          Stores: {currentProject.templates.length} template(s), {currentProject.participants.length} participant(s), all element positions, signatures, and ID sequences.
        </div>
      </div>

      {/* Stored Projects Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ivory flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gold" />
            <span>Projects Stored in Browser ({projects.length})</span>
          </h3>
          <span className="text-[11px] text-ivory-secondary font-mono">IndexedDB Storage</span>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="card-luxury p-5 flex flex-col justify-between hover:border-gold/50 transition-all group space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ivory truncate">{p.name}</span>
                    <span className="text-[10px] text-ivory-secondary font-mono">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-ivory-secondary pt-1">
                    <div className="p-2 rounded-lg bg-midnight border border-midnight-border">
                      <span className="block text-[10px] text-ivory-secondary/70">Templates</span>
                      <span className="font-bold text-ivory">{p.templateCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-midnight border border-midnight-border">
                      <span className="block text-[10px] text-ivory-secondary/70">Participants</span>
                      <span className="font-bold text-gold">{p.participantCount}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-midnight-border flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenProject(p.id)}
                    className="btn-gold py-1.5 px-3.5 text-xs flex-1"
                  >
                    Open Project
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(p.id, p.name)}
                    className="p-1.5 text-ivory-secondary hover:text-status-error hover:bg-midnight rounded-lg transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-luxury p-12 text-center text-ivory-secondary">
            <FolderArchive className="w-10 h-10 mx-auto text-gold opacity-30 mb-2" />
            <p className="text-xs font-semibold text-ivory">No saved projects found</p>
            <p className="text-[11px] text-ivory-secondary mt-0.5">
              Save your current certificate session above to keep it permanently in this browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
