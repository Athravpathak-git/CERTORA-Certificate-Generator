import React, { useState } from 'react';
import {
  Award,
  FolderArchive,
  Download,
  Trash2,
  ExternalLink,
  Search,
  FileText,
  Clock,
  Sparkles,
  FilePlus,
  Eye,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import saveAs from 'file-saver';
import { ActiveView, Participant, ProjectData, ProjectSummary } from '../../types';
import { deleteProjectFromStorage, exportProjectFile } from '../../services/projectStorage';
import { downloadCertificatesAsZip, downloadSingleCertificate } from '../../services/zipService';
import { PdfPreviewModal } from '../PdfPreviewModal';
import { AppLanguage, t } from '../../services/i18n';

interface MyCertificatesViewProps {
  storedProjects: ProjectSummary[];
  currentProject: ProjectData;
  participants: Participant[];
  onLoadProjectById: (id: string) => void;
  onRefreshProjects: () => void;
  onNavigate: (view: ActiveView) => void;
  language?: AppLanguage;
}

export const MyCertificatesView: React.FC<MyCertificatesViewProps> = ({
  storedProjects,
  currentProject,
  participants,
  onLoadProjectById,
  onRefreshProjects,
  onNavigate,
  language = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'session_certs'>('projects');
  const [previewParticipant, setPreviewParticipant] = useState<Participant | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter projects by search
  const filteredProjects = storedProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Participants with generated certificates in current session
  const completedParticipants = participants.filter((p) => p.pdfBlob);
  const filteredCompleted = completedParticipants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteProject = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the project "${name}"?`)) {
      setDeletingId(id);
      try {
        await deleteProjectFromStorage(id);
        onRefreshProjects();
      } catch (err: any) {
        alert('Failed to delete project: ' + err.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleExportCertproj = (proj: ProjectSummary) => {
    // If it's current project, export current data
    if (proj.id === currentProject.id || storedProjects.length === 1) {
      const blob = exportProjectFile(currentProject);
      saveAs(blob, `${proj.name.replace(/\s+/g, '_')}.certproj`);
    } else {
      onLoadProjectById(proj.id);
    }
  };

  const handleDownloadAllZip = async () => {
    if (completedParticipants.length === 0) return;
    setIsZipping(true);
    try {
      await downloadCertificatesAsZip(
        completedParticipants,
        `${currentProject.name || 'Certificates'}.zip`
      );
    } catch (err: any) {
      alert('Failed to create ZIP: ' + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* 1. Header & Quick Controls */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold-dark text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5 text-gold" />
            <span>CERTORA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-google-sans font-bold text-[#182536]">
            {t('myCertificates', language)}
          </h2>
          <p className="text-sm text-[#77818C] mt-1">
            Access your saved certificate projects, offline backups, and recent downloads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="btn-gold px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm"
          >
            <FilePlus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Certificate</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Tab Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#F5F1E8] p-1.5 rounded-2xl border border-[#E8E5DD]">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'bg-white text-[#182536] shadow-sm'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5 text-gold" />
            <span>Saved Projects</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gold/15 text-gold font-bold">
              {storedProjects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('session_certs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'session_certs'
                ? 'bg-white text-[#182536] shadow-sm'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-gold" />
            <span>Recent Certificates</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gold/15 text-gold font-bold">
              {completedParticipants.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#77818C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'projects' ? 'Search projects...' : 'Search participant certificates...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-clean pl-10 text-xs w-full"
          />
        </div>
      </div>

      {/* 3. Content Area */}
      {activeTab === 'projects' ? (
        /* Saved Projects List */
        <div className="space-y-4">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((proj) => {
                const dateStr = new Date(proj.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={proj.id}
                    className="bg-white rounded-2xl border border-[#E8E5DD] p-5 shadow-xs hover:border-gold/60 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
                          <FolderArchive className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-mono text-[#77818C] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E8E5DD]">
                          {dateStr}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-[#182536] truncate" title={proj.name}>
                          {proj.name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-[#77818C] mt-1.5">
                          <span>{proj.templateCount} {proj.templateCount === 1 ? 'Template' : 'Templates'}</span>
                          <span>•</span>
                          <span>{proj.participantCount} Participants</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E8E5DD] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadProjectById(proj.id)}
                        className="btn-midnight py-2 px-3.5 text-xs font-bold flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Project</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleExportCertproj(proj)}
                          className="p-2 rounded-xl text-[#77818C] hover:text-gold hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8E5DD] transition-all"
                          title="Export .certproj file"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === proj.id}
                          onClick={() => handleDeleteProject(proj.id, proj.name)}
                          className="p-2 rounded-xl text-[#77818C] hover:text-status-error hover:bg-status-error/10 border border-transparent hover:border-status-error/20 transition-all"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E5DD] p-12 text-center space-y-3">
              <FolderArchive className="w-12 h-12 mx-auto text-[#77818C] opacity-40" />
              <h4 className="text-base font-bold text-[#182536]">No saved projects found</h4>
              <p className="text-xs text-[#77818C] max-w-sm mx-auto">
                {searchQuery
                  ? 'No projects matched your search criteria.'
                  : 'Your projects will be automatically stored securely inside your browser IndexedDB.'}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('create')}
                className="btn-gold px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 mt-2"
              >
                <FilePlus className="w-4 h-4" />
                <span>Create First Project</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Recent Generated Certificates List */
        <div className="space-y-4">
          {completedParticipants.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8E5DD] p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#182536]">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span>
                  {completedParticipants.length} certificates compiled and ready for download.
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="btn-gold px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Archive className="w-4 h-4" />
                <span>{isZipping ? 'Archiving ZIP...' : 'DOWNLOAD ALL AS ZIP'}</span>
              </button>
            </div>
          )}

          {filteredCompleted.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E5DD] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF8F5] border-b border-[#E8E5DD] text-[#77818C] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Participant Name</th>
                    <th className="py-3 px-4">Certificate ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E5DD]">
                  {filteredCompleted.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-[#77818C] text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#182536]">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#77818C] text-[11px]">
                        {p.certId || p.fields?.cert_id || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success border border-status-success/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Generated</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.pdfUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewParticipant(p)}
                              className="p-1.5 rounded-lg text-[#77818C] hover:text-[#182536] hover:bg-[#FAF8F5] border border-[#E8E5DD] transition-all"
                              title="Preview Certificate"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {p.pdfBlob && (
                            <button
                              type="button"
                              onClick={() => downloadSingleCertificate(p)}
                              className="btn-midnight py-1.5 px-3 text-[11px] font-bold flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E5DD] p-12 text-center space-y-3">
              <Award className="w-12 h-12 mx-auto text-[#77818C] opacity-40" />
              <h4 className="text-base font-bold text-[#182536]">No certificates generated in this session</h4>
              <p className="text-xs text-[#77818C] max-w-sm mx-auto">
                Generate certificates using the creation wizard, and they will appear here ready for 1-click download.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('create')}
                className="btn-gold px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 mt-2"
              >
                <FilePlus className="w-4 h-4" />
                <span>Go to Certificate Wizard</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewParticipant && (
        <PdfPreviewModal
          participant={previewParticipant}
          onClose={() => setPreviewParticipant(null)}
        />
      )}
    </div>
  );
};
