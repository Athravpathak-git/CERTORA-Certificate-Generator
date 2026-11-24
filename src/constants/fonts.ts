export interface FontOption {
  name: string;
  family: string;
  category: 'Serif' | 'Sans-Serif' | 'Script' | 'Display' | 'Devanagari';
  language?: 'Latin' | 'Devanagari (Marathi/Hindi)' | 'Multilingual';
  pdfLibFont: 'TimesRoman' | 'Helvetica' | 'Courier' | 'Custom';
  description: string;
  recommendedFor: string;
}

export const MARATHI_TEST_STRINGS = [
  'अथर्व पाठक',
  'सहभाग प्रमाणपत्र',
  'उत्कृष्ट कामगिरीबद्दल हार्दिक अभिनंदन',
  'शैक्षणिक आणि करिअर मार्गदर्शन',
  'प्रथम क्रमांक',
  'विशेष प्राविण्य',
];

export const AVAILABLE_FONTS: FontOption[] = [
  // 1. Google Sans (Primary Provided Font)
  {
    name: 'Google Sans Bold',
    family: '"Google Sans", "Google Sans Bold", sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Custom',
    description: 'Official premium bold geometric sans-serif (User Provided Font File)',
    recommendedFor: 'Default Candidate Names, Executive Titles & Key Honors',
  },
  {
    name: 'Google Sans',
    family: '"Google Sans", "Google Sans Bold", sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Custom',
    description: 'Modern geometric sans-serif with exceptional readability',
    recommendedFor: 'Subheadings, Field Values & Clean Certifications',
  },

  // 2. Standard & Modern Sans-Serif Fonts
  {
    name: 'Arial',
    family: 'Arial, Helvetica, sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Universal, crisp, neutral time-tested sans-serif',
    recommendedFor: 'Dates, ID codes & Technical Details',
  },
  {
    name: 'Roboto',
    family: 'Roboto, -apple-system, sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Geometric yet friendly modern digital sans-serif',
    recommendedFor: 'Body Text, Subtitles & Descriptions',
  },
  {
    name: 'Open Sans',
    family: '"Open Sans", sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Humanist sans-serif optimized for print and web legibility',
    recommendedFor: 'General Certificate Body & Institutional Text',
  },
  {
    name: 'Noto Sans',
    family: '"Noto Sans", sans-serif',
    category: 'Sans-Serif',
    language: 'Multilingual',
    pdfLibFont: 'Helvetica',
    description: 'Comprehensive universal font family for global scripts',
    recommendedFor: 'Multilingual Names, Global Event Certificates',
  },

  // Devanagari / Marathi Fonts
  {
    name: 'Noto Sans Devanagari',
    family: '"Noto Sans Devanagari", sans-serif',
    category: 'Devanagari',
    language: 'Devanagari (Marathi/Hindi)',
    pdfLibFont: 'Custom',
    description: 'Crisp, authentic Devanagari typography with pristine conjuncts',
    recommendedFor: 'Marathi/Hindi Candidate Names, Titles & Honors',
  },
  {
    name: 'Noto Serif Devanagari',
    family: '"Noto Serif Devanagari", Georgia, serif',
    category: 'Devanagari',
    language: 'Devanagari (Marathi/Hindi)',
    pdfLibFont: 'Custom',
    description: 'Classical prestigious Devanagari serif for diplomas',
    recommendedFor: 'Formal Marathi Degrees & Academic Fellowships',
  },
  {
    name: 'Mukta',
    family: 'Mukta, sans-serif',
    category: 'Devanagari',
    language: 'Devanagari (Marathi/Hindi)',
    pdfLibFont: 'Custom',
    description: 'Modern versatile Devanagari typeface with balanced matras',
    recommendedFor: 'Competitive Awards, Sports & Cultural Certificates',
  },
  {
    name: 'Hind',
    family: 'Hind, sans-serif',
    category: 'Devanagari',
    language: 'Devanagari (Marathi/Hindi)',
    pdfLibFont: 'Custom',
    description: 'Geometric legible Devanagari for clean subheadings & text',
    recommendedFor: 'Marathi Event Information & Statements',
  },

  // Latin Fonts
  {
    name: 'Playfair Display',
    family: '"Playfair Display", Georgia, serif',
    category: 'Serif',
    language: 'Latin',
    pdfLibFont: 'TimesRoman',
    description: 'Classic high-contrast luxury serif',
    recommendedFor: 'Honor, Distinction & Executive certificates',
  },
  {
    name: 'Cinzel',
    family: 'Cinzel, "Times New Roman", serif',
    category: 'Display',
    language: 'Latin',
    pdfLibFont: 'TimesRoman',
    description: 'Majestic classical Roman engraved style',
    recommendedFor: 'Degrees, Diplomas & Academic Awards',
  },
  {
    name: 'Great Vibes',
    family: '"Great Vibes", cursive',
    category: 'Script',
    language: 'Latin',
    pdfLibFont: 'TimesRoman',
    description: 'Flowing formal calligraphy with elegant loops',
    recommendedFor: 'Candidate Names & Formal Signatures',
  },
  {
    name: 'Dancing Script',
    family: '"Dancing Script", cursive',
    category: 'Script',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Lively, friendly cursive script',
    recommendedFor: 'Creative & Casual Certifications',
  },
  {
    name: 'Alex Brush',
    family: '"Alex Brush", cursive',
    category: 'Script',
    language: 'Latin',
    pdfLibFont: 'TimesRoman',
    description: 'Graceful flowing script with controlled legibility',
    recommendedFor: 'Premium Diplomas & Honors',
  },
  {
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Clean, modern geometric sans-serif',
    recommendedFor: 'Tech, Hackathons & Corporate Workshops',
  },
  {
    name: 'Inter',
    family: 'Inter, sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Ultra-legible contemporary digital typeface',
    recommendedFor: 'Data, Event Info & Subtitles',
  },
  {
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Balanced geometric typography with warmth',
    recommendedFor: 'Modern Competitions & Bootcamps',
  },
  {
    name: 'Merriweather',
    family: 'Merriweather, Georgia, serif',
    category: 'Serif',
    language: 'Latin',
    pdfLibFont: 'TimesRoman',
    description: 'Warm, highly readable editorial serif',
    recommendedFor: 'Body Text & Statements of Achievement',
  },
  {
    name: 'Times New Roman',
    family: '"Times New Roman", Times, serif',
    category: 'Serif',
    language: 'Latin',
    pdfLibFont: 'TimesRoman',
    description: 'Universally recognized traditional serif',
    recommendedFor: 'Official University & Legal Documents',
  },
  {
    name: 'Helvetica / Arial',
    family: 'Helvetica, Arial, sans-serif',
    category: 'Sans-Serif',
    language: 'Latin',
    pdfLibFont: 'Helvetica',
    description: 'Neutral, crisp, time-tested sans-serif',
    recommendedFor: 'Dates, ID codes & Technical Details',
  },
];

