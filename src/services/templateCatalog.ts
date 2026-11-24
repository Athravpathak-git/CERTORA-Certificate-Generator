import { CertificateField, CertificateTemplate } from '../types';
import { getDefaultFields } from '../constants/sampleData';

export interface MonthlyTemplateInfo {
  monthKey: string;
  monthName: string;
  themeTitle: string;
  accentColor: string;
  winnerTitle: string;
  participantTitle: string;
}

export const AVAILABLE_MONTHS: MonthlyTemplateInfo[] = [
  {
    monthKey: '01',
    monthName: 'January',
    themeTitle: 'Winter Innovation Summit',
    accentColor: '#0284C7',
    winnerTitle: 'Certificate of First Place Distinction',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '02',
    monthName: 'February',
    themeTitle: 'Tech Sprint & Hackathon',
    accentColor: '#9333EA',
    winnerTitle: 'Certificate of Championship Excellence',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '03',
    monthName: 'March',
    themeTitle: 'Spring Technology Sprint',
    accentColor: '#059669',
    winnerTitle: 'Certificate of Outstanding Achievement',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '04',
    monthName: 'April',
    themeTitle: 'Global Discovery Week',
    accentColor: '#2563EB',
    winnerTitle: 'Certificate of Merit & Innovation',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '05',
    monthName: 'May',
    themeTitle: 'Leadership & Service Forum',
    accentColor: '#D97706',
    winnerTitle: 'Certificate of Leadership Distinction',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '06',
    monthName: 'June',
    themeTitle: 'Summer Developer Fellowship',
    accentColor: '#0D9488',
    winnerTitle: 'Certificate of Technical Excellence',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '07',
    monthName: 'July',
    themeTitle: 'Creative Design & AI Sprint',
    accentColor: '#E11D48',
    winnerTitle: 'Certificate of Creative Distinction',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '08',
    monthName: 'August',
    themeTitle: 'Product Trials & Innovation',
    accentColor: '#C4A878',
    winnerTitle: 'Certificate of Grand Excellence',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '09',
    monthName: 'September',
    themeTitle: 'Autumn Campus Challenge',
    accentColor: '#EA580C',
    winnerTitle: 'Certificate of First Honors',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '10',
    monthName: 'October',
    themeTitle: 'Hacktoberfest & Open Source',
    accentColor: '#F59E0B',
    winnerTitle: 'Certificate of Open Source Excellence',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '11',
    monthName: 'November',
    themeTitle: 'Annual Summit & Grand Awards',
    accentColor: '#C4A878',
    winnerTitle: 'Certificate of Excellence & Distinction',
    participantTitle: 'Certificate of Active Participation',
  },
  {
    monthKey: '12',
    monthName: 'December',
    themeTitle: 'Year-End Gala of Distinction',
    accentColor: '#B91C1C',
    winnerTitle: 'Certificate of Supreme Honor',
    participantTitle: 'Certificate of Active Participation',
  },
];

/**
 * Automatically detects the current calendar month key (e.g. '11' for November)
 */
export function getCurrentMonthKey(): string {
  const currentMonthNum = new Date().getMonth() + 1;
  return currentMonthNum.toString().padStart(2, '0');
}

/**
 * Generates high-definition certificate canvas data URL for a specific month and type
 */
