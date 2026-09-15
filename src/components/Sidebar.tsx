import React from 'react';
import { AdminSection, DiscordUser } from '../types';
import {
  CreditCard,
  PlaySquare,
  CheckCircle2,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  pendingCount: number;
  clipsToReviewCount: number;
  reviewedCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenShortcuts?: () => void;
  currentUser?: DiscordUser | null;
  onOpenDiscordModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  pendingCount,
  clipsToReviewCount,
  reviewedCount,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onOpenShortcuts,
  currentUser,
  onOpenDiscordModal,
}) => {
  const navItems = [
    {
      id: 'withdrawals' as AdminSection,
      label: 'Withdrawals',
      icon: CreditCard,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeType: 'pending' as const,
      shortcut: '1',
    },
    {
      id: 'clips-to-review' as AdminSection,
      label: 'Review Queue',
      icon: PlaySquare,
      badge: clipsToReviewCount > 0 ? clipsToReviewCount : null,
      badgeType: 'review' as const,
      shortcut: '2',
    },
    {
      id: 'reviewed-clips' as AdminSection,
      label: 'Audit History',
      icon: CheckCircle2,
      badge: reviewedCount > 0 ? reviewedCount : null,
      badgeType: 'neutral' as const,
      shortcut: '3',
    },
    {
      id: 'team' as AdminSection,
      label: 'Team Members',
      icon: Users,
      badge: null,
      badgeType: 'neutral' as const,
      shortcut: '4',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between p-3.5 transition-all duration-200 md:translate-x-0 bg-[#0d111c] border-r border-slate-800 ${
          isCollapsed ? 'md:w-[68px]' : 'md:w-[240px]'
        } w-[240px] ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div
            id="sidebar-logo"
            className={`flex items-center pb-3.5 border-b border-slate-800/80 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
              <div
                id="brand-logo-container"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80 p-1"
              >
                <img
                  id="brand-logo-img"
                  src="/logo.png"
                  alt="ClipHub"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.jpg';
                  }}
                />
              </div>

              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight text-white leading-none">
                    ClipHub
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Admin Portal
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              id="btn-close-mobile-sidebar"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {!isCollapsed && (
              <span className="px-2 pb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Management
              </span>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    onCloseMobile();
                  }}
                  title={`${item.label} (Press ${item.shortcut})`}
                  className={`group flex w-full items-center ${
                    isCollapsed ? 'justify-center p-2 rounded-xl' : 'justify-between px-3 py-2 rounded-xl'
                  } text-xs font-medium text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-800 to-slate-800/80 text-white font-semibold shadow-xs border border-slate-700/60'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5">
                      {item.badge !== null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-mono font-medium ${
                            item.badgeType === 'pending'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                              : item.badgeType === 'review'
                              ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/50'
                              : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <kbd className="hidden group-hover:inline-block px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                        {item.shortcut}
                      </kbd>
                    </div>
                  )}

                  {isCollapsed && item.badge !== null && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0d111c]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Controls */}
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
          {/* Shortcuts Trigger */}
          {onOpenShortcuts && !isCollapsed && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5" />
                <span>Shortcuts</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                ?
              </kbd>
            </button>
          )}

          {/* User Profile Mini Bar & Discord Status */}
          {!isCollapsed ? (
            currentUser ? (
              <div
                onClick={onOpenDiscordModal}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 transition-all cursor-pointer group shadow-xs"
                title="Click to view Discord profile & settings"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username || 'User'}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                      {currentUser.globalName || currentUser.username}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 truncate">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{currentUser.role || 'Reviewer'}</span>
                    </div>
                  </div>
                </div>

                {onToggleCollapse && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCollapse();
                    }}
                    title="Collapse sidebar"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={onOpenDiscordModal}
                  className="flex-1 flex items-center gap-2 p-2 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 hover:bg-[#5865F2]/30 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current text-[#5865F2]" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
                  </svg>
                  <span>Connect Discord</span>
                </button>
                {onToggleCollapse && (
                  <button
                    type="button"
                    onClick={onToggleCollapse}
                    title="Collapse sidebar"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onOpenDiscordModal}
                className="relative p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title={currentUser ? `Active: ${currentUser.globalName || currentUser.username}` : 'Connect Discord'}
              >
                {currentUser ? (
                  <>
                    <img
                      src={currentUser.avatarUrl}
                      alt="User"
                      className="h-7 w-7 rounded-full object-cover border border-slate-700"
                    />
                    <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
                  </>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#5865F2] flex items-center justify-center text-white">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 127.14 96.36">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
                    </svg>
                  </div>
                )}
              </button>

              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title="Expand sidebar"
                  className="flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
