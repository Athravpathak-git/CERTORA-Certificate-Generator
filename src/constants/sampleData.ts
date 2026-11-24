import { CertificateField, Participant } from '../types';

/**
 * Creates an ultra high-res Canvas certificate template data URL
 */
export function generateSampleCertificateImage(theme: 'gold_navy' | 'modern_violet' | 'academic_ivory'): {
  dataUrl: string;
  width: number;
  height: number;
} {
  const width = 1920;
  const height = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (theme === 'gold_navy') {
    // Elegant Ivory Background
    ctx.fillStyle = '#FCFBF7';
    ctx.fillRect(0, 0, width, height);

    // Subtle guilloche / parchment texture lines
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 40; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Outer Navy Border
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 16;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // Inner Gold Double Border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(75, 75, width - 150, height - 150);
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1;
    ctx.strokeRect(85, 85, width - 170, height - 170);

    // Corner Ornaments
    const drawCorner = (x: number, y: number, flipX: boolean, flipY: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(45, 0);
      ctx.lineTo(45, 12);
      ctx.lineTo(12, 12);
      ctx.lineTo(12, 45);
      ctx.lineTo(0, 45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawCorner(85, 85, false, false);
    drawCorner(width - 85, 85, true, false);
    drawCorner(85, height - 85, false, true);
    drawCorner(width - 85, height - 85, true, true);

    // Header Emblem / Crest
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(width / 2, 175, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', width / 2, 175);

    // Title: CERTIFICATE OF EXCELLENCE
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 54px Cinzel, serif';
    ctx.fillText('CERTIFICATE OF EXCELLENCE', width / 2, 260);

    // Subtitle
    ctx.fillStyle = '#D97706';
    ctx.font = '600 20px Montserrat, sans-serif';
    ctx.fillText('THIS IS PROUDLY PRESENTED TO', width / 2, 315);

    // Divider line below name area
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 350, 490);
    ctx.lineTo(width / 2 + 350, 490);
    ctx.stroke();

    // Statement text
    ctx.fillStyle = '#475569';
    ctx.font = '22px Merriweather, Georgia, serif';
    ctx.fillText(
      'for extraordinary dedication, exceptional performance and verified contributions',
      width / 2,
      550
    );
    ctx.fillText(
      'in successfully completing the certified advanced curriculum with distinction.',
      width / 2,
      590
    );

    // Left and Right Footers (Date line and Signature line)
    // Date area
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, 890);
    ctx.lineTo(550, 890);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Montserrat, sans-serif';
    ctx.fillText('DATE OF ISSUANCE', 400, 920);

    // Signature area
    ctx.beginPath();
    ctx.moveTo(width - 550, 890);
    ctx.lineTo(width - 250, 890);
    ctx.stroke();
    ctx.fillText('AUTHORIZED SIGNATURE', width - 400, 920);

    // Official Seal in Center Bottom
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, 850, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 13px Montserrat, sans-serif';
    ctx.fillText('OFFICIAL SEAL', width / 2, 846);
    ctx.fillText('• 2026 •', width / 2, 864);
  } else if (theme === 'modern_violet') {
    // Modern Dark Slate / Deep Violet Tech Theme
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, width, height);

    // Gradient banner
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#4F46E5');
    grad.addColorStop(1, '#9333EA');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 8;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Cyber border accents
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(50, 50, 100, 6);
    ctx.fillRect(50, 50, 6, 100);
    ctx.fillRect(width - 150, 50, 100, 6);
    ctx.fillRect(width - 56, 50, 6, 100);
    ctx.fillRect(50, height - 56, 100, 6);
    ctx.fillRect(50, height - 150, 6, 100);
    ctx.fillRect(width - 150, height - 56, 100, 6);
    ctx.fillRect(width - 56, height - 150, 6, 100);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GLOBAL AI & TECH SUMMIT 2026', width / 2, 230);

    ctx.fillStyle = '#818CF8';
    ctx.font = '600 24px Montserrat, sans-serif';
    ctx.fillText('CERTIFICATE OF RECOGNITION', width / 2, 290);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('PROUDLY CONFERRED UPON', width / 2, 360);

    // Underline
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 380, 500);
    ctx.lineTo(width / 2 + 380, 500);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '22px Inter, sans-serif';
    ctx.fillText('for remarkable breakthrough solutions and active participation in', width / 2, 570);
    ctx.fillText('the International Autonomous Agent Hackathon.', width / 2, 610);

    // Left and Right Footers
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(250, 890);
    ctx.lineTo(550, 890);
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('VERIFIED DATE', 400, 920);

    ctx.beginPath();
    ctx.moveTo(width - 550, 890);
    ctx.lineTo(width - 250, 890);
    ctx.stroke();
    ctx.fillText('CHIEF PROGRAM DIRECTOR', width - 400, 920);
  } else {
    // Academic Ivory
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 14;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.strokeRect(82, 82, width - 164, height - 164);

    ctx.fillStyle = '#831843';
    ctx.font = 'bold 58px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('ACADEMIC MERIT & DISTINCTION', width / 2, 250);

    ctx.fillStyle = '#B45309';
    ctx.font = '600 20px "Playfair Display", serif';
    ctx.fillText('HONORARY ACADEMY FELLOWSHIP', width / 2, 310);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 350, 500);
    ctx.lineTo(width / 2 + 350, 500);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '22px "Playfair Display", serif';
    ctx.fillText('In recognition of exemplary academic rigor, intellectual leadership', width / 2, 570);
    ctx.fillText('and exceptional scholarly dedication to scientific achievement.', width / 2, 610);

    // Footers
    ctx.strokeStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(250, 890);
    ctx.lineTo(550, 890);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Montserrat, sans-serif';
    ctx.fillText('DATE', 400, 920);

    ctx.beginPath();
    ctx.moveTo(width - 550, 890);
    ctx.lineTo(width - 250, 890);
    ctx.stroke();
    ctx.fillText('DEAN OF ACADEMICS', width - 400, 920);
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

