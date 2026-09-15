import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AdminSection, Withdrawal, CampaignGroup, ReviewedClip, ClipToReview } from '../types';
import {
  Search,
  CreditCard,
  PlaySquare,
  CheckCircle,
  Users,
  X,
  RotateCw,
  Download,
  DollarSign,
  Film,
  ArrowRight,
  UserPlus,
  Upload,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: AdminSection) => void;
  withdrawals: Withdrawal[];
  campaignGroups: CampaignGroup[];
  reviewedClips: ReviewedClip[];
  onSelectWithdrawal?: (withdrawal: Withdrawal) => void;
  onSelectClipToReview?: (clip: ClipToReview) => void;
  onSelectReviewedClip?: (clip: ReviewedClip) => void;
  onSyncData?: () => void;
  onExportCSV?: () => void;
  onAddNewUser?: () => void;
  onOpenSubmitClip?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  withdrawals,
  campaignGroups,
  reviewedClips,
  onSelectWithdrawal,
  onSelectClipToReview,
  onSelectReviewedClip,
  onSyncData,
  onExportCSV,
  onAddNewUser,
  onOpenSubmitClip,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allPendingClips = useMemo(() => {
    return campaignGroups.flatMap((g) => g.clips);
  }, [campaignGroups]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();

    // 1. Navigation items
    const navItems = [
      {
        id: 'nav-withdrawals',
        category: 'Navigation',
        icon: CreditCard,
        title: 'Withdrawals & Disbursements',
        subtitle: `${withdrawals.filter((w) => w.status === 'Pending').length} pending disbursements`,
        badge: 'Section',
        action: () => {
          onSelectSection('withdrawals');
          onClose();
        },
      },
      {
        id: 'nav-clips-to-review',
        category: 'Navigation',
        icon: PlaySquare,
        title: 'Campaign Review Queue',
        subtitle: `${allPendingClips.length} submissions awaiting review`,
        badge: 'Section',
        action: () => {
          onSelectSection('clips-to-review');
          onClose();
        },
      },
      {
        id: 'nav-reviewed-clips',
        category: 'Navigation',
        icon: CheckCircle,
        title: 'Audit History & Logs',
        subtitle: `${reviewedClips.length} historical submission records`,
        badge: 'Section',
        action: () => {
          onSelectSection('reviewed-clips');
          onClose();
        },
      },
      {
        id: 'nav-team',
        category: 'Navigation',
        icon: Users,
        title: 'Moderation Team & Reviewers',
        subtitle: 'View active team members, Discord presences & roles',
        badge: 'Section',
        action: () => {
          onSelectSection('team');
          onClose();
        },
      },
    ].filter((item) => !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q));

    // 2. Quick Actions
    const quickActions = [
      {
        id: 'action-sync',
        category: 'Actions',
        icon: RotateCw,
        title: 'Refresh Data Feeds',
        subtitle: 'Sync transaction logs and pending submissions',
        badge: 'Action',
        action: () => {
          if (onSyncData) onSyncData();
          onClose();
        },
      },
      {
        id: 'action-export',
        category: 'Actions',
        icon: Download,
        title: 'Export Treasury CSV Ledger',
        subtitle: 'Download complete disbursements table for reporting',
        badge: 'Action',
        action: () => {
          if (onExportCSV) onExportCSV();
          onClose();
        },
      },
      {
        id: 'action-add-user',
        category: 'Actions',
        icon: UserPlus,
        title: 'Add New User / Creator',
        subtitle: 'Register creator profile and configure payment rails',
        badge: 'Action',
        action: () => {
          if (onAddNewUser) onAddNewUser();
          onClose();
        },
      },
      {
        id: 'action-submit-clip',
        category: 'Actions',
        icon: Upload,
        title: 'Submit Video with Campaign',
        subtitle: 'Add video submission tagged with campaign for review',
        badge: 'Submission',
        action: () => {
          if (onOpenSubmitClip) onOpenSubmitClip();
          onClose();
        },
      },
    ].filter((item) => !q || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q));

    // 3. Pending Withdrawals Matching Query
    const withdrawalItems = withdrawals
      .filter((w) => {
        if (!q) return w.status === 'Pending';
        return (
          w.username.toLowerCase().includes(q) ||
          w.accountName.toLowerCase().includes(q) ||
          w.transactionId.toLowerCase().includes(q) ||
          w.bank.toLowerCase().includes(q) ||
          w.amount.toLowerCase().includes(q)
        );
      })
      .slice(0, 4)
      .map((w) => ({
        id: `withdrawal-${w.id}`,
        category: 'Disbursements',
        icon: DollarSign,
        title: `${w.username} (${w.accountName}) — ${w.amount}`,
        subtitle: `${w.bank} • ${w.transactionId}`,
        badge: w.status,
        action: () => {
          onSelectSection('withdrawals');
          if (onSelectWithdrawal) onSelectWithdrawal(w);
          onClose();
        },
      }));

    // 4. Pending Clips Matching Query
    const clipItems = allPendingClips
      .filter((c) => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          c.creator.toLowerCase().includes(q) ||
          c.campaign.toLowerCase().includes(q) ||
          c.clipId.toLowerCase().includes(q)
        );
      })
      .slice(0, 4)
      .map((c) => ({
        id: `clip-${c.id}`,
        category: 'Submissions',
        icon: Film,
        title: `${c.title} by ${c.creator}`,
        subtitle: `${c.campaign} • ${c.views} views • Bounty: ${c.suggestedPayout}`,
        badge: c.platform,
        action: () => {
          onSelectSection('clips-to-review');
          if (onSelectClipToReview) onSelectClipToReview(c);
          onClose();
        },
      }));

    return [...navItems, ...quickActions, ...withdrawalItems, ...clipItems];
  }, [
    query,
    withdrawals,
    allPendingClips,
    reviewedClips,
    onSelectSection,
    onClose,
    onSelectWithdrawal,
    onSelectClipToReview,
    onSyncData,
    onExportCSV,
  ]);

  // Keyboard navigation inside list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      id="command-palette-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        id="command-palette-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-200"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            id="input-command-palette-search"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search creators, transactions, or clips..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="command-palette-results"
          className="max-h-80 overflow-y-auto p-1.5 space-y-0.5"
        >
          {results.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No matching commands or records found.
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-snug">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-slate-400">
                      {item.badge}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>ClipHub Commands</span>
        </div>
      </div>
    </div>
  );
};
