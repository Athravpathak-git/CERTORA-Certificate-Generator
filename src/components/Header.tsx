import React from 'react';
import {
  Sparkles,
  RefreshCw,
  PlayCircle,
  Save,
  Download,
  Menu,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ActiveView } from '../types';
import { AppLanguage, t } from '../services/i18n';

interface HeaderProps {
  activeView: ActiveView;
  projectName: string;
  hasTemplate: boolean;
  participantCount: number;
  completedCertificatesCount: number;
  onLoadSample: () => void;
  onReset: () => void;
  onSaveProject: () => void;
  onExportProject: () => void;
  onOpenMobileMenu: () => void;
  isSidebarCollapsed: boolean;
  language?: AppLanguage;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  projectName,
  hasTemplate,
  participantCount,
  completedCertificatesCount,
  onLoadSample,
  onReset,
  onSaveProject,
  onExportProject,
  onOpenMobileMenu,
  isSidebarCollapsed,
  language = 'en',
}) => {
  const getHeaderMeta = () => {
    switch (activeView) {
      case 'home':
      case 'dashboard':
        return {
          title: 'CERTORA',
          subtitle: 'Create. Certify. Celebrate. • Developed by Athrav Pathak',
        };
      case 'create':
      case 'editor':
      case 'participants':
      case 'signature':
      case 'generation':
        return {
          title: t('createCertificate', language),
          subtitle: '5-Step Guided Certificate Creation & Bulk Vector PDF Compiler',
        };
      case 'certificates':
      case 'projects':
        return {
          title: t('myCertificates', language),
          subtitle: 'Saved certificate batches, recent exports & verification history',
        };
      case 'templates':
        return {
          title: t('templates', language),
          subtitle: 'Certificate template library & custom layout gallery',
        };
      case 'settings':
      case 'verification':
      case 'about':
        return {
          title: t('settings', language),
          subtitle: 'Language preferences, Certificate ID patterns & Studio identity',
        };
      default:
        return {
          title: 'CERTORA',
          subtitle: 'Create. Certify. Celebrate. • Developed by Athrav Pathak',
        };
    }
  };

  const currentViewMeta = getHeaderMeta();

  return (
    <header
      className={`sticky top-0 z-30 h-20 bg-midnight/95 backdrop-blur-md border-b border-midnight-border transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}
    >
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-midnight-card border border-midnight-border text-ivory hover:text-gold transition-colors"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-ivory truncate tracking-tight">
                {currentViewMeta.title}
              </h1>
              {hasTemplate && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/20 text-status-success border border-status-success/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Project</span>
                </span>
              )}
            </div>
            <p className="text-xs text-ivory-secondary hidden sm:block truncate">
              {currentViewMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Quick Demo Button (Champagne Gold) */}
          <button
            onClick={onLoadSample}
            type="button"
            className="btn-gold"
            title="Load sample executive certificate, signature and participants"
          >
            <PlayCircle className="w-4 h-4 fill-midnight" />
            <span className="hidden md:inline">{t('tryDemo', language)}</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Quick Save Project */}
          {hasTemplate && (
            <button
              onClick={onSaveProject}
              type="button"
              className="btn-deep hidden sm:inline-flex"
              title="Save project locally to browser storage"
            >
              <Save className="w-4 h-4 text-gold" />
              <span>{t('save', language)}</span>
            </button>
          )}

          {/* Export .certproj */}
          {hasTemplate && (
            <button
              onClick={onExportProject}
              type="button"
              className="btn-outline hidden lg:inline-flex"
              title="Export portable .certproj file"
            >
              <Download className="w-4 h-4" />
              <span>{t('exportProject', language)}</span>
            </button>
          )}

          {/* Reset Current Batch */}
          {hasTemplate && (
            <button
              onClick={onReset}
              type="button"
              className="btn-danger"
              title="Reset current project"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{t('reset', language)}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
