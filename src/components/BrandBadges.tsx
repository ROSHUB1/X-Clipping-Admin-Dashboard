import React from 'react';
import { BankType, PlatformType } from '../types';

export const DiscordBadge: React.FC<{ username: string; userId: string; className?: string }> = ({
  username,
  userId,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="font-medium text-slate-200">
        {username}
      </span>
      <span className="font-mono text-[11px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
        {userId}
      </span>
    </div>
  );
};

export const BankBadge: React.FC<{ bank: BankType }> = ({ bank }) => {
  switch (bank) {
    case 'GCash':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          GCash
        </span>
      );
    case 'BDO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          BDO Unibank
        </span>
      );
    case 'PayPal':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-950/60 text-sky-300 border border-sky-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          PayPal
        </span>
      );
    case 'BPI':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-red-950/60 text-red-300 border border-red-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          BPI
        </span>
      );
    case 'Maya':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Maya
        </span>
      );
    case 'UnionBank':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-orange-950/60 text-orange-300 border border-orange-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          UnionBank
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          Wire Transfer
        </span>
      );
  }
};

export const PlatformBadge: React.FC<{ platform: PlatformType }> = ({ platform }) => {
  switch (platform) {
    case 'TikTok':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-slate-700">
          <svg className="w-2.5 h-2.5 fill-current text-slate-200" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.49V8.65a8.28 8.28 0 0 0 3.91 1.25V6.69z" />
          </svg>
          TikTok
        </span>
      );
    case 'YouTube':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-slate-700">
          <svg className="w-2.5 h-2.5 fill-current text-red-500" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          YouTube Shorts
        </span>
      );
    case 'Instagram':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-slate-700">
          <svg className="w-2.5 h-2.5 fill-current text-pink-400" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          Instagram Reels
        </span>
      );
    default:
      return null;
  }
};