/**
 * Generates test signatures simulating real-world photographed or scanned paper signatures:
 * - black on white paper
 * - blue on white paper
 * - dark on cream paper
 * - signature photographed against slightly grey background
 * - thin delicate handwritten strokes
 */
export function generateSamplePaperSignature(testCase: 'black_on_white' | 'blue_on_white' | 'dark_on_cream' | 'photo_grey' | 'thin_strokes'): {
  dataUrl: string;
  width: number;
  height: number;
  label: string;
} {
  const width = 600;
  const height = 240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  let paperBg = '#FFFFFF';
  let inkColor = '#0F172A';
  let lineWidth = 4;
  let label = 'Black on White Paper';

  if (testCase === 'black_on_white') {
    paperBg = '#FFFFFF';
    inkColor = '#000000';
    lineWidth = 4;
    label = 'Black ink on White Paper';
    ctx.fillStyle = paperBg;
    ctx.fillRect(0, 0, width, height);
  } else if (testCase === 'blue_on_white') {
    paperBg = '#FAFAFA';
    inkColor = '#1D4ED8'; // Royal Blue Ballpoint
    lineWidth = 3.5;
    label = 'Blue Pen on White Paper';
    ctx.fillStyle = paperBg;
    ctx.fillRect(0, 0, width, height);
  } else if (testCase === 'dark_on_cream') {
    paperBg = '#FBF5E6'; // Warm Cream / Ivory Parchment
    inkColor = '#1C1917'; // Dark charcoal ink
    lineWidth = 3.5;
    label = 'Dark ink on Cream Paper';
    ctx.fillStyle = paperBg;
    ctx.fillRect(0, 0, width, height);
    // Subtle paper grain
    ctx.fillStyle = 'rgba(217, 119, 6, 0.03)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
  } else if (testCase === 'photo_grey') {
    // Photographed by phone: slight vignette / grey paper
    const grad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width);
    grad.addColorStop(0, '#EAECEF');
    grad.addColorStop(1, '#D8DCE2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    inkColor = '#111827';
    lineWidth = 3.8;
    label = 'Phone Photo on Grey Paper';
  } else if (testCase === 'thin_strokes') {
    paperBg = '#FFFFFF';
    inkColor = '#1E3A8A';
    lineWidth = 1.8; // Very thin delicate strokes
    label = 'Thin Delicate Handwritten Strokes';
    ctx.fillStyle = paperBg;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw signature strokes
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(60, 160);
  ctx.bezierCurveTo(90, 80, 130, 40, 170, 70);
  ctx.bezierCurveTo(210, 100, 160, 200, 140, 190);
  ctx.bezierCurveTo(120, 180, 140, 130, 190, 130);

  ctx.bezierCurveTo(220, 130, 240, 160, 270, 130);
  ctx.bezierCurveTo(300, 100, 310, 150, 340, 125);
  ctx.bezierCurveTo(370, 100, 380, 140, 420, 120);

  ctx.moveTo(130, 180);
  ctx.bezierCurveTo(240, 210, 420, 215, 540, 150);
  ctx.bezierCurveTo(490, 180, 350, 210, 220, 195);
  ctx.stroke();

  // Ink dot
  ctx.fillStyle = inkColor;
  ctx.beginPath();
  ctx.arc(520, 120, lineWidth * 0.9, 0, Math.PI * 2);
  ctx.fill();

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
    label,
  };
}

