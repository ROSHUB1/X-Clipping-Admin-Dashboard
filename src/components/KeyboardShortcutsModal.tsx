import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ + K / Ctrl + K', description: 'Open Command Palette & Search' },
    { key: '1', description: 'Navigate to Withdrawals' },
    { key: '2', description: 'Navigate to Review Queue' },
    { key: '3', description: 'Navigate to Audit History' },
    { key: 'R', description: 'Refresh data feeds' },
    { key: 'S', description: 'Toggle Sidebar Collapse' },
    { key: '?', description: 'Show Keyboard Shortcuts' },
    { key: 'Esc', description: 'Close modal or active overlay' },
  ];

  return (
    <div
      id="keyboard-shortcuts-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        id="keyboard-shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-3.5 space-y-1.5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80"
            >
              <span className="text-xs text-slate-300">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2.5 text-[11px] text-slate-400 font-mono">
          <span>Shortcuts active across all views</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
};
