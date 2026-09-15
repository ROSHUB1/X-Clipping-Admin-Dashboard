import React from 'react';
import { AdminSection } from '../types';
import {
  CreditCard,
  PlaySquare,
  CheckCircle2,
  Users,
  Upload,
  Search,
} from 'lucide-react';

interface BottomNavBarProps {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  pendingCount: number;
  clipsToReviewCount: number;
  reviewedCount: number;
  onOpenSubmitClip: () => void;
  onOpenCommandPalette: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeSection,
  onSelectSection,
  pendingCount,
  clipsToReviewCount,
  reviewedCount,
  onOpenSubmitClip,
  onOpenCommandPalette,
}) => {
  return (
    <nav
      id="mobile-bottom-nav-bar"
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d111c]/95 backdrop-blur-md border-t border-slate-800/90 px-3 py-1.5 md:hidden flex items-center justify-between safe-area-inset-bottom"
    >
      {/* Withdrawals Tab */}
      <button
        type="button"
        id="bottom-nav-withdrawals"
        onClick={() => onSelectSection('withdrawals')}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
          activeSection === 'withdrawals' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <CreditCard className={`w-5 h-5 ${activeSection === 'withdrawals' ? 'text-indigo-400' : ''}`} />
          {pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-black font-mono font-bold text-[9.5px] flex items-center justify-center ring-2 ring-[#0d111c]">
              {pendingCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] mt-1 font-medium ${activeSection === 'withdrawals' ? 'font-semibold text-white' : ''}`}>
          Payouts
        </span>
      </button>

      {/* Review Queue Tab */}
      <button
        type="button"
        id="bottom-nav-clips-to-review"
        onClick={() => onSelectSection('clips-to-review')}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
          activeSection === 'clips-to-review' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <PlaySquare className={`w-5 h-5 ${activeSection === 'clips-to-review' ? 'text-indigo-400' : ''}`} />
          {clipsToReviewCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 rounded-full bg-indigo-500 text-white font-mono font-bold text-[9.5px] flex items-center justify-center ring-2 ring-[#0d111c]">
              {clipsToReviewCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] mt-1 font-medium ${activeSection === 'clips-to-review' ? 'font-semibold text-white' : ''}`}>
          Queue
        </span>
      </button>

      {/* Central Quick Submit Action */}
      <div className="flex-1 flex items-center justify-center -mt-3">
        <button
          type="button"
          id="bottom-nav-submit-clip-fab"
          onClick={onOpenSubmitClip}
          aria-label="Submit Clip for Campaign"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border-2 border-[#0d111c] active:scale-95 transition-transform cursor-pointer"
        >
          <Upload className="w-5 h-5" />
        </button>
      </div>

      {/* Audit History Tab */}
      <button
        type="button"
        id="bottom-nav-reviewed-clips"
        onClick={() => onSelectSection('reviewed-clips')}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
          activeSection === 'reviewed-clips' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <CheckCircle2 className={`w-5 h-5 ${activeSection === 'reviewed-clips' ? 'text-indigo-400' : ''}`} />
          {reviewedCount > 0 && (
            <span className="absolute -top-1.5 -right-2 h-3.5 min-w-3.5 px-0.5 rounded-full bg-slate-700 text-slate-300 font-mono text-[9px] flex items-center justify-center ring-2 ring-[#0d111c]">
              {reviewedCount}
            </span>
          )}
        </div>
        <span className={`text-[10px] mt-1 font-medium ${activeSection === 'reviewed-clips' ? 'font-semibold text-white' : ''}`}>
          Audit
        </span>
      </button>

      {/* Team Tab */}
      <button
        type="button"
        id="bottom-nav-team"
        onClick={() => onSelectSection('team')}
        className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors cursor-pointer ${
          activeSection === 'team' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className={`w-5 h-5 ${activeSection === 'team' ? 'text-indigo-400' : ''}`} />
        <span className={`text-[10px] mt-1 font-medium ${activeSection === 'team' ? 'font-semibold text-white' : ''}`}>
          Team
        </span>
      </button>
    </nav>
  );
};