export const CERTIFICATE_COLOR_PALETTE = [
  { name: 'Deep Navy', hex: '#0F172A', border: '#1E293B' },
  { name: 'Imperial Blue', hex: '#1E3A8A', border: '#2563EB' },
  { name: 'Royal Gold', hex: '#D97706', border: '#B45309' },
  { name: 'Rich Maroon', hex: '#831843', border: '#9D174D' },
  { name: 'Forest Emerald', hex: '#064E3B', border: '#047857' },
  { name: 'Charcoal Slate', hex: '#334155', border: '#475569' },
  { name: 'Pure Black', hex: '#000000', border: '#18181B' },
  { name: 'Bronze Ochre', hex: '#92400E', border: '#78350F' },
];

/**
 * Intelligent Font Matcher
 * Analyzes raw font names extracted from PDF objects and maps to the best available font.
 */
export function matchFontFromPdfText(pdfFontName: string): {
  matchedFont: FontOption;
  confidence: number;
} {
  const normalized = (pdfFontName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (
    normalized.includes('devanagari') ||
    normalized.includes('marathi') ||
    normalized.includes('hindi') ||
    normalized.includes('mukta') ||
    normalized.includes('hind') ||
    normalized.includes('mangal') ||
    normalized.includes('aparajita') ||
    normalized.includes('kokila')
  ) {
    const font = AVAILABLE_FONTS.find((f) => f.name === 'Noto Sans Devanagari')!;
    return { matchedFont: font, confidence: 0.98 };
  }

  if (
    normalized.includes('cinzel') ||
    normalized.includes('trajan') ||
    normalized.includes('roman') ||
    normalized.includes('monument')
  ) {
    const font = AVAILABLE_FONTS.find((f) => f.name === 'Cinzel')!;
    return { matchedFont: font, confidence: 0.95 };
  }

  if (
    normalized.includes('script') ||
    normalized.includes('calligraph') ||
    normalized.includes('vibes') ||
    normalized.includes('brush') ||
    normalized.includes('edward') ||
    normalized.includes('zapfino') ||
    normalized.includes('corsiva') ||
    normalized.includes('snell') ||
    normalized.includes('bickham')
  ) {
    const font = AVAILABLE_FONTS.find((f) => f.name === 'Great Vibes')!;
    return { matchedFont: font, confidence: 0.92 };
  }

  if (
    normalized.includes('playfair') ||
    normalized.includes('didot') ||
    normalized.includes('bodoni') ||
    normalized.includes('garamond') ||
    normalized.includes('baskerville') ||
    normalized.includes('caslon')
  ) {
    const font = AVAILABLE_FONTS.find((f) => f.name === 'Playfair Display')!;
    return { matchedFont: font, confidence: 0.9 };
  }

  if (
    normalized.includes('montserrat') ||
    normalized.includes('gotham') ||
    normalized.includes('futura') ||
    normalized.includes('century') ||
    normalized.includes('proxima') ||
    normalized.includes('aventir')
  ) {
    const font = AVAILABLE_FONTS.find((f) => f.name === 'Montserrat')!;
    return { matchedFont: font, confidence: 0.88 };
  }

  if (
    normalized.includes('inter') ||
    normalized.includes('roboto') ||
    normalized.includes('helvetica') ||
    normalized.includes('arial') ||
    normalized.includes('sans')
  ) {
    const font = AVAILABLE_FONTS.find((f) => f.name === 'Inter')!;
    return { matchedFont: font, confidence: 0.85 };
  }

  if (
    normalized.includes('times') ||
    normalized.includes('merriweather') ||
    normalized.includes('georgia') ||
    normalized.includes('serif')
  ) {
    const font = AVAILABLE_FONTS.find((f) => f.name === 'Merriweather')!;
    return { matchedFont: font, confidence: 0.82 };
  }

  // Default fallback
  return {
    matchedFont: AVAILABLE_FONTS.find((f) => f.name === 'Playfair Display') || AVAILABLE_FONTS[0],
    confidence: 0.7,
  };
}

/**
 * Checks if a string contains Devanagari (Marathi/Hindi) characters
 */
export function hasDevanagariText(str: string): boolean {
  if (!str) return false;
  // Unicode range for Devanagari: \u0900-\u097F
  return /[\u0900-\u097F]/.test(str);
}
