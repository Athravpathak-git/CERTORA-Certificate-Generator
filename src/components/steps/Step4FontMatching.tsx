import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Type,
  ChevronRight,
  ChevronLeft,
  Check,
  Palette,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Wand2,
  Upload,
  Globe,
  FileText,
} from 'lucide-react';
import { CertificateField, CertificateTemplate } from '../../types';
import {
  AVAILABLE_FONTS,
  CERTIFICATE_COLOR_PALETTE,
  MARATHI_TEST_STRINGS,
  FontOption,
} from '../../constants/fonts';

interface Step4FontMatchingProps {
  template: CertificateTemplate | null;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFields: (fields: CertificateField[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4FontMatching: React.FC<Step4FontMatchingProps> = ({
  template,
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateFields,
  onNext,
  onBack,
}) => {
  const [fontList, setFontList] = useState<FontOption[]>(AVAILABLE_FONTS);
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>('all');
  const [previewTestText, setPreviewTestText] = useState<string>('अथर्व पाठक (Atharva Pathak)');
  const [uploadedFontStatus, setUploadedFontStatus] = useState<string | null>(null);
  const fontUploadRef = useRef<HTMLInputElement>(null);

  // Target field is candidate_name by default, or whichever field is selected
  const activeField =
    fields.find((f) => f.id === selectedFieldId) ||
    fields.find((f) => f.type === 'candidate_name') ||
    fields[0];

  const updateField = (patch: Partial<CertificateField>) => {
    if (!activeField) return;
    onUpdateFields(
      fields.map((f) => (f.id === activeField.id ? { ...f, ...patch } : f))
    );
  };

  // AI Font matching recommendation logic
  const topDetectedFont = template?.detectedFonts?.[0];
  const suggestedFontOption: FontOption =
    fontList.find((f) => f.name === topDetectedFont?.suggestedMatch) ||
    fontList[0]; // Playfair Display

  const handleApplyAISuggestion = (fontName: string, size?: number) => {
    updateField({
      fontFamily: fontName,
      fontSize: size || activeField.fontSize,
      fontWeight: 'bold',
      letterSpacing: 2,
    });
  };

  // Custom TTF / OTF font file loader
  const handleCustomFontUpload = async (file: File) => {
    try {
      setUploadedFontStatus(null);
      const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\s]/g, '');
      const buffer = await file.arrayBuffer();

      const fontFace = new FontFace(fontName, buffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      const customOption: FontOption = {
        name: fontName,
        family: `"${fontName}", sans-serif`,
        category: 'Display',
        language: 'Multilingual',
        pdfLibFont: 'Custom',
        description: 'User-uploaded custom font from local file',
        recommendedFor: 'Custom typography uploaded from local storage',
      };

      setFontList((prev) => [customOption, ...prev]);
      updateField({ fontFamily: fontName });
      setUploadedFontStatus(`Loaded font "${fontName}" successfully!`);
    } catch (err: any) {
      console.error(err);
      setUploadedFontStatus(`Failed to load font: ${err.message || 'Unknown error'}`);
    }
  };

  const filteredFonts = fontList.filter((f) => {
    if (fontCategoryFilter === 'all') return true;
    if (fontCategoryFilter === 'devanagari') {
      return (
        f.language?.includes('Devanagari') ||
        f.category.toLowerCase().includes('devanagari') ||
        f.name.toLowerCase().includes('devanagari') ||
        f.name === 'Mukta' ||
        f.name === 'Hind'
      );
    }
    if (fontCategoryFilter === 'serif') return f.category.toLowerCase().includes('serif');
    if (fontCategoryFilter === 'sans') return f.category.toLowerCase().includes('sans');
    if (fontCategoryFilter === 'script') return f.category.toLowerCase().includes('script');
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Step 4 of 12 • Typography Studio
          </span>
          <h2 className="text-2xl font-bold text-navy-900 mt-2">
            Intelligent Font Matching & Marathi Unicode Typography
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ensure participant names blend authentically into the original certificate. Full native support for Marathi (Devanagari matras & conjuncts) and English.
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
            <span>Enter Participants</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Font Analysis Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-brand-900 via-indigo-900 to-navy-900 text-white shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Typography Matcher Engine</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              {template?.fileType === 'pdf' && template.detectedFonts.length > 0
                ? `Detected ${template.detectedFonts.length} embedded styles in your certificate`
                : 'Optimal Typography Pairing for Certificate'}
            </h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              {template?.fileType === 'pdf' && template.detectedFonts.length > 0
                ? `The engine analyzed original text tokens and recommends "${suggestedFontOption.name}" for balanced proportions, contrast and natural integration.`
                : 'Based on certificate structure, high-contrast serif, regal display, or Devanagari Unicode typography blend best for participant names.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                handleApplyAISuggestion(
                  suggestedFontOption.name,
                  topDetectedFont?.estimatedSize ? Math.min(60, topDetectedFont.estimatedSize * 1.5) : 48
                )
              }
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span>Apply AI Match: {suggestedFontOption.name}</span>
            </button>
          </div>
        </div>

        {/* Embedded fonts detected pills */}
        {template?.detectedFonts && template.detectedFonts.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-indigo-300 text-[11px] font-semibold uppercase">
              Scanned In Document:
            </span>
            {template.detectedFonts.slice(0, 4).map((f, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-white/10 text-white font-mono text-[11px] border border-white/10"
              >
                {f.fontName} ({f.estimatedSize}pt)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Field Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        <span className="text-xs font-bold uppercase text-slate-400 flex-shrink-0 mr-2">
          Styling Target:
        </span>
        {fields
          .filter((f) => f.type !== 'signature' && f.type !== 'qr_code')
          .map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectField(f.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                f.id === activeField?.id
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
      </div>

      {/* Live Sample Test Phrase Selector */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Script Test Phrases (Marathi & English)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Click a phrase to preview rendering:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {MARATHI_TEST_STRINGS.map((str, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPreviewTestText(str)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                previewTestText === str
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {str}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={previewTestText}
            onChange={(e) => setPreviewTestText(e.target.value)}
            placeholder="Type custom English or Marathi text to test font glyphs..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Main Typography Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Typography Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Font Family Selection Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-brand-600" />
                <span>Font Family Selection ({filteredFonts.length})</span>
              </label>

              {/* Upload Custom Font Button */}
              <div>
                <input
                  ref={fontUploadRef}
                  type="file"
                  accept=".ttf,.otf,font/ttf,font/otf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleCustomFontUpload(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fontUploadRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Upload local .ttf or .otf font"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom TTF/OTF</span>
                </button>
              </div>
            </div>

            {uploadedFontStatus && (
              <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                {uploadedFontStatus}
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Fonts' },
                { id: 'devanagari', label: 'Marathi / Devanagari' },
                { id: 'serif', label: 'Classic Serif' },
                { id: 'sans', label: 'Modern Sans' },
                { id: 'script', label: 'Script & Formal' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFontCategoryFilter(tab.id)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    fontCategoryFilter === tab.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredFonts.map((font) => {
                const isSelected = activeField?.fontFamily === font.name;
                const isDevanagari = font.language?.includes('Devanagari') || font.category === 'Devanagari';
                return (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => updateField({ fontFamily: font.name })}
                    className={`text-left p-3 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-navy-900">{font.name}</span>
                      <div className="flex items-center gap-1">
                        {isDevanagari && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            मराठी
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {font.category}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{ fontFamily: font.family }}
                      className="text-base text-slate-800 font-semibold truncate my-1"
                    >
                      {previewTestText.split('(')[0].trim() || 'Atharva Pathak'}
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">
                      {font.recommendedFor}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizing, Weight, Style & Spacing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              <span>Size, Weight & Style Controls</span>
            </h4>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Font Size</span>
                <span className="font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {activeField?.fontSize || 48} pt
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="96"
                step="1"
                value={activeField?.fontSize || 48}
                onChange={(e) => updateField({ fontSize: parseInt(e.target.value) || 48 })}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>12pt (Small)</span>
                <span>48pt (Standard Name)</span>
                <span>96pt (Large)</span>
              </div>
            </div>

            {/* Weight and Style */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Font Weight
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => updateField({ fontWeight: 'normal' })}
                    className={`py-1.5 rounded-lg transition-all ${
                      activeField?.fontWeight === 'normal'
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField({ fontWeight: 'bold' })}
                    className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      activeField?.fontWeight === 'bold'
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                    <span>Bold</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Style (Italic)
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => updateField({ fontStyle: 'normal' })}
                    className={`py-1.5 rounded-lg transition-all ${
                      activeField?.fontStyle === 'normal'
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upright
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField({ fontStyle: 'italic' })}
                    className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      activeField?.fontStyle === 'italic'
                        ? 'bg-white text-navy-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                    <span>Italic</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Letter Spacing (Kerning) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Letter Spacing (Kerning)</span>
                <span className="font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                  {activeField?.letterSpacing || 0} px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={activeField?.letterSpacing || 0}
                onChange={(e) => updateField({ letterSpacing: parseFloat(e.target.value) || 0 })}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Alignment & Transform */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alignment
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => updateField({ align: 'left' })}
                    className={`py-1.5 flex justify-center rounded-lg ${
                      activeField?.align === 'left' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField({ align: 'center' })}
                    className={`py-1.5 flex justify-center rounded-lg ${
                      activeField?.align === 'center' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField({ align: 'right' })}
                    className={`py-1.5 flex justify-center rounded-lg ${
                      activeField?.align === 'right' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Casing
                </label>
                <select
                  value={activeField?.transform || 'none'}
                  onChange={(e) => updateField({ transform: e.target.value as any })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="none">As Typed (Original / Marathi)</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="capitalize">Title Case</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Color Palette & Live Typography Preview Box */}
        <div className="lg:col-span-5 space-y-6">
          {/* Certificate Color Picker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-600" />
              <span>Authentic Certificate Color</span>
            </h4>

            {/* Curated Swatches */}
            <div className="grid grid-cols-4 gap-2.5">
              {CERTIFICATE_COLOR_PALETTE.map((color) => {
                const isSelected = activeField?.color.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => updateField({ color: color.hex })}
                    className={`group flex flex-col items-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: color.hex }}
                      className="w-8 h-8 rounded-full shadow-inner border border-black/10 mb-1.5"
                    />
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Color Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="color"
                value={activeField?.color || '#0F172A'}
                onChange={(e) => updateField({ color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={activeField?.color || '#0F172A'}
                  onChange={(e) => updateField({ color: e.target.value })}
                  placeholder="#0F172A"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold text-slate-800 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Live Typography Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-navy-900">Live Typography Preview</h4>
              <span className="text-xs font-mono text-slate-400">
                {activeField?.label}
              </span>
            </div>

            <div
              className="w-full min-h-[160px] rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
              style={{
                backgroundColor: '#FCFBF7',
                backgroundImage: 'radial-gradient(circle, rgba(217, 119, 6, 0.04) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              <div className="text-[11px] font-semibold text-amber-700/70 tracking-widest uppercase mb-1">
                PROUDLY PRESENTED TO / सन्मानपूर्वक प्रदान
              </div>

              <div
                style={{
                  fontFamily: activeField?.fontFamily,
                  fontSize: `${Math.min(36, (activeField?.fontSize || 48) * 0.7)}px`,
                  fontWeight: activeField?.fontWeight === 'bold' ? 'bold' : 'normal',
                  fontStyle: activeField?.fontStyle,
                  color: activeField?.color,
                  letterSpacing: `${activeField?.letterSpacing}px`,
                  textAlign: activeField?.align,
                }}
                className="w-full truncate px-4 transition-all"
              >
                {previewTestText}
              </div>

              <div className="w-2/3 h-0.5 bg-amber-600/30 mt-2" />

              <div className="text-[11px] text-slate-500 mt-2 max-w-xs italic">
                for extraordinary dedication and verified contributions
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-[11px] leading-relaxed">
              💡 <strong>Marathi Rendering Engine:</strong> Devanagari text uses high-resolution canvas vector rendering in the PDF export to ensure matras, ligatures, and conjuncts (e.g. अथर्व, उत्कृष्ट) render crisp without missing glyphs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