export function renderMonthlyCertificateCanvas(
  monthInfo: MonthlyTemplateInfo,
  type: 'Winner' | 'Participant'
): { dataUrl: string; width: number; height: number } {
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const isWinner = type === 'Winner';

  // 1. Warm Ivory Background
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, width, height);

  // Subtle Guilloche Parchment Lines
  ctx.strokeStyle = isWinner ? 'rgba(196, 168, 120, 0.08)' : 'rgba(37, 50, 70, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 50; i < width; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }

  // 2. Outer Midnight Blue Border
  ctx.strokeStyle = '#182536';
  ctx.lineWidth = 16;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  // 3. Inner Double Border
  const accentGold = '#C4A878';
  ctx.strokeStyle = accentGold;
  ctx.lineWidth = isWinner ? 3.5 : 2;
  ctx.strokeRect(76, 76, width - 152, height - 152);

  ctx.strokeStyle = isWinner ? 'rgba(196, 168, 120, 0.6)' : 'rgba(38, 59, 80, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(86, 86, width - 172, height - 172);

  // 4. Corner Ornaments
  const drawCorner = (x: number, y: number, flipX: boolean, flipY: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.fillStyle = accentGold;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(40, 0);
    ctx.lineTo(40, 10);
    ctx.lineTo(10, 10);
    ctx.lineTo(10, 40);
    ctx.lineTo(0, 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawCorner(86, 86, false, false);
  drawCorner(width - 86, 86, true, false);
  drawCorner(86, height - 86, false, true);
  drawCorner(width - 86, height - 86, true, true);

  // 5. Header Badge / Crest
  ctx.fillStyle = '#182536';
  ctx.beginPath();
  ctx.arc(width / 2, 165, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = accentGold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(width / 2, 165, 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = accentGold;
  ctx.font = 'bold 30px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isWinner ? '★' : '◆', width / 2, 165);

  // 6. Event Series Subtitle
  ctx.fillStyle = '#77818C';
  ctx.font = '600 16px "Montserrat", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(
    `${monthInfo.monthName.toUpperCase()} 2026 • ${monthInfo.themeTitle.toUpperCase()}`,
    width / 2,
    222
  );

  // 7. Main Title: WINNER vs PARTICIPANT
  ctx.fillStyle = '#182536';
  ctx.font = 'bold 50px "Cinzel", Georgia, serif';
  const mainTitle = isWinner ? monthInfo.winnerTitle : monthInfo.participantTitle;
  ctx.fillText(mainTitle.toUpperCase(), width / 2, 275);

  // 8. Presentation Line
  ctx.fillStyle = accentGold;
  ctx.font = '600 18px "Montserrat", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('THIS CERTIFICATE IS PROUDLY CONFERRED UPON', width / 2, 335);

  // 9. Candidate Name Guideline Underline
  ctx.strokeStyle = '#E8E5DD';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 380, 480);
  ctx.lineTo(width / 2 + 380, 480);
  ctx.stroke();

  // 10. Statement Text
  ctx.fillStyle = '#253246';
  ctx.font = '20px "Merriweather", Georgia, serif';
  if (isWinner) {
    ctx.fillText(
      `for achieving first honors, superior dedication, and extraordinary innovation in the`,
      width / 2,
      540
    );
    ctx.fillText(
      `prestigious ${monthInfo.monthName} ${monthInfo.themeTitle} challenge.`,
      width / 2,
      575
    );
  } else {
    ctx.fillText(
      `in recognition of active participation, valuable engagement, and successful completion of`,
      width / 2,
      540
    );
    ctx.fillText(
      `the official ${monthInfo.monthName} ${monthInfo.themeTitle} program.`,
      width / 2,
      575
    );
  }

  // 11. Left Footer (Date area)
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(240, 890);
  ctx.lineTo(540, 890);
  ctx.stroke();

  ctx.fillStyle = '#77818C';
  ctx.font = '600 14px "Montserrat", sans-serif';
  ctx.fillText('DATE OF CONFERRAL', 390, 915);

  // 12. Right Footer (Signature area)
  ctx.beginPath();
  ctx.moveTo(width - 540, 890);
  ctx.lineTo(width - 240, 890);
  ctx.stroke();
  ctx.fillText('AUTHORIZED SIGNATURE', width - 390, 915);

  // 13. Center Official Studio Seal
  ctx.strokeStyle = accentGold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(width / 2, 850, 45, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#182536';
  ctx.font = 'bold 11px "Montserrat", sans-serif';
  ctx.fillText('OFFICIAL SEAL', width / 2, 844);
  ctx.fillStyle = accentGold;
  ctx.font = 'bold 10px "Montserrat", sans-serif';
  ctx.fillText(isWinner ? '★ FIRST HONOR ★' : '• VERIFIED •', width / 2, 860);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

/**
 * Creates a pair of Winner and Participant CertificateTemplate objects for a given month
 */
export function createMonthlyTemplates(monthKey: string): {
  winnerTemplate: CertificateTemplate;
  participantTemplate: CertificateTemplate;
} {
  const monthInfo =
    AVAILABLE_MONTHS.find((m) => m.monthKey === monthKey) || AVAILABLE_MONTHS[10]; // default November

  const winnerCanvas = renderMonthlyCertificateCanvas(monthInfo, 'Winner');
  const partCanvas = renderMonthlyCertificateCanvas(monthInfo, 'Participant');

  const winnerTemplate: CertificateTemplate = {
    id: `tpl-${monthKey}-winner`,
    name: `${monthInfo.monthName}_Winner_Certificate.png`,
    category: 'Winner',
    fileType: 'image',
    originalWidth: winnerCanvas.width,
    originalHeight: winnerCanvas.height,
    aspectRatio: winnerCanvas.width / winnerCanvas.height,
    pageCount: 1,
    selectedPage: 1,
    previewImageUrl: winnerCanvas.dataUrl,
    detectedFonts: [],
    fieldConfig: getDefaultFields(),
  };

  const participantTemplate: CertificateTemplate = {
    id: `tpl-${monthKey}-participant`,
    name: `${monthInfo.monthName}_Participant_Certificate.png`,
    category: 'Participant',
    fileType: 'image',
    originalWidth: partCanvas.width,
    originalHeight: partCanvas.height,
    aspectRatio: partCanvas.width / partCanvas.height,
    pageCount: 1,
    selectedPage: 1,
    previewImageUrl: partCanvas.dataUrl,
    detectedFonts: [],
    fieldConfig: getDefaultFields(),
  };

  return {
    winnerTemplate,
    participantTemplate,
  };
}

/**
 * Universal Certificate Template Definitions
 */
export interface UniversalTemplateSpec {
  id: string;
  name: string;
  category: 'Participation' | 'Achievement' | 'Completion' | 'Internship' | 'Appreciation' | 'Workshop' | 'Custom';
  title: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  badgeSymbol: string;
  defaultFields: CertificateField[];
}

/**
 * Procedurally renders a high-definition 1920x1080 background for any universal certificate design
 */
export function renderUniversalCertificateCanvas(
  spec: Omit<UniversalTemplateSpec, 'id' | 'name' | 'category' | 'defaultFields'>
): { dataUrl: string; width: number; height: number } {
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Warm Ivory Base
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, width, height);

  // Subtle Parchment Guilloche Grid
  ctx.strokeStyle = 'rgba(196, 168, 120, 0.07)';
  ctx.lineWidth = 1;
  for (let i = 40; i < width; i += 45) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }

  // 2. Outer Border (Primary Theme Color)
  ctx.strokeStyle = spec.primaryColor;
  ctx.lineWidth = 16;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // 3. Inner Double Border (Champagne Gold)
  ctx.strokeStyle = spec.accentColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(74, 74, width - 148, height - 148);

  ctx.strokeStyle = 'rgba(196, 168, 120, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(84, 84, width - 168, height - 168);

  // 4. Four Elegant Corner Ornaments
  const drawCorner = (x: number, y: number, flipX: boolean, flipY: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.fillStyle = spec.accentColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(44, 0);
    ctx.lineTo(44, 11);
    ctx.lineTo(11, 11);
    ctx.lineTo(11, 44);
    ctx.lineTo(0, 44);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = spec.primaryColor;
    ctx.beginPath();
    ctx.arc(22, 22, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCorner(84, 84, false, false);
  drawCorner(width - 84, 84, true, false);
  drawCorner(84, height - 84, false, true);
  drawCorner(width - 84, height - 84, true, true);

  // 5. Header Badge / Crest
  ctx.fillStyle = spec.primaryColor;
  ctx.beginPath();
  ctx.arc(width / 2, 155, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = spec.accentColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(width / 2, 155, 36, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = spec.accentColor;
  ctx.font = 'bold 30px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.badgeSymbol || '★', width / 2, 155);

  // 6. Organization Header
  ctx.fillStyle = '#77818C';
  ctx.font = '600 15px "Montserrat", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('CERTORA • OFFICIAL CREDENTIAL', width / 2, 212);

  // 7. Main Certificate Title
  ctx.fillStyle = spec.primaryColor;
  ctx.font = 'bold 48px "Cinzel", Georgia, serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(spec.title.toUpperCase(), width / 2, 268);

  // 8. Presentation Line
  ctx.fillStyle = spec.accentColor;
  ctx.font = '600 17px "Montserrat", sans-serif';
  ctx.letterSpacing = '2.5px';
  ctx.fillText(spec.subtitle.toUpperCase(), width / 2, 325);

  // 9. Candidate Name Guideline Underline
  ctx.strokeStyle = '#E8E5DD';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 380, 485);
  ctx.lineTo(width / 2 + 380, 485);
  ctx.stroke();

  // 10. Official Center Seal (Bottom)
  ctx.strokeStyle = spec.accentColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(width / 2, 855, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = spec.primaryColor;
  ctx.font = 'bold 11px "Montserrat", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('OFFICIAL SEAL', width / 2, 848);
  ctx.fillStyle = spec.accentColor;
  ctx.font = 'bold 10px "Montserrat", sans-serif';
  ctx.fillText('• VERIFIED CREDENTIAL •', width / 2, 865);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

/**
 * Standard Universal Templates Catalog Specifications
 */
export const UNIVERSAL_TEMPLATE_SPECS: UniversalTemplateSpec[] = [
  {
    id: 'tpl-participation',
    name: 'Certificate of Participation',
    category: 'Participation',
    title: 'Certificate of Participation',
    subtitle: 'This certificate is proudly presented to',
    primaryColor: '#182536', // Midnight Blue
    accentColor: '#C4A878', // Champagne Gold
    badgeSymbol: '✦',
    defaultFields: [
      {
        id: 'field-candidate-name',
        type: 'candidate_name',
        label: 'Participant Name',
        placeholder: '{{participant_name}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'candidateName',
        xPercent: 15,
        yPercent: 39,
        widthPercent: 70,
        heightPercent: 9,
        fontFamily: 'Google Sans Bold',
        fontSize: 36,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#182536',
        letterSpacing: 1,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-event-name',
        type: 'custom_text',
        label: 'Event Name',
        placeholder: '{{event_name}}',
        enabled: true,
        isStatic: false,
        staticValue: 'For active participation in the National AI & Innovation Summit',
        fieldKey: 'eventName',
        xPercent: 18,
        yPercent: 52,
        widthPercent: 64,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 18,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-location',
        type: 'custom_text',
        label: 'Location / Venue',
        placeholder: '{{location}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Held at Pune Convention Center',
        fieldKey: 'location',
        xPercent: 22,
        yPercent: 59,
        widthPercent: 56,
        heightPercent: 4,
        fontFamily: 'Montserrat',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#77818C',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-date',
        type: 'date',
        label: 'Issuance Date',
        placeholder: '{{date}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'date',
        xPercent: 16,
        yPercent: 77,
        widthPercent: 20,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature',
        type: 'signature',
        label: 'Authorized Signature',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature',
        xPercent: 68,
        yPercent: 73,
        widthPercent: 18,
        heightPercent: 9,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature-chair',
        type: 'signature',
        label: 'Event Chairperson',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature_chair',
        xPercent: 42,
        yPercent: 73,
        widthPercent: 17,
        heightPercent: 8.5,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
    ],
  },
  {
    id: 'tpl-achievement',
    name: 'Certificate of Achievement',
    category: 'Achievement',
    title: 'Certificate of Achievement',
    subtitle: 'Conferred for superior distinction and performance to',
    primaryColor: '#7F1D1D', // Royal Crimson / Ruby
    accentColor: '#C4A878', // Champagne Gold
    badgeSymbol: '★',
    defaultFields: [
      {
        id: 'field-candidate-name',
        type: 'candidate_name',
        label: 'Candidate Name',
        placeholder: '{{participant_name}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'candidateName',
        xPercent: 15,
        yPercent: 39,
        widthPercent: 70,
        heightPercent: 9,
        fontFamily: 'Google Sans Bold',
        fontSize: 36,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#182536',
        letterSpacing: 1,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-achievement',
        type: 'custom_text',
        label: 'Achievement Title',
        placeholder: '{{achievement}}',
        enabled: true,
        isStatic: false,
        staticValue: 'FIRST PLACE EXCELLENCE DISTINCTION',
        fieldKey: 'achievement',
        xPercent: 18,
        yPercent: 51,
        widthPercent: 64,
        heightPercent: 5,
        fontFamily: 'Cinzel',
        fontSize: 19,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#C4A878',
        letterSpacing: 1.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-competition',
        type: 'custom_text',
        label: 'Competition / Event',
        placeholder: '{{event_name}}',
        enabled: true,
        isStatic: false,
        staticValue: 'National Grand Hackathon & Innovation Sprint',
        fieldKey: 'eventName',
        xPercent: 20,
        yPercent: 58,
        widthPercent: 60,
        heightPercent: 4.5,
        fontFamily: 'Montserrat',
        fontSize: 15,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-rank',
        type: 'custom_text',
        label: 'Rank / Standing',
        placeholder: '{{rank}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Rank: 1st Position (Score: 99.2%)',
        fieldKey: 'rank',
        xPercent: 30,
        yPercent: 64,
        widthPercent: 40,
        heightPercent: 4,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#7F1D1D',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-date',
        type: 'date',
        label: 'Award Date',
        placeholder: '{{date}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'date',
        xPercent: 16,
        yPercent: 77,
        widthPercent: 20,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature',
        type: 'signature',
        label: 'Director Signature',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature',
        xPercent: 68,
        yPercent: 73,
        widthPercent: 18,
        heightPercent: 9,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature-jury',
        type: 'signature',
        label: 'Jury Chairperson',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature_jury',
        xPercent: 42,
        yPercent: 73,
        widthPercent: 17,
        heightPercent: 8.5,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
    ],
  },
  {
    id: 'tpl-completion',
    name: 'Certificate of Completion',
    category: 'Completion',
    title: 'Certificate of Completion',
    subtitle: 'This is to certify the successful program completion by',
    primaryColor: '#064E3B', // Deep Emerald
    accentColor: '#C4A878', // Champagne Gold
    badgeSymbol: '🎓',
    defaultFields: [
      {
        id: 'field-candidate-name',
        type: 'candidate_name',
        label: 'Student Name',
        placeholder: '{{participant_name}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'candidateName',
        xPercent: 15,
        yPercent: 39,
        widthPercent: 70,
        heightPercent: 9,
        fontFamily: 'Google Sans Bold',
        fontSize: 36,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#182536',
        letterSpacing: 1,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-course-name',
        type: 'custom_text',
        label: 'Course / Program Name',
        placeholder: '{{course_name}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Advanced Full-Stack Engineering & AI Systems',
        fieldKey: 'courseName',
        xPercent: 16,
        yPercent: 52,
        widthPercent: 68,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 18,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#064E3B',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-grade',
        type: 'custom_text',
        label: 'Grade / Score',
        placeholder: '{{grade}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Grade: A+ Distinction (96%)',
        fieldKey: 'grade',
        xPercent: 30,
        yPercent: 59,
        widthPercent: 40,
        heightPercent: 4,
        fontFamily: 'Montserrat',
        fontSize: 14,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-cert-id',
        type: 'cert_id',
        label: 'Credential ID',
        placeholder: '{{certificate_id}}',
        enabled: true,
        isStatic: false,
        staticValue: 'ATH-2026-COMP-001',
        fieldKey: 'certId',
        xPercent: 16,
        yPercent: 71,
        widthPercent: 22,
        heightPercent: 4,
        fontFamily: 'Montserrat',
        fontSize: 11,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#77818C',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-date',
        type: 'date',
        label: 'Completion Date',
        placeholder: '{{date}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'date',
        xPercent: 16,
        yPercent: 77,
        widthPercent: 20,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature',
        type: 'signature',
        label: 'Lead Instructor',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature',
        xPercent: 68,
        yPercent: 73,
        widthPercent: 18,
        heightPercent: 9,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature-dean',
        type: 'signature',
        label: 'Dean of Academics',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature_dean',
        xPercent: 42,
        yPercent: 73,
        widthPercent: 17,
        heightPercent: 8.5,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
    ],
  },
  {
    id: 'tpl-internship',
    name: 'Internship Certificate',
    category: 'Internship',
    title: 'Certificate of Internship',
    subtitle: 'This is awarded in recognition of practical excellence to',
    primaryColor: '#1E3A8A', // Dark Sapphire
    accentColor: '#C4A878', // Champagne Gold
    badgeSymbol: '◈',
    defaultFields: [
      {
        id: 'field-candidate-name',
        type: 'candidate_name',
        label: 'Intern Name',
        placeholder: '{{participant_name}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'candidateName',
        xPercent: 15,
        yPercent: 39,
        widthPercent: 70,
        heightPercent: 9,
        fontFamily: 'Google Sans Bold',
        fontSize: 36,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#182536',
        letterSpacing: 1,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-role',
        type: 'custom_text',
        label: 'Internship Role',
        placeholder: '{{role}}',
        enabled: true,
        isStatic: false,
        staticValue: 'AI Software Engineering Intern',
        fieldKey: 'role',
        xPercent: 18,
        yPercent: 51,
        widthPercent: 64,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 18,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#1E3A8A',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-department',
        type: 'custom_text',
        label: 'Department / Organization',
        placeholder: '{{department}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Core Machine Learning & Cloud Platform Labs',
        fieldKey: 'department',
        xPercent: 20,
        yPercent: 57,
        widthPercent: 60,
        heightPercent: 4.5,
        fontFamily: 'Montserrat',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-duration',
        type: 'custom_text',
        label: 'Internship Duration',
        placeholder: '{{duration}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Tenure: 6 Months (January 2026 – June 2026)',
        fieldKey: 'duration',
        xPercent: 24,
        yPercent: 63,
        widthPercent: 52,
        heightPercent: 4,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#77818C',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-date',
        type: 'date',
        label: 'Issue Date',
        placeholder: '{{date}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'date',
        xPercent: 16,
        yPercent: 77,
        widthPercent: 20,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature',
        type: 'signature',
        label: 'Managing Director',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature',
        xPercent: 68,
        yPercent: 73,
        widthPercent: 18,
        heightPercent: 9,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature-hr',
        type: 'signature',
        label: 'Head of People & HR',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature_hr',
        xPercent: 42,
        yPercent: 73,
        widthPercent: 17,
        heightPercent: 8.5,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
    ],
  },
  {
    id: 'tpl-appreciation',
    name: 'Certificate of Appreciation',
    category: 'Appreciation',
    title: 'Certificate of Appreciation',
    subtitle: 'Presented in grateful recognition and sincere gratitude to',
    primaryColor: '#1E293B', // Slate Navy
    accentColor: '#D97706', // Warm Amber Gold
    badgeSymbol: '★',
    defaultFields: [
      {
        id: 'field-candidate-name',
        type: 'candidate_name',
        label: 'Honoree Name',
        placeholder: '{{participant_name}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'candidateName',
        xPercent: 15,
        yPercent: 39,
        widthPercent: 70,
        heightPercent: 9,
        fontFamily: 'Google Sans Bold',
        fontSize: 36,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#182536',
        letterSpacing: 1,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-contribution',
        type: 'custom_text',
        label: 'Contribution / Recognition',
        placeholder: '{{contribution}}',
        enabled: true,
        isStatic: false,
        staticValue: 'For outstanding volunteer leadership, community service, and dedication',
        fieldKey: 'contribution',
        xPercent: 15,
        yPercent: 52,
        widthPercent: 70,
        heightPercent: 5,
        fontFamily: 'Cinzel',
        fontSize: 17,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#D97706',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-organization',
        type: 'custom_text',
        label: 'Organization / Initiative',
        placeholder: '{{organization}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Global Technology & Social Empowerment Initiative',
        fieldKey: 'organization',
        xPercent: 20,
        yPercent: 59,
        widthPercent: 60,
        heightPercent: 4.5,
        fontFamily: 'Montserrat',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-date',
        type: 'date',
        label: 'Date',
        placeholder: '{{date}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'date',
        xPercent: 16,
        yPercent: 77,
        widthPercent: 20,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature',
        type: 'signature',
        label: 'President / Chairperson',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature',
        xPercent: 68,
        yPercent: 73,
        widthPercent: 18,
        heightPercent: 9,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature-sec',
        type: 'signature',
        label: 'Executive Secretary',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature_sec',
        xPercent: 42,
        yPercent: 73,
        widthPercent: 17,
        heightPercent: 8.5,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
    ],
  },
  {
    id: 'tpl-workshop',
    name: 'Workshop Certificate',
    category: 'Workshop',
    title: 'Certificate of Workshop Completion',
    subtitle: 'Conferred upon active participation and technical proficiency to',
    primaryColor: '#312E81', // Deep Indigo
    accentColor: '#C4A878', // Champagne Gold
    badgeSymbol: '✦',
    defaultFields: [
      {
        id: 'field-candidate-name',
        type: 'candidate_name',
        label: 'Attendee Name',
        placeholder: '{{participant_name}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'candidateName',
        xPercent: 15,
        yPercent: 39,
        widthPercent: 70,
        heightPercent: 9,
        fontFamily: 'Google Sans Bold',
        fontSize: 36,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#182536',
        letterSpacing: 1,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-workshop-topic',
        type: 'custom_text',
        label: 'Workshop Title / Topic',
        placeholder: '{{workshop_topic}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Next-Gen Web Architecture & AI Microservices Masterclass',
        fieldKey: 'workshopTopic',
        xPercent: 16,
        yPercent: 52,
        widthPercent: 68,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 18,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#312E81',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-institution',
        type: 'custom_text',
        label: 'Host Institution',
        placeholder: '{{institution}}',
        enabled: true,
        isStatic: false,
        staticValue: 'Conducted by the Center for Advanced Computer Research',
        fieldKey: 'institution',
        xPercent: 20,
        yPercent: 59,
        widthPercent: 60,
        heightPercent: 4.5,
        fontFamily: 'Montserrat',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0.5,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-date',
        type: 'date',
        label: 'Date',
        placeholder: '{{date}}',
        enabled: true,
        isStatic: false,
        staticValue: '',
        fieldKey: 'date',
        xPercent: 16,
        yPercent: 77,
        widthPercent: 20,
        heightPercent: 5,
        fontFamily: 'Montserrat',
        fontSize: 13,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#253246',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature',
        type: 'signature',
        label: 'Lead Instructor',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature',
        xPercent: 68,
        yPercent: 73,
        widthPercent: 18,
        heightPercent: 9,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
      {
        id: 'field-signature-coord',
        type: 'signature',
        label: 'Workshop Coordinator',
        enabled: true,
        isStatic: true,
        staticValue: '',
        fieldKey: 'signature_coord',
        xPercent: 42,
        yPercent: 73,
        widthPercent: 17,
        heightPercent: 8.5,
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        letterSpacing: 0,
        align: 'center',
        autoFit: true,
        transform: 'none',
      },
    ],
  },
];

/**
 * Creates and returns the full Universal Certificate Templates collection
 */
export function createUniversalTemplates(): CertificateTemplate[] {
  return UNIVERSAL_TEMPLATE_SPECS.map((spec) => {
    const rendered = renderUniversalCertificateCanvas({
      title: spec.title,
      subtitle: spec.subtitle,
      primaryColor: spec.primaryColor,
      accentColor: spec.accentColor,
      badgeSymbol: spec.badgeSymbol,
    });

    return {
      id: spec.id,
      name: spec.name,
      category: spec.category,
      fileType: 'image' as const,
      originalWidth: rendered.width,
      originalHeight: rendered.height,
      aspectRatio: rendered.width / rendered.height,
      pageCount: 1,
      selectedPage: 1,
      previewImageUrl: rendered.dataUrl,
      detectedFonts: [],
      fieldConfig: JSON.parse(JSON.stringify(spec.defaultFields)).map((f: any) => ({
        ...f,
        defaultFontSize: f.defaultFontSize || f.fontSize,
      })),
    };
  });
}

