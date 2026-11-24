import React from 'react';
import {
  Calendar,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Award,
  Sparkles,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import {
  CertificateField,
  DateFormat,
  DateSettings,
  Participant,
} from '../../types';
import { formatDate } from '../../utils/formatters';

interface Step6CustomDataProps {
  fields: CertificateField[];
  onUpdateFields: (fields: CertificateField[]) => void;
  dateSettings: DateSettings;
  onUpdateDateSettings: (settings: DateSettings) => void;
  participants: Participant[];
  onUpdateParticipants: (participants: Participant[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step6CustomData: React.FC<Step6CustomDataProps> = ({
  fields,
  onUpdateFields,
  dateSettings,
  onUpdateDateSettings,
  participants,
  onUpdateParticipants,
  onNext,
  onBack,
}) => {
  const dateField = fields.find((f) => f.type === 'date');

  // Toggle field enable
  const toggleField = (id: string, enabled: boolean) => {
    onUpdateFields(
      fields.map((f) => (f.id === id ? { ...f, enabled } : f))
    );
  };

  // Update static value for all participants
  const updateStaticValue = (id: string, staticValue: string) => {
    onUpdateFields(
      fields.map((f) => (f.id === id ? { ...f, staticValue } : f))
    );
  };

  // Calculate formatted date preview
  const previewDate =
    dateSettings.mode === 'today'
      ? formatDate(new Date().toISOString(), dateSettings.format)
      : dateSettings.mode === 'custom'
      ? formatDate(dateSettings.customDate, dateSettings.format)
      : '';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 6 of 9
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Optional Performance & Date Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure certificate issuance date and optional fields (Performance, Rank, Score, Event Name).
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
            <span>Live Certificate Preview</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Date Settings */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Issuance Date Settings</span>
              </h4>

              {dateField && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <span>Enable on Certificate</span>
                  <input
                    type="checkbox"
                    checked={dateField.enabled && dateSettings.mode !== 'disabled'}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      toggleField(dateField.id, enabled);
                      if (!enabled) {
                        onUpdateDateSettings({ ...dateSettings, mode: 'disabled' });
                      } else {
                        onUpdateDateSettings({ ...dateSettings, mode: 'today' });
                      }
                    }}
                    className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  />
                </label>
              )}
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  onUpdateDateSettings({ ...dateSettings, mode: 'today' });
                  if (dateField) toggleField(dateField.id, true);
                }}
                className={`py-2 rounded-lg transition-all ${
                  dateSettings.mode === 'today'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today's Date
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateDateSettings({ ...dateSettings, mode: 'custom' });
                  if (dateField) toggleField(dateField.id, true);
                }}
                className={`py-2 rounded-lg transition-all ${
                  dateSettings.mode === 'custom'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Date
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateDateSettings({ ...dateSettings, mode: 'disabled' });
                  if (dateField) toggleField(dateField.id, false);
                }}
                className={`py-2 rounded-lg transition-all ${
                  dateSettings.mode === 'disabled'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disabled
              </button>
            </div>

            {/* Custom Date Input */}
            {dateSettings.mode === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Custom Date
                </label>
                <input
                  type="date"
                  value={dateSettings.customDate}
                  onChange={(e) =>
                    onUpdateDateSettings({ ...dateSettings, customDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Date Formatting Dropdown */}
            {dateSettings.mode !== 'disabled' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date Format
                </label>
                <select
                  value={dateSettings.format}
                  onChange={(e) =>
                    onUpdateDateSettings({
                      ...dateSettings,
                      format: e.target.value as DateFormat,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 12/11/2026)</option>
                  <option value="DD Month YYYY">DD Month YYYY (e.g. 12 November 2026)</option>
                  <option value="Month DD, YYYY">Month DD, YYYY (e.g. November 12, 2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-12)</option>
                </select>
              </div>
            )}

            {/* Date Preview Box */}
            {dateSettings.mode !== 'disabled' && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-500">Rendered Date Output:</span>
                <span className="font-mono font-bold text-navy-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                  {previewDate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Optional Performance & Achievement Fields */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-brand-600" />
                <span>Optional Performance & Event Fields</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Toggle and provide global values or individual values mapped from participant rosters.
              </p>
            </div>

            <div className="space-y-4">
              {fields
                .filter(
                  (f) =>
                    !['candidate_name', 'date', 'signature'].includes(f.type)
                )
                .map((field) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy-900">
                          {field.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-500">
                          {field.type}
                        </span>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <span className={field.enabled ? 'text-brand-600' : 'text-slate-400'}>
                          {field.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={(e) => toggleField(field.id, e.target.checked)}
                          className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                        />
                      </label>
                    </div>

                    {field.enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Default / Global Value
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Distinction, 1st Place..."
                            value={field.staticValue}
                            onChange={(e) => updateStaticValue(field.id, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            CSV Data Mapping
                          </label>
                          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono truncate">
                            fieldKey: {field.fieldKey}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
