import React, { useState } from 'react';
import { Withdrawal } from '../types';
import { BankBadge } from './BrandBadges';
import {
  X,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Building,
  User,
  Hash,
  ShieldCheck,
} from 'lucide-react';

interface WithdrawalDetailsModalProps {
  withdrawal: Withdrawal | null;
  onClose: () => void;
  onMarkAsPaid: (id: number) => void;
}

export const WithdrawalDetailsModal: React.FC<WithdrawalDetailsModalProps> = ({
  withdrawal,
  onClose,
  onMarkAsPaid,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!withdrawal) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div
      id="withdrawal-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="withdrawal-details-card"
        className="w-full max-w-lg rounded-xl border border-slate-700/80 bg-[#0f1422] p-5 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 font-bold text-slate-200 text-sm">
              {withdrawal.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {withdrawal.username}
                </h3>
                <span className="font-mono text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {withdrawal.userId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs text-slate-400">
                  Transaction ID: {withdrawal.transactionId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(withdrawal.transactionId, 'trx')}
                  title="Copy transaction ID"
                  className="text-slate-400 hover:text-white"
                >
                  {copiedField === 'trx' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3.5 text-xs">
          {/* Summary Box */}
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-900/60 p-3.5 border border-slate-800">
            <div>
              <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Payout Amount
              </span>
              <span className="text-xl font-mono font-bold text-slate-100 mt-0.5 block">
                {withdrawal.amount}
              </span>
              <span className="text-[10px] text-slate-400">Standard zero-fee disbursement</span>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Settlement Status
              </span>
              {withdrawal.status === 'Paid' ? (
                <span className="inline-flex items-center gap-1.5 mt-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Disbursed & Settled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 mt-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Authorization
                </span>
              )}
            </div>
          </div>

          {/* Account Details Box */}
          <div className="space-y-2.5 rounded-lg bg-slate-900/60 p-3.5 border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Receiving Bank Information
              </span>
              <BankBadge bank={withdrawal.bank} />
            </div>

            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Beneficiary Name:
              </span>
              <span className="font-medium text-white">{withdrawal.accountName}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                Account Identifier:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-200">
                  {withdrawal.accountLast4
                    ? `•••• •••• •••• ${withdrawal.accountLast4}`
                    : withdrawal.email}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      withdrawal.accountLast4 ? withdrawal.accountLast4 : withdrawal.email || '',
                      'acct'
                    )
                  }
                  className="text-slate-400 hover:text-white"
                  title="Copy account number"
                >
                  {copiedField === 'acct' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Timestamp:
              </span>
              <span className="text-slate-300 font-mono">
                {withdrawal.date} · {withdrawal.time}
              </span>
            </div>
          </div>

          <div className="rounded bg-slate-900 p-2.5 flex items-center gap-2 text-xs text-slate-400 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Direct clearing protocol. Verified against fraud blacklist and creator identity logs.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {withdrawal.status === 'Pending' && (
            <button
              type="button"
              id="btn-confirm-mark-paid"
              onClick={() => {
                onMarkAsPaid(withdrawal.id);
                onClose();
              }}
              className="rounded bg-slate-100 hover:bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
              Authorize Payout ({withdrawal.amount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
