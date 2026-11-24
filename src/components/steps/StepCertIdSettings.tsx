import React from 'react';
import {
  Hash,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { CertIdSettings, Participant } from '../../types';
import {
  assignCertificateIds,
  formatCertificateId,
} from '../../services/certIdService';

interface StepCertIdSettingsProps {
  settings: CertIdSettings;
  onUpdateSettings: (settings: CertIdSettings) => void;
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepCertIdSettings: React.FC<StepCertIdSettingsProps> = ({
  settings,
  onUpdateSettings,
  participants,
  onUpdateParticipants,
  onNext,
  onBack,
}) => {
  const updateSetting = (patch: Partial<CertIdSettings>) => {
    const updated = { ...settings, ...patch };
    onUpdateSettings(updated);
    // Auto-update participants
    onUpdateParticipants(assignCertificateIds(participants, updated, true));
  };

  const handleForceReassign = () => {
    const updated = assignCertificateIds(participants, settings, true);
    onUpdateParticipants(updated);
  };

  // Previews
  const preview1 = formatCertificateId(settings.startNumber, settings);
  const preview2 = formatCertificateId(settings.startNumber + 1, settings);
  const preview3 = formatCertificateId(settings.startNumber + 2, settings);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 7 of 12
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Auto Certificate ID & Sequential Numbering
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generate unique cryptographic serial IDs for every participant. Included in QR codes and verification manifests.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            onClick={onNext}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <span>Proceed to Bulk Preview</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: ID Structure Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-600" />
                <span>Certificate ID Pattern Customization</span>
              </h4>

              <button
                type="button"
                onClick={handleForceReassign}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-sequence All IDs</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prefix */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prefix (Organisation / Event)
                </label>
                <input
                  type="text"
                  value={settings.prefix}
                  onChange={(e) => updateSetting({ prefix: e.target.value.toUpperCase() })}
                  placeholder="CERT, UNI, AWARDS..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Year
                </label>
                <input
                  type="text"
                  value={settings.year}
                  onChange={(e) => updateSetting({ year: e.target.value })}
                  placeholder="2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Start Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Starting Serial Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.startNumber}
                  onChange={(e) =>
                    updateSetting({ startNumber: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Zero-padding length */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zero-Padding Length
                </label>
                <select
                  value={settings.paddingLength}
                  onChange={(e) =>
                    updateSetting({ paddingLength: parseInt(e.target.value) || 4 })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="3">3 Digits (001, 002...)</option>
                  <option value="4">4 Digits (0001, 0002...)</option>
                  <option value="5">5 Digits (00001, 00002...)</option>
                  <option value="6">6 Digits (000001, 000002...)</option>
                </select>
              </div>
            </div>

            {/* Separator */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Separator Character
              </label>
              <div className="flex gap-2">
                {['-', '/', '_', '.'].map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    onClick={() => updateSetting({ separator: sep })}
                    className={`px-4 py-1.5 rounded-lg font-mono font-bold text-xs border ${
                      settings.separator === sep
                        ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-400/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {sep === '-' ? 'Hyphen (-)' : sep === '/' ? 'Slash (/)' : sep === '_' ? 'Underscore (_)' : 'Dot (.)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Sequential Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-brand-600" />
              <span>Live ID Generation Preview</span>
            </h4>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">1st Participant:</span>
                <span className="font-bold text-navy-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                  {preview1}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">2nd Participant:</span>
                <span className="font-bold text-navy-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                  {preview2}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">3rd Participant:</span>
                <span className="font-bold text-navy-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                  {preview3}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Guaranteed Uniqueness:</strong> All {participants.length} participants in this batch have been assigned strict non-duplicating sequential IDs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
