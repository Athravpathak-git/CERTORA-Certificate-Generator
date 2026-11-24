import React from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  Lock,
  Cpu,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E5DD] relative space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-[#182536] hover:bg-slate-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Official Brand Logo Banner */}
        <div className="w-full overflow-hidden rounded-2xl border border-[#E8E5DD] shadow-xs bg-[#FAF8F5] flex items-center justify-center p-2">
          <img
            src="/images/certora_banner.jpg"
            alt="CERTORA - Create. Certify. Celebrate."
            className="w-full h-auto max-h-52 object-contain"
          />
        </div>

        {/* Studio Brand Header */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#182536] border border-[#C4A878]/40 text-[#C4A878] flex items-center justify-center shrink-0 shadow-sm">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#C4A878]/30 text-[#182536] text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3 h-3 text-[#C4A878]" />
              <span>Official Platform</span>
            </div>
            <h2 className="text-2xl font-black text-[#182536] tracking-tight mt-1">
              CERTORA
            </h2>
            <p className="text-xs text-[#C4A878] font-semibold">
              Create. Certify. Celebrate.
            </p>
            <p className="text-xs text-[#77818C] mt-0.5">
              Developed by <strong className="text-[#182536] font-semibold">Athrav Pathak</strong>
            </p>
          </div>
        </div>

        {/* Developer Bio Card */}
        <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E8E5DD] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#182536] uppercase tracking-wider">
              About CERTORA
            </span>
            <span className="text-[11px] font-semibold text-[#C4A878] px-2 py-0.5 bg-white rounded-md border border-[#E8E5DD]">
              Athrav Pathak
            </span>
          </div>
          <p className="text-xs text-[#253246] leading-relaxed">
            CERTORA is a simple certificate generation platform designed to help create and distribute professional certificates efficiently.
          </p>

          {/* Official Social Links (Section 2: ONLY LinkedIn and GitHub) */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <a
              href="https://www.linkedin.com/in/athrav-pathak-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 1.64 1.64 1.64 1.64 0 0 0-1.64-1.64Z" />
              </svg>
              <span>Athrav Pathak on LinkedIn</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </a>

            <a
              href="https://github.com/Athravpathak-git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#24292F] hover:bg-[#1b1f23] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
              <span>Athrav Pathak on GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </a>
          </div>
        </div>

        {/* Architectural Principles */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#182536] uppercase tracking-wider">
            Architecture &amp; Core Guarantees
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Client-Side Privacy</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-tight">
                No database, no backend server, and no cloud uploads. All files and names remain strictly inside your browser session.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Zero Mandatory APIs</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-tight">
                Runs completely offline. Works on flights or isolated internal networks without API keys or logins.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Google Sans Bold Embedded</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-tight">
                TrueType font bytes are packed directly into generated PDFs via pdf-lib for authentic typography.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Dual W/P Template Engine</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Seamlessly maps Winner and Participant certificates automatically from simple comma notation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-[#E8E5DD] flex items-center justify-between text-xs text-slate-500">
          <span>v3.0 Pro Studio Edition</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#182536] hover:bg-[#263B50] text-[#F5F1E8] font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
