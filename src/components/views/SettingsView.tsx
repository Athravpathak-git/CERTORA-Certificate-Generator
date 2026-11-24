import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Calendar,
  Hash,
  QrCode,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Save,
  ArrowRight,
  Info,
  Languages,
  Check,
  Award,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CertIdSettings,
  DateSettings,
  SerialNumberSettings,
  DateFormat,
  ActiveView,
  Participant,
} from '../../types';
import { generateCertId } from '../../services/certIdService';
import { AppLanguage, t } from '../../services/i18n';
import { VerificationView } from './VerificationView';
import { AboutView } from './AboutView';

interface SettingsViewProps {
  certIdSettings: CertIdSettings;
  onUpdateCertIdSettings: (settings: CertIdSettings) => void;
  serialSettings: SerialNumberSettings;
  onUpdateSerialSettings: (settings: SerialNumberSettings) => void;
  dateSettings: DateSettings;
  onUpdateDateSettings: (settings: DateSettings) => void;
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  onNavigateView: (view: ActiveView) => void;
  language: AppLanguage;
  onUpdateLanguage: (lang: AppLanguage) => void;
  projectName?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  certIdSettings,
  onUpdateCertIdSettings,
  serialSettings,
  onUpdateSerialSettings,
  dateSettings,
  onUpdateDateSettings,
  participants,
  onUpdateParticipants,
  onNavigateView,
  language = 'en',
  onUpdateLanguage,
  projectName = 'Certora Certificate Project',
}) => {
  const [localCertId, setLocalCertId] = useState<CertIdSettings>({ ...certIdSettings });
  const [localSerial, setLocalSerial] = useState<SerialNumberSettings>({ ...serialSettings });
  const [localDate, setLocalDate] = useState<DateSettings>({ ...dateSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Collapsible tabs / sections
  const [activeTab, setActiveTab] = useState<'preferences' | 'verification' | 'about'>('preferences');

  // Live Sample Preview
  const sampleCertId = generateCertId(localCertId, 0);
  const sampleSerial = `${localSerial.prefix}${String(localSerial.startNumber).padStart(localSerial.paddingLength, '0')}`;

  const handleApplyToAll = () => {
    onUpdateCertIdSettings(localCertId);
    onUpdateSerialSettings(localSerial);
    onUpdateDateSettings(localDate);

    // Recompute IDs for existing participants if any
    if (participants.length > 0) {
      const updated = participants.map((p, index) => {
        const certId = generateCertId(localCertId, index);
        const serialNum = `${localSerial.prefix}${String(localSerial.startNumber + index).padStart(localSerial.paddingLength, '0')}`;
        return {
          ...p,
          certId,
          serialNumber: serialNum,
          fields: {
            ...p.fields,
            cert_id: certId,
            serial_number: serialNum,
          },
        };
      });
      onUpdateParticipants(updated);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    const defaultCertId: CertIdSettings = {
      enabled: true,
      prefix: 'ATH',
      year: '2026',
      startNumber: 1,
      paddingLength: 4,
      separator: '-',
    };
    const defaultSerial: SerialNumberSettings = {
      enabled: false,
      prefix: '',
      startNumber: 1,
      paddingLength: 3,
    };
    const defaultDate: DateSettings = {
      mode: 'today',
      customDate: new Date().toISOString().split('T')[0],
      format: 'DD Month YYYY',
    };

    setLocalCertId(defaultCertId);
    setLocalSerial(defaultSerial);
    setLocalDate(defaultDate);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* 1. Top Header */}
      <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold-dark text-xs font-bold mb-2">
            <Settings className="w-3.5 h-3.5 text-gold" />
            <span>CERTORA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-google-sans font-bold text-[#182536]">
            {t('settings', language)}
          </h2>
          <p className="text-sm text-[#77818C] mt-1">
            Configure language preferences, certificate numbering patterns, and verification tools.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[#F5F1E8] p-1.5 rounded-2xl border border-[#E8E5DD]">
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'preferences'
                ? 'bg-white text-[#182536] shadow-sm'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            Preferences &amp; IDs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'verification'
                ? 'bg-white text-[#182536] shadow-sm'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            Verification Tool
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'about'
                ? 'bg-white text-[#182536] shadow-sm'
                : 'text-[#77818C] hover:text-[#182536]'
            }`}
          >
            About Studio
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PREFERENCES & CERTIFICATE NUMBERING                      */}
      {/* ============================================================== */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Section: Interface Language (Section 14) */}
          <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#182536]">
                    Interface Language Preference
                  </h3>
                  <p className="text-xs text-[#77818C]">
                    Choose the application language. Clean labels with zero bilingual bracketed clutter.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <button
                type="button"
                onClick={() => onUpdateLanguage('en')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  language === 'en'
                    ? 'border-gold bg-gold/10 shadow-xs'
                    : 'border-[#E8E5DD] bg-[#FAF8F5] hover:border-gold/50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-[#182536]">English</div>
                  <div className="text-xs text-[#77818C] mt-0.5">Default Studio Interface</div>
                </div>
                {language === 'en' && <Check className="w-5 h-5 text-gold-dark stroke-[3]" />}
              </button>

              <button
                type="button"
                onClick={() => onUpdateLanguage('mr')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  language === 'mr'
                    ? 'border-gold bg-gold/10 shadow-xs'
                    : 'border-[#E8E5DD] bg-[#FAF8F5] hover:border-gold/50'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-[#182536]">मराठी</div>
                  <div className="text-xs text-[#77818C] mt-0.5">देवनागरी इंटरफेस</div>
                </div>
                {language === 'mr' && <Check className="w-5 h-5 text-gold-dark stroke-[3]" />}
              </button>
            </div>
          </div>

          {/* Section: Certificate ID Configuration */}
          <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#182536]">
                    Unique Certificate ID Pattern
                  </h3>
                  <p className="text-xs text-[#77818C]">
                    Defines the sequential ID assigned to each certificate for verification.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#77818C]">Status:</span>
                <button
                  type="button"
                  onClick={() => setLocalCertId({ ...localCertId, enabled: !localCertId.enabled })}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    localCertId.enabled
                      ? 'bg-status-success/15 text-status-success border border-status-success/30'
                      : 'bg-[#FAF8F5] text-[#77818C] border border-[#E8E5DD]'
                  }`}
                >
                  {localCertId.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            {localCertId.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#182536]">Prefix</label>
                  <input
                    type="text"
                    value={localCertId.prefix}
                    onChange={(e) => setLocalCertId({ ...localCertId, prefix: e.target.value.toUpperCase() })}
                    placeholder="ATH"
                    className="input-clean text-xs uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#182536]">Year</label>
                  <input
                    type="text"
                    value={localCertId.year}
                    onChange={(e) => setLocalCertId({ ...localCertId, year: e.target.value })}
                    placeholder="2026"
                    className="input-clean text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#182536]">Starting Number</label>
                  <input
                    type="number"
                    min="1"
                    value={localCertId.startNumber}
                    onChange={(e) => setLocalCertId({ ...localCertId, startNumber: Number(e.target.value) || 1 })}
                    className="input-clean text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#182536]">Digits (Padding)</label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={localCertId.paddingLength}
                    onChange={(e) => setLocalCertId({ ...localCertId, paddingLength: Number(e.target.value) || 4 })}
                    className="input-clean text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Live ID Preview */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E5DD] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#77818C]">
                  Generated Sample ID Preview
                </span>
                <div className="text-base font-mono font-bold text-gold-dark mt-0.5">
                  {sampleCertId}
                </div>
              </div>
              <span className="text-xs text-[#77818C]">
                Pattern: {localCertId.prefix}-{localCertId.year}-0001
              </span>
            </div>
          </div>

          {/* Section: Date Settings */}
          <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-[#E8E5DD] pb-3">
              <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#182536]">
                  Date Formatting Settings
                </h3>
                <p className="text-xs text-[#77818C]">
                  Configure how dates are printed on certificates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#182536]">Date Mode</label>
                <select
                  value={localDate.mode}
                  onChange={(e) => setLocalDate({ ...localDate, mode: e.target.value as any })}
                  className="input-clean text-xs"
                >
                  <option value="today">Today's Date (Dynamic)</option>
                  <option value="custom">Custom Fixed Date</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#182536]">Date Format</label>
                <select
                  value={localDate.format}
                  onChange={(e) => setLocalDate({ ...localDate, format: e.target.value as DateFormat })}
                  className="input-clean text-xs font-mono"
                >
                  <option value="DD Month YYYY">15 August 2026</option>
                  <option value="Month DD, YYYY">August 15, 2026</option>
                  <option value="DD/MM/YYYY">15/08/2026</option>
                  <option value="MM/DD/YYYY">08/15/2026</option>
                  <option value="YYYY-MM-DD">2026-08-15</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleApplyToAll}
              className="btn-gold py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Save &amp; Apply Changes</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-status-success/15 border border-status-success/30 text-status-success text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Settings saved and applied successfully across all participants!</span>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: LOCAL CERTIFICATE VERIFICATION TOOL                      */}
      {/* ============================================================== */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 shadow-xs">
          <VerificationView
            participants={participants}
            projectName={projectName}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ABOUT STUDIO & ARCHITECTURE                              */}
      {/* ============================================================== */}
      {activeTab === 'about' && (
        <div className="bg-white rounded-3xl border border-[#E8E5DD] p-6 shadow-xs">
          <AboutView onNavigateView={onNavigateView} />
        </div>
      )}
    </div>
  );
};
