import React, { useState, useEffect } from 'react';
import { MainStudioPortal } from './components/MainStudioPortal';
import {
  CertificateField,
  CertificateTemplate,
  CertIdSettings,
  DateSettings,
  Participant,
  ProjectData,
  ProjectSummary,
  SerialNumberSettings,
  SignatureData,
} from './types';
import { getDefaultFields } from './constants/sampleData';
import {
  exportProjectFile,
  getProjectFromStorage,
  listStoredProjects,
  saveProjectToStorage,
  validateAndParseProjectFile,
} from './services/projectStorage';
import { AppLanguage } from './services/i18n';
import { createUniversalTemplates } from './services/templateCatalog';
import saveAs from 'file-saver';
import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // Application Interface Language (English / Marathi toggle, strictly without bracketed text)
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('athrav_studio_lang');
      return saved === 'mr' ? 'mr' : 'en';
    } catch {
      return 'en';
    }
  });

  const handleUpdateLanguage = (newLang: AppLanguage) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('athrav_studio_lang', newLang);
    } catch {}
  };

  // Project Metadata
  const [projectName, setProjectName] = useState<string>('Certora Certificate Project');

  // Templates
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const template =
    templates.find((t) => t.id === activeTemplateId) ||
    templates[0] ||
    null;

  // Signature (Transparent PNG + original data)
  const [signature, setSignature] = useState<SignatureData | null>(null);

  // Fields & Typography (Default font: Google Sans Bold)
  const [fields, setFields] = useState<CertificateField[]>(getDefaultFields());
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('field-candidate-name');

  // Participants & Data
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Certificate Date Settings
  const [dateSettings, setDateSettings] = useState<DateSettings>({
    mode: 'today',
    customDate: new Date().toISOString().split('T')[0],
    format: 'DD Month YYYY',
  });

  // Certificate ID Settings (Default OFF per user requirement, optional in Advanced Options)
  const [certIdSettings, setCertIdSettings] = useState<CertIdSettings>({
    enabled: false,
    prefix: 'ATH',
    year: '2026',
    startNumber: 1,
    paddingLength: 4,
    separator: '-',
  });

  // Serial Number Settings
  const [serialSettings, setSerialSettings] = useState<SerialNumberSettings>({
    enabled: false,
    prefix: '',
    startNumber: 1,
    paddingLength: 3,
  });

  // Saved Projects from IndexedDB
  const [storedProjects, setStoredProjects] = useState<ProjectSummary[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Refresh stored projects list on mount
  const refreshProjectsList = async () => {
    try {
      const list = await listStoredProjects();
      setStoredProjects(list);
    } catch (err) {
      console.warn('Failed to load stored projects from IndexedDB:', err);
    }
  };

  // Refresh stored projects list & initialize Universal Certificate Templates on mount
  useEffect(() => {
    refreshProjectsList();

    if (templates.length === 0) {
      const universal = createUniversalTemplates();
      setTemplates(universal);
      if (universal.length > 0) {
        setActiveTemplateId(universal[0].id);
        if (universal[0].fieldConfig && universal[0].fieldConfig.length > 0) {
          setFields(universal[0].fieldConfig);
        }
      }
    }
  }, []);

  // Update fields and automatically synchronize with the active template's fieldConfig
  const handleUpdateFields = (newFields: CertificateField[]) => {
    setFields(newFields);
    if (activeTemplateId) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === activeTemplateId ? { ...t, fieldConfig: newFields } : t))
      );
    }
  };

  // Template Management Handlers
  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    const target = templates.find((t) => t.id === id);
    if (target?.fieldConfig && target.fieldConfig.length > 0) {
      setFields(target.fieldConfig);
    }
  };

  const handleAddTemplate = (newTpl: CertificateTemplate) => {
    setTemplates((prev) => {
      const existingIdx = prev.findIndex((t) => t.id === newTpl.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newTpl;
        return copy;
      }
      return [...prev, newTpl];
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (activeTemplateId === id) {
      const remaining = templates.filter((t) => t.id !== id);
      setActiveTemplateId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Current Project State Object
  const currentProjectData: ProjectData = {
    id: `proj-${Date.now()}`,
    name: projectName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    templates: templates.length > 0 ? templates : template ? [template] : [],
    activeTemplateId: activeTemplateId || template?.id || null,
    signature,
    fields,
    participants,
    dateSettings,
    certIdSettings,
    serialSettings,
  };

  // Save Project to IndexedDB
  const handleQuickSave = async () => {
    try {
      await saveProjectToStorage(currentProjectData);
      await refreshProjectsList();
      setSaveToast('Project saved securely to local browser storage!');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      alert('Failed to save project: ' + err.message);
    }
  };

  // Load Project by ID
  const handleLoadProjectById = async (id: string) => {
    try {
      const proj = await getProjectFromStorage(id);
      if (proj) {
        setProjectName(proj.name || 'Saved Project');
        if (proj.templates && proj.templates.length > 0) {
          setTemplates(proj.templates);
          const active =
            proj.templates.find((t) => t.id === proj.activeTemplateId) ||
            proj.templates[0];
          setActiveTemplateId(active.id);
          if (active.fieldConfig) setFields(active.fieldConfig);
          else if (proj.fields) setFields(proj.fields);
        }
        if (proj.signature) setSignature(proj.signature);
        if (proj.fields) setFields(proj.fields);
        if (proj.participants) setParticipants(proj.participants);
        if (proj.dateSettings) setDateSettings(proj.dateSettings);
        if (proj.certIdSettings) setCertIdSettings(proj.certIdSettings);
        if (proj.serialSettings) setSerialSettings(proj.serialSettings);

        setSaveToast(`Project "${proj.name}" loaded successfully.`);
        setTimeout(() => setSaveToast(null), 3000);
      }
    } catch (err: any) {
      alert('Failed to load project: ' + err.message);
    }
  };

  // Export Project (.certproj)
  const handleExportCertproj = () => {
    const blob = exportProjectFile(currentProjectData);
    saveAs(blob, `${projectName.replace(/\s+/g, '_')}.certproj`);
  };

  // Import Project (.certproj)
  const handleImportProjectFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = validateAndParseProjectFile(text);

        setProjectName(parsed.name || 'Imported Project');
        if (parsed.templates && parsed.templates.length > 0) {
          setTemplates(parsed.templates);
          setActiveTemplateId(parsed.activeTemplateId || parsed.templates[0].id);
        }
        if (parsed.signature) setSignature(parsed.signature);
        if (parsed.fields) setFields(parsed.fields);
        if (parsed.participants) setParticipants(parsed.participants);
        if (parsed.dateSettings) setDateSettings(parsed.dateSettings);
        if (parsed.certIdSettings) setCertIdSettings(parsed.certIdSettings);
        if (parsed.serialSettings) setSerialSettings(parsed.serialSettings);

        setSaveToast('Project file imported successfully!');
        setTimeout(() => setSaveToast(null), 3000);
      } catch (err: any) {
        alert('Invalid project file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSignatureLoaded = (sig: SignatureData | null) => {
    setSignature(sig);
    if (sig) {
      setFields((prev) =>
        prev.map((f) => (f.type === 'signature' && (f.id === 'field-signature' || !f.signatureData) ? { ...f, signatureData: sig, enabled: true } : f))
      );
    }
  };

  return (
    <>
      <MainStudioPortal
        template={template}
        templates={templates}
        activeTemplateId={activeTemplateId}
        onSelectTemplate={handleSelectTemplate}
        onAddTemplate={handleAddTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        signature={signature}
        onSignatureLoaded={handleSignatureLoaded}
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelectField={setSelectedFieldId}
        onUpdateFields={handleUpdateFields}
        participants={participants}
        onUpdateParticipants={setParticipants}
        dateSettings={dateSettings}
        onUpdateDateSettings={setDateSettings}
        certIdSettings={certIdSettings}
        onUpdateCertIdSettings={setCertIdSettings}
        serialSettings={serialSettings}
        onUpdateSerialSettings={setSerialSettings}
        storedProjects={storedProjects}
        currentProjectName={projectName}
        onSaveProject={handleQuickSave}
        onLoadProjectById={handleLoadProjectById}
        onRefreshProjects={refreshProjectsList}
        onExportProject={handleExportCertproj}
        onImportProjectFile={handleImportProjectFile}
        language={language}
        onUpdateLanguage={handleUpdateLanguage}
      />

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#182536] border border-[#C4A878]/60 text-[#F5F1E8] shadow-2xl animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#C4A878] shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}
    </>
  );
};

export default App;
