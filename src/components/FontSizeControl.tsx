import React from 'react';
import { Minus, Plus, RotateCcw, AlertTriangle } from 'lucide-react';

interface FontSizeControlProps {
  fontSize: number;
  defaultFontSize?: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  fieldLabel?: string;
  isOverflowing?: boolean;
  onChange: (newSize: number) => void;
  onReset?: () => void;
  presets?: number[];
  compact?: boolean;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({
  fontSize,
  defaultFontSize = 24,
  min = 4,
  max,
  step = 1,
  label = 'Font Size',
  fieldLabel,
  isOverflowing = false,
  onChange,
  onReset,
  presets = [14, 18, 24, 32, 48, 80, 150, 300, 500],
  compact = false,
}) => {
  const currentSize = Math.max(1, Math.round(fontSize || defaultFontSize));
  const targetDefault = Math.round(defaultFontSize);
  const isDifferentFromDefault = currentSize !== targetDefault;

  // The slider dynamically expands to adapt to any custom entered font size without a fixed 80px limit
  const sliderMax = Math.max(120, max || 120, Math.ceil((currentSize * 1.35) / 25) * 25);

  const handleDecrease = () => {
    const delta = currentSize > 200 ? 10 : currentSize > 100 ? 5 : step;
    onChange(Math.max(min, currentSize - delta));
  };

  const handleIncrease = () => {
    const delta = currentSize >= 200 ? 10 : currentSize >= 100 ? 5 : step;
    onChange(currentSize + delta);
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      // Allows ANY font size: 80px, 150px, 300px, 500px or larger without capping
      onChange(val);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onChange(targetDefault);
    }
  };

  return (
    <div className="space-y-2.5 font-sans">
      {/* Header with Title, Live Size Badge & Reset Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="font-bold text-xs text-[#182536]">
            {fieldLabel ? `${fieldLabel} ${label}` : label}
          </label>
          <span className="px-2.5 py-0.5 rounded-md bg-[#182536] text-[#C4A878] font-mono text-[11px] font-bold border border-[#C4A878]/30 shadow-2xs">
            {currentSize} px
          </span>
        </div>

        {isDifferentFromDefault && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-semibold text-[#77818C] hover:text-[#182536] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-slate-100 border border-transparent hover:border-[#E8E5DD]"
            title={`Reset font size to template default (${targetDefault}px)`}
          >
            <RotateCcw className="w-3 h-3 text-[#C4A878]" />
            <span>Reset ({targetDefault}px)</span>
          </button>
        )}
      </div>

      {/* Main Control Row: [-] [Dynamic Adaptive Slider] [+] [Uncapped Numeric Input] */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={currentSize <= min}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] font-bold flex items-center justify-center transition-all hover:bg-[#FAF8F5] disabled:opacity-30 shadow-2xs active:scale-95 shrink-0"
          title="Decrease Font Size"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 px-1 flex items-center">
          <input
            type="range"
            min={min}
            max={sliderMax}
            step={step}
            value={currentSize}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-[#C4A878] cursor-pointer h-2 bg-[#E8E5DD] rounded-lg"
            title={`Adjust font size: ${currentSize}px (Range: ${min}px - ${sliderMax}px)`}
          />
        </div>

        <button
          type="button"
          onClick={handleIncrease}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-[#E8E5DD] hover:border-[#C4A878] text-[#182536] font-bold flex items-center justify-center transition-all hover:bg-[#FAF8F5] shadow-2xs active:scale-95 shrink-0"
          title="Increase Font Size (Unrestricted)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={min}
            value={currentSize}
            onChange={handleNumericChange}
            className="w-14 sm:w-16 px-1.5 py-1 rounded-xl border border-[#E8E5DD] text-center font-mono font-bold text-xs bg-white text-[#182536] focus:border-[#C4A878] focus:outline-none shadow-2xs"
            title="Type any font size in pixels (e.g. 80, 150, 300, 500)"
          />
          <span className="text-[11px] font-bold text-[#77818C]">px</span>
        </div>
      </div>

      {/* Quick Preset Buttons (including large sizes 80px, 150px, 300px, 500px) */}
      {!compact && presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] font-bold text-[#77818C] uppercase tracking-wider mr-1">
            Presets:
          </span>
          {presets.map((size) => {
            const isSelected = size === currentSize;
            return (
              <button
                key={size}
                type="button"
                onClick={() => onChange(size)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                  isSelected
                    ? 'bg-[#182536] text-[#C4A878] border-[#182536] shadow-2xs'
                    : 'bg-white border-[#E8E5DD] text-[#253246] hover:border-[#C4A878] hover:bg-[#FAF8F5]'
                }`}
              >
                {size}px
              </button>
            );
          })}
        </div>
      )}

      {/* Visual Text Overflow Indicator Banner */}
      {isOverflowing && (
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] animate-fade-in shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>
            Text exceeds allocated width at <strong>{currentSize}px</strong>. You can expand the element on the canvas or adjust the font size.
          </span>
        </div>
      )}
    </div>
  );
};
