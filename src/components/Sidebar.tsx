import React from 'react';
import {
  Home,
  FilePlus,
  Award,
  Layers,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { ActiveView } from '../types';
import { AppLanguage, t } from '../services/i18n';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  participantCount: number;
  templateCount: number;
  completedCertificatesCount: number;
  language?: AppLanguage;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  participantCount,
  templateCount,
  completedCertificatesCount,
  language = 'en',
}) => {
  // Section 3: Exactly 5 Simplified Navigation Items
  const navItems = [
    {
      id: 'home' as ActiveView,
      label: t('home', language),
      icon: Home,
      badge: undefined,
    },
    {
      id: 'create' as ActiveView,
      label: t('createCertificate', language),
      icon: FilePlus,
      badge: templateCount > 0 ? t('ready', language) : undefined,
    },
    {
      id: 'certificates' as ActiveView,
      label: t('myCertificates', language),
      icon: Award,
      badge: completedCertificatesCount > 0 ? completedCertificatesCount : undefined,
    },
    {
      id: 'templates' as ActiveView,
      label: t('templates', language),
      icon: Layers,
      badge: templateCount > 0 ? templateCount : undefined,
    },
    {
      id: 'settings' as ActiveView,
      label: t('settings', language),
      icon: Settings,
      badge: undefined,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-midnight-darker/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-midnight border-r border-midnight-border transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } shadow-premium select-none`}
      >
        {/* Sidebar Header & Brand Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-midnight-border bg-midnight-card/40">
          <div className="flex items-center gap-3 min-w-0">
            {/* Studio Logo Icon */}
            <div className="relative flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-midnight-deep to-midnight-card border border-gold/40 flex items-center justify-center shadow-gold">
              <Award className="w-6 h-6 text-gold" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-midnight flex items-center justify-center shadow-xs">
                <Sparkles className="w-2.5 h-2.5 fill-midnight" />
              </div>
            </div>

            {/* Brand Title (when expanded) */}
            {!isCollapsed && (
              <div className="min-w-0 animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-tight text-ivory truncate">
                    ATHRAV
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gold/20 text-gold border border-gold/30 uppercase tracking-wider">
                    Studio
                  </span>
                </div>
                <div className="text-[10px] text-ivory-secondary font-medium truncate">
                  Smart Certificate Studio
                </div>
              </div>
            )}
          </div>

          {/* Close mobile button / Collapse desktop button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-ivory-secondary hover:text-ivory hover:bg-midnight-deep"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-ivory-secondary hover:text-gold hover:bg-midnight-deep transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Developer Attribution Sub-Header (when expanded) */}
        {!isCollapsed && (
          <div className="px-5 py-2.5 bg-midnight-darker/60 border-b border-midnight-border/60 flex items-center justify-between text-[11px]">
            <span className="text-ivory-secondary">Developer &amp; Owner:</span>
            <span className="font-bold text-gold tracking-wide">ATHRAV PATHAK</span>
          </div>
        )}

        {/* Navigation Menu Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeView === item.id ||
              (item.id === 'home' && (activeView === 'dashboard' || activeView === 'home')) ||
              (item.id === 'create' && ['create', 'editor', 'participants', 'signature', 'generation'].includes(activeView)) ||
              (item.id === 'certificates' && activeView === 'projects') ||
              (item.id === 'settings' && ['settings', 'verification', 'about'].includes(activeView));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-midnight-card text-gold border border-gold/40 shadow-subtle'
                    : 'text-ivory-secondary hover:bg-midnight-deep/60 hover:text-ivory border border-transparent'
                }`}
              >
                {/* Active Gold Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gold shadow-gold" />
                )}

                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-gold' : 'text-ivory-secondary group-hover:text-gold'
                  }`}
                />

                {!isCollapsed && (
                  <span className="flex-1 truncate tracking-wide">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-gold/20 text-gold border border-gold/30'
                        : 'bg-midnight-deep text-ivory-secondary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Card */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-midnight-border bg-midnight-card/40">
            <div className="rounded-xl p-3 bg-midnight-deep border border-midnight-border space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-ivory">100% Client-Side</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-status-success/20 text-status-success font-semibold">
                  Offline Ready
                </span>
              </div>
              <p className="text-[10px] text-ivory-secondary leading-relaxed">
                Zero cloud upload. Your templates, signatures &amp; names stay private in your browser.
              </p>
              <div className="pt-1 text-[9px] text-ivory-secondary/70 border-t border-midnight-border flex items-center justify-between">
                <span>CERTORA</span>
                <span className="font-mono text-gold">v3.0 Pro</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-midnight-border flex justify-center">
            <div
              className="w-8 h-8 rounded-lg bg-midnight-deep border border-midnight-border flex items-center justify-center text-gold"
              title="CERTORA v3.0 Pro"
            >
              <Award className="w-4 h-4" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
