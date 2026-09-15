import React, { useState } from 'react';
import { X, UserPlus, Shield, CreditCard, DollarSign } from 'lucide-react';
import { BankType } from '../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (userData: {
    username: string;
    accountName: string;
    bank: BankType;
    accountNumber: string;
    role: string;
    initialGrant: number;
  }) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [username, setUsername] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bank, setBank] = useState<BankType>('GCash');
  const [accountNumber, setAccountNumber] = useState('');
  const [role, setRole] = useState<'Creator' | 'Auditor' | 'Campaign Manager'>('Creator');
  const [initialGrant, setInitialGrant] = useState<string>('0');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const cleanUsername = username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`;

    if (!username.trim()) {
      newErrors.username = 'Creator handle or username is required';
    }
    if (!accountName.trim()) {
      newErrors.accountName = 'Legal account holder name is required';
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number or mobile ID is required';
    }

    const grantNum = parseFloat(initialGrant) || 0;
    if (grantNum < 0) {
      newErrors.initialGrant = 'Grant cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onUserAdded({
      username: cleanUsername,
      accountName: accountName.trim(),
      bank,
      accountNumber: accountNumber.trim(),
      role,
      initialGrant: grantNum,
    });

    // Reset and close
    setUsername('');
    setAccountName('');
    setAccountNumber('');
    setInitialGrant('0');
    setErrors({});
    onClose();
  };

  return (
    <div
      id="add-user-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <div
        id="add-user-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-200 animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Add New User / Creator</h3>
              <p className="text-[11px] text-slate-400">Register a new creator account and configure disbursement rails.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Handle & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5" htmlFor="input-new-user-handle">
                Creator Handle <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-new-user-handle"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                }}
                placeholder="@username"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              {errors.username && (
                <span className="text-[10px] text-rose-400 mt-1 block">{errors.username}</span>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5" htmlFor="input-new-user-accountname">
                Account Holder Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-new-user-accountname"
                type="text"
                value={accountName}
                onChange={(e) => {
                  setAccountName(e.target.value);
                  if (errors.accountName) setErrors((prev) => ({ ...prev, accountName: '' }));
                }}
                placeholder="Juan Dela Cruz"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
              />
              {errors.accountName && (
                <span className="text-[10px] text-rose-400 mt-1 block">{errors.accountName}</span>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Platform Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Creator', 'Auditor', 'Campaign Manager'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                    role === r
                      ? 'bg-slate-800 border-indigo-500/80 text-white shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3 h-3 text-indigo-400" />
                  <span>{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payout Rail & Account Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5" htmlFor="select-new-user-bank">
                Payout Channel / Rail
              </label>
              <div className="relative">
                <select
                  id="select-new-user-bank"
                  value={bank}
                  onChange={(e) => setBank(e.target.value as BankType)}
                  className="w-full appearance-none rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors cursor-pointer pr-8"
                >
                  <option value="GCash">GCash (Mobile Wallet)</option>
                  <option value="Maya">Maya (PayMaya)</option>
                  <option value="BDO">BDO Unibank</option>
                  <option value="BPI">Bank of the Philippine Islands (BPI)</option>
                  <option value="UnionBank">UnionBank of the Philippines</option>
                  <option value="PayPal">PayPal Global</option>
                </select>
                <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5" htmlFor="input-new-user-accnumber">
                Account / Mobile Number <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-new-user-accnumber"
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  if (errors.accountNumber) setErrors((prev) => ({ ...prev, accountNumber: '' }));
                }}
                placeholder="0917-XXX-XXXX or 10-digit #"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              {errors.accountNumber && (
                <span className="text-[10px] text-rose-400 mt-1 block">{errors.accountNumber}</span>
              )}
            </div>
          </div>

          {/* Initial Welcome Bonus / Grant */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5" htmlFor="input-new-user-grant">
              Initial Bounty / Sign-up Grant ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-new-user-grant"
                type="number"
                min="0"
                step="5"
                value={initialGrant}
                onChange={(e) => setInitialGrant(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">
              If greater than $0, a pending welcome disbursement will be instantly queued in the treasury ledger.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-add-user"
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
