import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  LogOut,
  BadgeCheck,
  ShieldCheck,
  UserCheck,
  FileCheck2,
} from 'lucide-react';
import { DiscordUser } from '../types';

interface DiscordAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: DiscordUser | null;
  onDiscordLoginSuccess: (user: DiscordUser) => void;
  onLogoutDiscord?: () => void;
}

export const DiscordAuthModal: React.FC<DiscordAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDiscordLoginSuccess,
  onLogoutDiscord,
}) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen for OAuth postMessage callback from popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (
        event.origin.endsWith('.run.app') ||
        event.origin.endsWith('.netlify.app') ||
        event.origin.endsWith('.vercel.app') ||
        event.origin.includes('localhost') ||
        event.origin.includes('127.0.0.1')
      ) {
        if (event.data?.type === 'DISCORD_OAUTH_SUCCESS' && event.data?.user) {
          onDiscordLoginSuccess(event.data.user);
          onClose();
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onDiscordLoginSuccess, onClose]);

  if (!isOpen) return null;

  const handleLaunchDiscordOAuth = async () => {
    setIsLoadingAuth(true);
    setErrorMessage(null);
    try {
      // Dynamic Redirect URI based on whatever website URL the user is currently on (Netlify, Vercel, Localhost, or AI Studio)
      const currentOrigin = window.location.origin;
      const redirectUri = currentOrigin.endsWith('/') ? currentOrigin : `${currentOrigin}/`;
      const clientId = '1538421580340789378';

      // Use response_type=token so it works directly on static hosts like Netlify without needing a backend server
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'identify email',
        prompt: 'consent',
      });

      const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

      // Redirect directly to Discord
      window.location.href = authUrl;
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate Discord OAuth flow.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const displayName = currentUser?.globalName || currentUser?.username;
  const displayTag = currentUser?.discordTag || (currentUser?.username ? `@${currentUser.username}` : '');

  return (
    <div
      id="discord-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="discord-auth-modal-dialog"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700/80 bg-[#0f1422] p-5 sm:p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2]">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {currentUser ? 'Discord Verified Account' : 'Reviewer Authentication'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser
                  ? 'Your verified Discord identity is active for all moderation audits.'
                  : 'Authenticate to sign decisions and authorize creator payouts.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 text-xs">
          {/* If Logged In: Show Real Profile Card */}
          {currentUser ? (
            <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={currentUser.avatarUrl}
                      alt={displayName || 'User'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/60"
                    />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0f1422]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{displayName}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-semibold">
                        <BadgeCheck className="w-3 h-3" />
                        Verified Reviewer
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8ea1ff] font-mono mt-0.5">
                      {displayTag}
                    </div>
                    {currentUser.email && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {currentUser.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Audit Attribution:</span>
                <span className="text-slate-200 font-medium">
                  &ldquo;Reviewed by {displayName}&rdquo;
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleLaunchDiscordOAuth}
                  disabled={isLoadingAuth}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
                  </svg>
                  <span>Switch Account</span>
                </button>

                {onLogoutDiscord && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogoutDiscord();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* If Not Logged In: Explanation Card & Sign-In */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2] shrink-0">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Why Discord Sign-In is Required</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Ensures moderation security and audit trails for clip approvals and payouts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/50">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200">Verified Identity & Accountability</span>
                      <p className="text-[11px] text-slate-400">
                        Every clip approval, rejection, and payout calculation is stamped with your verified moderator profile.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/50">
                    <FileCheck2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200">Immutable Audit Trail</span>
                      <p className="text-[11px] text-slate-400">
                        Prevents unauthorized payouts and keeps an official ledger of reviewer actions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/50">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200">Zero Password Storage</span>
                      <p className="text-[11px] text-slate-400">
                        Authentication is handled securely via Discord OAuth without storing any passwords.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-trigger-discord-oauth"
                  onClick={handleLaunchDiscordOAuth}
                  disabled={isLoadingAuth}
                  className="w-full mt-2 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
                  </svg>
                  <span>{isLoadingAuth ? 'Opening Discord...' : 'Continue with Discord'}</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
