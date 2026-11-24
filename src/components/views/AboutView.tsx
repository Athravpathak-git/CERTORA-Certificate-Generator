import React from 'react';
import {
  Award,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  User,
  Heart,
  ExternalLink,
  Code2,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  ArrowRight,
} from 'lucide-react';
import { ActiveView } from '../../types';

interface AboutViewProps {
  onNavigateView: (view: ActiveView) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigateView }) => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Hero Card */}
      <div className="card-luxury p-8 sm:p-10 border-gold/40 relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Application Identity</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ivory tracking-tight">
              CERTORA
            </h1>
            <p className="text-lg sm:text-xl font-medium text-gold">
              Create. Certify. Celebrate. • Developed by <span className="text-ivory font-semibold underline decoration-gold/50 underline-offset-4">Athrav Pathak</span>
            </p>
          </div>

          <p className="text-secondary-text text-sm sm:text-base leading-relaxed max-w-3xl">
            CERTORA is a simple certificate generation platform designed to help create and distribute professional certificates efficiently.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onNavigateView('editor')}
              className="btn-gold text-xs flex items-center gap-2"
            >
              <span>Open Certificate Editor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateView('dashboard')}
              className="btn-outline text-xs"
            >
              Back to Dashboard
            </button>
            <div className="text-xs text-secondary-text ml-auto font-mono">
              Version: <span className="text-gold font-bold">3.0 Pro Studio Edition</span>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Profile Card */}
      <div className="card-luxury p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-midnight-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold/30 flex items-center justify-center text-gold shadow-md">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-ivory">
                Athrav Pathak
              </h2>
              <p className="text-xs text-gold font-medium">
                Software Architect, Full-Stack Engineer &amp; Designer
              </p>
              <p className="text-xs text-secondary-text mt-0.5">
                Creator and Developer of CERTORA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary-text font-mono bg-midnight px-3 py-1.5 rounded-lg border border-midnight-border">
            <Code2 className="w-4 h-4 text-gold" />
            <span>Athrav Pathak Original Software</span>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-secondary-text leading-relaxed">
          <p>
            CERTORA was conceived and developed by <strong className="text-ivory">Athrav Pathak</strong> to solve a fundamental problem faced by universities, clubs, and organizations: generating hundreds of verified, high-resolution certificates without sacrificing design freedom or exposing sensitive participant records to third-party cloud backends.
          </p>
          <p>
            Every single line of code—from the mathematical coordinate normalization engine to the transparent signature background remover and the high-resolution Devanagari canvas shaper—has been built with meticulous attention to detail, usability, and performance.
          </p>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-bold text-ivory flex items-center gap-2">
          <Cpu className="w-5 h-5 text-gold" />
          <span>Architectural Pillars &amp; Technical Capabilities</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card-luxury p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center justify-center text-status-success">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-ivory">100% Client-Side Privacy</h4>
            <p className="text-xs text-secondary-text leading-relaxed">
              Zero backend, zero external API keys, and zero telemetry. All participant names, uploaded signatures, and certificates remain exclusively inside your browser RAM and local storage.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card-luxury p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-ivory">Vector PDF Generation</h4>
            <p className="text-xs text-secondary-text leading-relaxed">
              Powered by <code className="text-gold">pdf-lib</code> and <code className="text-gold">pdfjs-dist</code> for loss-free vector text placement, high-DPI rendering, page selection, and crisp print-ready output.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card-luxury p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-ivory">Marathi &amp; Devanagari Engine</h4>
            <p className="text-xs text-secondary-text leading-relaxed">
              Dedicated Unicode font shaping supporting complex ligatures, matras, and conjuncts for Marathi and Hindi names using Google Fonts (Noto Sans Devanagari, Mukta, Hind).
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card-luxury p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-ivory">Smart Signature Remover</h4>
            <p className="text-xs text-secondary-text leading-relaxed">
              Client-side luminosity and chroma background removal that extracts clean transparent PNG signatures from white, cream, or grey paper with fine-edge smoothing and manual brushes.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card-luxury p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-ivory">Excel Multi-Sheet Parser</h4>
            <p className="text-xs text-secondary-text leading-relaxed">
              Seamless SheetJS integration supporting <code className="text-gold">.xlsx</code>, <code className="text-gold">.xls</code>, and CSV formats with worksheet selection, column mapping, and duplicate name warnings.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card-luxury p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-ivory">Local Persistence &amp; QR</h4>
            <p className="text-xs text-secondary-text leading-relaxed">
              Complete project persistence via browser IndexedDB, portable <code className="text-gold">.certproj</code> bundle export/import, offline QR code verification, and audit manifest generation.
            </p>
          </div>
        </div>
      </div>

      {/* Software Specifications Table */}
      <div className="card-luxury p-6 space-y-4">
        <h3 className="text-base font-bold text-ivory pb-2 border-b border-midnight-border">
          Software Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
            <span className="text-secondary-text">Application Name</span>
            <div className="font-semibold text-ivory mt-0.5">CERTORA</div>
          </div>
          <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
            <span className="text-secondary-text">Author &amp; Developer</span>
            <div className="font-semibold text-gold mt-0.5">Athrav Pathak</div>
          </div>
          <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
            <span className="text-secondary-text">Framework &amp; Stack</span>
            <div className="font-semibold text-ivory mt-0.5">React 18 • TypeScript • Tailwind CSS • Vite</div>
          </div>
          <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
            <span className="text-secondary-text">PDF Vector Engine</span>
            <div className="font-semibold text-ivory mt-0.5">pdf-lib &amp; PDF.js</div>
          </div>
          <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
            <span className="text-secondary-text">Compression Engine</span>
            <div className="font-semibold text-ivory mt-0.5">JSZip &amp; FileSaver</div>
          </div>
          <div className="p-3 rounded-xl bg-midnight border border-midnight-border">
            <span className="text-secondary-text">Security Guarantee</span>
            <div className="font-semibold text-status-success mt-0.5">Zero Cloud Storage • Air-Gapped Capable</div>
          </div>
        </div>
      </div>

      {/* Footer Acknowledgement */}
      <div className="text-center py-6 border-t border-midnight-border/60 text-xs text-secondary-text space-y-2">
        <p className="flex items-center justify-center gap-1.5 font-medium text-ivory">
          <span>CERTORA</span>
          <span>•</span>
          <span>Create. Certify. Celebrate. • Developed by</span>
          <span className="text-gold font-bold">Athrav Pathak</span>
        </p>
        <p className="text-secondary-text/80">
          All rights reserved © 2026 Athrav Pathak. 100% Client-Side Bulk Certificate Automation Software.
        </p>
      </div>
    </div>
  );
};
