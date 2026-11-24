export type FieldType =
  | 'candidate_name'
  | 'date'
  | 'signature'
  | 'performance'
  | 'rank'
  | 'score'
  | 'achievement'
  | 'event_name'
  | 'cert_id'
  | 'serial_number'
  | 'qr_code'
  | 'custom_text'
  | 'custom_image';

export type TextAlignment = 'left' | 'center' | 'right';
export type FontWeight = 'normal' | '500' | '600' | 'bold' | '800';
export type FontStyle = 'normal' | 'italic';

export type ActiveView =
  | 'home'
  | 'create'
  | 'certificates'
  | 'templates'
  | 'settings'
  | 'dashboard'
  | 'editor'
  | 'participants'
  | 'generation'
  | 'signature'
  | 'projects'
  | 'verification'
  | 'about';

export interface QrCodeSettings {
  enabled?: boolean;
  includeId: boolean;
  payloadType?: 'cert_id' | 'summary' | 'custom_url' | 'custom_text';
  verificationUrlPrefix?: string;
  customUrl?: string;
  customPayload?: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  darkColor?: string;
  lightColor?: string;
}

export interface SerialNumberSettings {
  enabled: boolean;
  prefix: string;
  startNumber: number;
  paddingLength: number;
}

export interface CertificateField {
  id: string;
  type: FieldType;
  label: string;
  enabled: boolean;
  isStatic: boolean;
  staticValue: string;
  fieldKey: string;
  // Normalized 0..100 percentages relative to template dimensions for resolution independence
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  // Typography
  fontFamily: string;
  fontSize: number; // in PDF pt scale (~12-72)
  defaultFontSize?: number; // Original default font size from template for reset
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  color: string;
  letterSpacing: number; // in px/pt
  lineSpacing?: number;
  align: TextAlignment;
  autoFit: boolean;
  transform: 'none' | 'uppercase' | 'capitalize';
  isLocked?: boolean;
  underline?: boolean;
  // QR Code Specific
  qrSettings?: QrCodeSettings;
  // Custom font data URL or family
  customFontUrl?: string;
  // Multiple Signatures & Custom Images
  signatureData?: SignatureData;
  rotation?: number;
  // Dynamic Placeholder & Universal Templates
  placeholder?: string; // e.g. {{participant_name}}, {{event_name}}, {{course_name}}
  pdfFontFamily?: string;
}

export interface DetectedFontInfo {
  fontName: string;
  family: string;
  estimatedSize: number;
  suggestedMatch: string;
  sampleText: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  category: string; // e.g. 'Participation', 'Achievement', 'Winner', 'Completion', 'Internship', etc.
  fileType: 'pdf' | 'image';
  originalWidth: number; // in points (1 pt = 1/72 inch)
  originalHeight: number;
  aspectRatio: number;
  pageCount: number;
  selectedPage: number;
  pdfBytes?: Uint8Array;
  previewImageUrl: string;
  detectedFonts: DetectedFontInfo[];
  // Independent field layout configuration stored per template
  fieldConfig?: CertificateField[];
}

export interface SignatureProcessingSettings {
  threshold: number;
  smoothness: number;
  contrastBoost: number;
  removeHalo: boolean;
}

export interface SignatureData {
  id: string;
  name: string;
  dataUrl: string; // active transparent PNG
  originalDataUrl?: string; // pristine unmodified original
  format: 'png' | 'jpeg';
  width: number;
  height: number;
  aspectRatio: number;
  isBackgroundRemoved?: boolean;
  detectedPaperColor?: { r: number; g: number; b: number; name: string };
  settings?: SignatureProcessingSettings;
}

export interface Participant {
  id: string;
  name: string;
  certId?: string; // e.g. 'ATH-2026-0001'
  serialNumber?: string; // e.g. '001'
  qrCodeDataUrl?: string;
  assignedTemplateId?: string;
  fields: Record<string, string>;
  status?: 'pending' | 'generating' | 'ready' | 'error';
  pdfBlob?: Blob;
  pdfUrl?: string;
  error?: string;
  generatedFilename: string;
  validationWarnings?: string[];
}

export type DateFormat =
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'DD Month YYYY'
  | 'Month DD, YYYY'
  | 'YYYY-MM-DD';

export interface DateSettings {
  mode: 'today' | 'custom' | 'disabled';
  customDate: string; // YYYY-MM-DD
  format: DateFormat;
}

export interface CertIdSettings {
  enabled: boolean;
  prefix: string; // e.g. 'ATH'
  year: string; // e.g. '2026'
  startNumber: number; // e.g. 1
  paddingLength: number; // e.g. 4 -> '0001'
  separator: string; // e.g. '-'
}

export interface GenerationProgress {
  isGenerating: boolean;
  total: number;
  completed: number;
  currentParticipant: string;
  percentage: number;
  hasErrors: boolean;
  errorMessage?: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  participantId?: string;
  participantName?: string;
  field?: string;
  message: string;
}

export interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'layout' | 'typography' | 'overflow' | 'alignment' | 'data';
  fieldId?: string;
  patch?: Partial<CertificateField>;
  actionLabel?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  templates: CertificateTemplate[];
  activeTemplateId: string | null;
  signature: SignatureData | null;
  signatures?: SignatureData[];
  fields: CertificateField[];
  participants: Participant[];
  dateSettings: DateSettings;
  certIdSettings: CertIdSettings;
  serialSettings?: SerialNumberSettings;
  excelMapping?: Record<string, string>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  participantCount: number;
  templateCount: number;
  thumbnailUrl?: string;
}

export interface VerificationRecord {
  certId: string;
  participantName: string;
  issueDate: string;
  eventName: string;
  achievement?: string;
  rank?: string;
  score?: string;
  category?: string;
  verifiedAt: string;
  status: 'valid' | 'invalid' | 'not_found';
}

export interface VerificationManifest {
  projectName: string;
  generatedAt: string;
  totalCertificates: number;
  records: VerificationRecord[];
}
