import React, { useState, useRef, useEffect } from 'react';
import { AdminSection, DiscordUser } from '../types';
import {
  Menu,
  RotateCw,
  Search,
  Bell,
  Command,
  LogOut,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  onToggleMobileSidebar: () => void;
  totalPendingPayoutsAmount: number;
  totalPaidAmount: number;
  pendingCount: number;
  clipsToReviewCount: number;
  reviewedCount: number;
  onRefresh?: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  currentUser?: DiscordUser | null;
  onOpenDiscordModal: () => void;
  onLogoutDiscord?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  onToggleMobileSidebar,
  totalPendingPayoutsAmount,
  totalPaidAmount,
  pendingCount,
  clipsToReviewCount,
  reviewedCount,
  onRefresh,
  onOpenCommandPalette,
  onOpenShortcuts,
  currentUser,
  onOpenDiscordModal,
  onLogoutDiscord,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const notifications = [
    {
      id: 1,
      title: 'Pending Disbursements',
      desc: `$${totalPendingPayoutsAmount.toFixed(2)} queued across ${pendingCount} creator accounts.`,
      time: 'Just now',
      unread: true,
    },
    {
      id: 2,
      title: 'New Content Submissions',
      desc: `${clipsToReviewCount} creator submissions awaiting review.`,
      time: '12m ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Batch Disbursement Settled',
      desc: 'Previous payout batch settled with all payment rails.',
      time: '1h ago',
      unread: false,
    },
  ];

  const getSectionDetails = () => {
    switch (activeSection) {
      case 'withdrawals':
        return {
          title: 'Withdrawals & Disbursements',
          subtitle: 'Review creator withdrawal requests and execute payouts to banking rails.',
        };
      case 'clips-to-review':
        return {
          title: 'Campaign Review Queue',
          subtitle: 'Audit video submissions against campaign requirements and assign bounties.',
        };
      case 'reviewed-clips':
        return {
          title: 'Audit History',
          subtitle: 'Ledger of approved bounties and rejected creator submissions.',
        };
      case 'team':
        return {
          title: 'Team & Reviewers',
          subtitle: 'Active moderation team members, Discord presence, and roles.',
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'ClipHub administration and treasury operations.',
        };
    }
  };

  const { title, subtitle } = getSectionDetails();

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = currentUser?.globalName || currentUser?.username;
  const displayTag = currentUser?.discordTag || (currentUser?.username ? `@${currentUser.username}` : '');

  return (
    <header
      id="dashboard-header"
      className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-5"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Mobile toggle & breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            id="btn-mobile-sidebar-toggle"
            type="button"
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 md:hidden hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>ClipHub</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">{title}</span>
          </div>
        </div>

        {/* Right Utility Buttons + Discord Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search Button */}
          <button
            type="button"
            id="btn-header-command-palette"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:text-white shadow-xs backdrop-blur-md transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline font-medium">Search records...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-[10px] font-mono text-slate-400">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>

          {/* Sync Refresh */}
          <button
            type="button"
            id="btn-header-refresh"
            onClick={handleManualRefresh}
            title="Refresh data feeds"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 shadow-xs backdrop-blur-md transition-all cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              id="btn-header-notifications"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 shadow-xs backdrop-blur-md transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
              )}
            </button>

            {isNotificationsOpen && (
              <div
                id="notifications-popover"
                className="absolute right-0 top-11 w-80 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn text-left"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                    {notifications.filter((n) => n.unread).length} Unread
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto mt-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2.5 px-2 hover:bg-slate-800/50 rounded-xl transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                          {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[11.5px] text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Discord Button / Profile Avatar (Sa Gilid - Premium Rounded Pill Tab) */}
          {currentUser ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                id="btn-header-profile"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-slate-700/70 bg-slate-900/90 hover:bg-slate-800 hover:border-indigo-500/50 shadow-md backdrop-blur-md transition-all cursor-pointer group"
                title={`${displayName} (${displayTag})`}
              >
                <div className="relative">
                  <img
                    src={
                      currentUser.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
                    }
                    alt={displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                  />
                  {/* Green Online Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-slate-900" />
                  </span>
                </div>

                <div className="hidden sm:flex flex-col text-left leading-none">
                  <span className="text-xs font-semibold text-white truncate max-w-[120px] group-hover:text-indigo-200 transition-colors">
                    {displayName}
                  </span>
                  <span className="text-[9.5px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    ● Online
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors ml-0.5" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div
                  id="profile-dropdown-menu"
                  className="absolute right-0 top-11 w-68 rounded-2xl border border-slate-700/80 bg-[#0e1422]/95 p-3.5 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn text-left text-xs"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
                    <div className="relative">
                      <img
                        src={currentUser.avatarUrl}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/50"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">
                        {displayName}
                      </div>
                      <div className="text-[11px] text-[#8ea1ff] font-mono truncate">
                        {displayTag}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                        {currentUser.role || 'Reviewer'}
                      </div>
                    </div>
                  </div>

                  <div className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/70 text-[11px] text-slate-300">
                      <span className="text-slate-400">Queue Status</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active Reviewer
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenDiscordModal();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-800/70 text-slate-200 hover:text-white transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium">Discord Connection Info</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5865F2]" />
                    </button>
                  </div>

                  {onLogoutDiscord && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogoutDiscord();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Discord</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              id="btn-header-discord-signin"
              onClick={onOpenDiscordModal}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3c45a5] text-white text-xs font-semibold shadow-md shadow-[#5865F2]/20 hover:shadow-[#5865F2]/30 transition-all cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
              </svg>
              <span className="hidden sm:inline">Sign in with Discord</span>
              <span className="sm:hidden">Discord</span>
            </button>
          )}
        </div>
      </div>

      {/* Page Title & Context */}
      <div>
        <h1
          id="page-main-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight text-white"
        >
          {title}
        </h1>
        <p
          id="page-sub-heading"
          className="text-xs sm:text-sm text-slate-400 mt-1"
        >
          {subtitle}
        </p>
      </div>
    </header>
  );
};