/**
 * Creates an authentic transparent signature PNG Data URL
 */
export function generateSampleSignatureImage(type: 'executive' | 'artistic' = 'executive'): {
  dataUrl: string;
  width: number;
  height: number;
} {
  const width = 600;
  const height = 240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Smooth ink curve
  ctx.strokeStyle = '#1E3A8A'; // Deep Navy Ink
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Capital J / A flourish
  ctx.moveTo(60, 160);
  ctx.bezierCurveTo(90, 80, 130, 40, 170, 70);
  ctx.bezierCurveTo(210, 100, 160, 200, 140, 190);
  ctx.bezierCurveTo(120, 180, 140, 130, 190, 130);

  // Smooth cursive connection
  ctx.bezierCurveTo(220, 130, 240, 160, 270, 130);
  ctx.bezierCurveTo(300, 100, 310, 150, 340, 125);
  ctx.bezierCurveTo(370, 100, 380, 140, 420, 120);

  // Big underline flourish
  ctx.moveTo(130, 180);
  ctx.bezierCurveTo(240, 210, 420, 215, 540, 150);
  ctx.bezierCurveTo(490, 180, 350, 210, 220, 195);

  ctx.stroke();

  // Small dot/accent
  ctx.fillStyle = '#1E3A8A';
  ctx.beginPath();
  ctx.arc(520, 120, 3.5, 0, Math.PI * 2);
  ctx.fill();

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

/**
 * Standard initial default fields calibrated precisely for 1920x1080 certificates
 */
export function getDefaultFields(): CertificateField[] {
  return [
    {
      id: 'field-candidate-name',
      type: 'candidate_name',
      label: 'Candidate Name',
      enabled: true,
      isStatic: false,
      staticValue: '',
      fieldKey: 'candidateName',
      xPercent: 15,
      yPercent: 37,
      widthPercent: 70,
      heightPercent: 9,
      fontFamily: 'Google Sans Bold',
      fontSize: 48,
      defaultFontSize: 48,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#0F172A',
      letterSpacing: 1,
      align: 'center',
      autoFit: true,
      transform: 'none',
    },
    {
      id: 'field-date',
      type: 'date',
      label: 'Issuance Date',
      enabled: true,
      isStatic: true,
      staticValue: '',
      fieldKey: 'date',
      xPercent: 14,
      yPercent: 77,
      widthPercent: 18,
      heightPercent: 5,
      fontFamily: 'Montserrat',
      fontSize: 16,
      fontWeight: '600',
      fontStyle: 'normal',
      color: '#334155',
      letterSpacing: 1,
      align: 'center',
      autoFit: true,
      transform: 'none',
    },
    {
      id: 'field-signature',
      type: 'signature',
      label: 'Signature',
      enabled: true,
      isStatic: true,
      staticValue: '',
      fieldKey: 'signature',
      xPercent: 68,
      yPercent: 74,
      widthPercent: 18,
      heightPercent: 8,
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
      id: 'field-performance',
      type: 'performance',
      label: 'Performance / Grade',
      enabled: false,
      isStatic: false,
      staticValue: 'Distinction',
      fieldKey: 'performance',
      xPercent: 35,
      yPercent: 62,
      widthPercent: 30,
      heightPercent: 4,
      fontFamily: 'Montserrat',
      fontSize: 18,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#D97706',
      letterSpacing: 2,
      align: 'center',
      autoFit: true,
      transform: 'uppercase',
    },
    {
      id: 'field-rank',
      type: 'rank',
      label: 'Rank',
      enabled: false,
      isStatic: false,
      staticValue: '1st Place',
      fieldKey: 'rank',
      xPercent: 15,
      yPercent: 62,
      widthPercent: 20,
      heightPercent: 4,
      fontFamily: 'Montserrat',
      fontSize: 16,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: '#D97706',
      letterSpacing: 1,
      align: 'center',
      autoFit: true,
      transform: 'none',
    },
    {
      id: 'field-score',
      type: 'score',
      label: 'Score',
      enabled: false,
      isStatic: false,
      staticValue: '95/100',
      fieldKey: 'score',
      xPercent: 65,
      yPercent: 62,
      widthPercent: 20,
      heightPercent: 4,
      fontFamily: 'Montserrat',
      fontSize: 16,
      fontWeight: '600',
      fontStyle: 'normal',
      color: '#0F172A',
      letterSpacing: 1,
      align: 'center',
      autoFit: true,
      transform: 'none',
    },
    {
      id: 'field-cert-id',
      type: 'cert_id',
      label: 'Certificate ID',
      enabled: false,
      isStatic: false,
      staticValue: 'CERT-2026-0001',
      fieldKey: 'certId',
      xPercent: 40,
      yPercent: 89,
      widthPercent: 20,
      heightPercent: 3.5,
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      fontStyle: 'normal',
      color: '#64748B',
      letterSpacing: 1,
      align: 'center',
      autoFit: true,
      transform: 'none',
    },
    {
      id: 'field-qr-code',
      type: 'qr_code',
      label: 'Verification QR',
      enabled: false,
      isStatic: true,
      staticValue: '',
      fieldKey: 'qrCode',
      xPercent: 46,
      yPercent: 71,
      widthPercent: 8,
      heightPercent: 14,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      letterSpacing: 0,
      align: 'center',
      autoFit: true,
      transform: 'none',
      qrSettings: {
        includeId: true,
        errorCorrectionLevel: 'M',
      },
    },
  ];
}

/**
 * Sample participants list for instant demo and QA testing
 */
export const SAMPLE_PARTICIPANTS: Participant[] = [
  {
    id: 'p-1',
    name: 'Athrav Pathak',
    certId: 'CERT-2026-0001',
    fields: {
      performance: 'Outstanding',
      rank: 'Rank 1',
      score: '98 / 100',
      achievement: 'Grand Winner',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Athrav_Pathak_CERT-2026-0001.pdf',
  },
  {
    id: 'p-2',
    name: 'अथर्व पाठक', // Marathi Unicode Participant
    certId: 'CERT-2026-0002',
    fields: {
      performance: 'उत्कृष्ट',
      rank: 'प्रथम क्रमांक',
      score: '98 / 100',
      achievement: 'विशेष प्राविण्य',
      eventName: 'शैक्षणिक आणि करिअर मार्गदर्शन',
    },
    generatedFilename: 'Atharva_Pathak_Marathi_CERT-2026-0002.pdf',
  },
  {
    id: 'p-3',
    name: 'Rahul Patil',
    certId: 'CERT-2026-0003',
    fields: {
      performance: 'Excellent',
      rank: 'Rank 2',
      score: '95 / 100',
      achievement: 'First Runner Up',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Rahul_Patil_CERT-2026-0003.pdf',
  },
  {
    id: 'p-4',
    name: 'Priya Sharma',
    certId: 'CERT-2026-0004',
    fields: {
      performance: 'Distinction',
      rank: 'Rank 3',
      score: '93 / 100',
      achievement: 'Second Runner Up',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Priya_Sharma_CERT-2026-0004.pdf',
  },
  {
    id: 'p-5',
    name: 'Amit Deshmukh',
    certId: 'CERT-2026-0005',
    fields: {
      performance: 'Merit',
      rank: 'Rank 4',
      score: '90 / 100',
      achievement: 'Honor Roll',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Amit_Deshmukh_CERT-2026-0005.pdf',
  },
  {
    id: 'p-6',
    name: 'Sneha Joshi',
    certId: 'CERT-2026-0006',
    fields: {
      performance: 'Merit',
      rank: 'Rank 5',
      score: '89 / 100',
      achievement: 'Honor Roll',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Sneha_Joshi_CERT-2026-0006.pdf',
  },
  {
    id: 'p-7',
    name: 'Vikramaditya Rathore',
    certId: 'CERT-2026-0007',
    fields: {
      performance: 'Very Good',
      rank: 'Rank 6',
      score: '88 / 100',
      achievement: 'Special Recognition',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Vikramaditya_Rathore_CERT-2026-0007.pdf',
  },
  {
    id: 'p-8',
    name: 'Ananya Iyer',
    certId: 'CERT-2026-0008',
    fields: {
      performance: 'Very Good',
      rank: 'Rank 7',
      score: '87 / 100',
      achievement: 'Special Recognition',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Ananya_Iyer_CERT-2026-0008.pdf',
  },
  {
    id: 'p-9',
    name: 'Tanvi Mehta',
    certId: 'CERT-2026-0009',
    fields: {
      performance: 'Good',
      rank: 'Rank 8',
      score: '84 / 100',
      achievement: 'Participant',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Tanvi_Mehta_CERT-2026-0009.pdf',
  },
  {
    id: 'p-10',
    name: 'Rahul Patil', // Duplicate for duplicate test
    certId: 'CERT-2026-0010',
    fields: {
      performance: 'Distinction',
      rank: 'Rank 9',
      score: '96 / 100',
      achievement: 'Certificate of Distinction',
      eventName: 'AI Excellence Challenge',
    },
    generatedFilename: 'Rahul_Patil_2_CERT-2026-0010.pdf',
  },
];
