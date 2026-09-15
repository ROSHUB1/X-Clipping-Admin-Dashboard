import React, { useState, useMemo } from 'react';
import { Withdrawal, StatusFilter, DateFilter } from '../types';
import { WithdrawalDetailsModal } from './WithdrawalDetailsModal';
import { BankBadge, DiscordBadge } from './BrandBadges';
import {
  Search,
  Download,
  Check,
  Copy,
  ChevronDown,
  Clock,
  CheckCircle2,
  DollarSign,
  Users,
  Eye,
} from 'lucide-react';

interface WithdrawalsSectionProps {
  withdrawals: Withdrawal[];
  onMarkAsPaid: (id: number) => void;
}

export const WithdrawalsSection: React.FC<WithdrawalsSectionProps> = ({
  withdrawals,
  onMarkAsPaid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filtered withdrawals calculation
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        w.username.toLowerCase().includes(q) ||
        w.bank.toLowerCase().includes(q) ||
        w.transactionId.toLowerCase().includes(q) ||
        w.accountName.toLowerCase().includes(q) ||
        (w.email && w.email.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' || w.status.toLowerCase() === statusFilter.toLowerCase();

      let matchesDate = true;
      if (dateFilter === 'week') {
        matchesDate = w.date.includes('Aug 26') || w.date.includes('Aug 27');
      } else if (dateFilter === 'month') {
        matchesDate = w.date.includes('Aug');
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [withdrawals, searchQuery, statusFilter, dateFilter]);

  // Derived counts and volumes
  const pendingItems = useMemo(
    () => withdrawals.filter((w) => w.status === 'Pending'),
    [withdrawals]
  );
  const paidItems = useMemo(
    () => withdrawals.filter((w) => w.status === 'Paid'),
    [withdrawals]
  );

  const pendingCount = pendingItems.length;
  const paidCount = paidItems.length;

  const totalPendingAmount = useMemo(
    () => pendingItems.reduce((sum, item) => sum + item.amountNumber, 0),
    [pendingItems]
  );
  const totalPaidAmount = useMemo(
    () => paidItems.reduce((sum, item) => sum + item.amountNumber, 0),
    [paidItems]
  );

  const averagePayout = useMemo(() => {
    if (withdrawals.length === 0) return 0;
    const total = withdrawals.reduce((sum, item) => sum + item.amountNumber, 0);
    return total / withdrawals.length;
  }, [withdrawals]);

  // Copy handler
  const handleCopyDiscord = (e: React.MouseEvent, w: Withdrawal) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${w.username}${w.userId}`);
    setCopiedId(w.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Selection handlers
  const handleToggleSelect = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredWithdrawals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWithdrawals.map((w) => w.id));
    }
  };

  // Batch disbursement
  const handleBatchPaySelected = () => {
    const pendingSelected = withdrawals.filter(
      (w) => selectedIds.includes(w.id) && w.status === 'Pending'
    );
    pendingSelected.forEach((w) => onMarkAsPaid(w.id));
    setSelectedIds([]);
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Time', 'Discord Creator', 'Bank Rail', 'Account', 'Holder Name', 'Amount (USD)', 'Status', 'Transaction ID'],
      ...filteredWithdrawals.map((w) => [
        w.date,
        w.time,
        `${w.username}${w.userId}`,
        w.bank,
        w.accountLast4 ? `•••• ${w.accountLast4}` : w.email || '',
        w.accountName,
        w.amount,
        w.status,
        w.transactionId,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cliphub-withdrawals-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="section-withdrawals" className="flex flex-col space-y-5">
      {/* Metric Cards */}
      <div
        id="withdrawals-summary-cards"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
      >
        {/* Pending Card */}
        <div
          id="card-total-pending"
          className="rounded-lg border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Pending Payouts</span>
            <span className="font-mono text-[11px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              {pendingCount} requests
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              ${totalPendingAmount.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">USD</span>
          </div>
        </div>

        {/* Paid Card */}
        <div
          id="card-total-paid"
          className="rounded-lg border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Settled Volume</span>
            <span className="font-mono text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              {paidCount} settled
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              ${totalPaidAmount.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">USD</span>
          </div>
        </div>

        {/* Average Payout Card */}
        <div
          id="card-average-payout"
          className="rounded-lg border border-slate-800 bg-slate-900/70 p-4"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Average Payout</span>
            <span className="font-mono text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {withdrawals.length} total
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              ${averagePayout.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">USD / creator</span>
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div
        id="withdrawals-filter-bar"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 shadow-md backdrop-blur-md"
      >
        {/* Search & Selectors */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="input-search-withdrawals"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter creator, rail, ID, account..."
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-full pl-9 pr-7 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[130px]">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full appearance-none bg-slate-950/80 border border-slate-700/70 rounded-full px-3.5 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-500 transition-all cursor-pointer pr-8"
            >
              <option value="all">All Statuses ({withdrawals.length})</option>
              <option value="Pending">Pending ({pendingCount})</option>
              <option value="Paid">Paid ({paidCount})</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Date Filter */}
          <div className="relative min-w-[120px]">
            <select
              id="select-date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full appearance-none bg-slate-950/80 border border-slate-700/70 rounded-full px-3.5 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-500 transition-all cursor-pointer pr-8"
            >
              <option value="all">All Dates</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Action Buttons (Right Tab Controls) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedIds.length > 0 && (
            <button
              type="button"
              id="btn-batch-disburse"
              onClick={handleBatchPaySelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark {selectedIds.length} Paid</span>
            </button>
          )}

          <button
            type="button"
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-700/80 bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700/90 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Ledger Table (Desktop) */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm">
        <div className="overflow-x-auto">
          <table id="table-withdrawals-ledger" className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-medium">
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    id="checkbox-select-all"
                    checked={
                      filteredWithdrawals.length > 0 &&
                      selectedIds.length === filteredWithdrawals.length
                    }
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-slate-200 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3">Date & Time</th>
                <th className="px-3 py-3">Creator</th>
                <th className="px-3 py-3">Payment Method</th>
                <th className="px-3 py-3">Account / Holder</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-300">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-300">No withdrawal records found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => {
                  const isSelected = selectedIds.includes(w.id);
                  const isCopied = copiedId === w.id;

                  return (
                    <tr
                      key={w.id}
                      id={`withdrawal-row-${w.id}`}
                      onClick={() => setSelectedWithdrawal(w)}
                      className={`group transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-3 py-3 text-center"
                        onClick={(e) => handleToggleSelect(e, w.id)}
                      >
                        <input
                          type="checkbox"
                          id={`checkbox-row-${w.id}`}
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Select withdrawal ${w.transactionId}`}
                          className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-slate-200 cursor-pointer"
                        />
                      </td>

                      {/* Date & Time */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{w.date}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{w.time}</div>
                      </td>

                      {/* Creator */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                            {w.avatar}
                          </div>
                          <DiscordBadge username={w.username} userId={w.userId} />
                          <button
                            type="button"
                            onClick={(e) => handleCopyDiscord(e, w)}
                            title="Copy Discord handle"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Bank / Method */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <BankBadge bank={w.bank} />
                      </td>

                      {/* Account / Holder */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{w.accountName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {w.accountLast4 ? `•••• ${w.accountLast4}` : w.email || '—'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-100 text-[13px]">
                          {w.amount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {w.status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Paid
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {w.status === 'Pending' && (
                            <button
                              type="button"
                              id={`btn-mark-paid-${w.id}`}
                              onClick={() => onMarkAsPaid(w.id)}
                              className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            id={`btn-view-details-${w.id}`}
                            onClick={() => setSelectedWithdrawal(w)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="View Transaction Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (Mobile) */}
      <div className="block md:hidden space-y-3" id="withdrawals-mobile-card-list">
        {filteredWithdrawals.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            <p className="font-medium text-slate-300">No withdrawal records found</p>
            <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          filteredWithdrawals.map((w) => {
            const isCopied = copiedId === w.id;

            return (
              <div
                key={w.id}
                id={`withdrawal-card-mobile-${w.id}`}
                onClick={() => setSelectedWithdrawal(w)}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 active:bg-slate-800/70 transition-colors cursor-pointer space-y-3"
              >
                {/* Header Row: Creator, Status & Amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200 shrink-0">
                      {w.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white truncate">{w.username}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{w.userId}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{w.accountName}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-emerald-400">{w.amount}</div>
                    <div className="mt-0.5">
                      {w.status === 'Pending' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Paid
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Row: Bank, Account & Time */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <BankBadge bank={w.bank} />
                    <span className="font-mono text-[11px]">
                      {w.accountLast4 ? `•••• ${w.accountLast4}` : w.email || ''}
                    </span>
                  </div>
                  <span className="font-mono text-[10.5px] text-slate-500">
                    {w.date} · {w.time}
                  </span>
                </div>

                {/* Mobile Action Buttons */}
                <div
                  className="flex items-center gap-2 pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {w.status === 'Pending' && (
                    <button
                      type="button"
                      id={`btn-mobile-pay-${w.id}`}
                      onClick={() => onMarkAsPaid(w.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white transition-all cursor-pointer shadow-sm min-h-[44px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Execute Payout ({w.amount})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    id={`btn-mobile-details-${w.id}`}
                    onClick={() => setSelectedWithdrawal(w)}
                    className="px-3 py-2.5 rounded-lg border border-slate-700/80 bg-slate-800/80 text-slate-300 hover:text-white text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      <WithdrawalDetailsModal
        withdrawal={selectedWithdrawal}
        onClose={() => setSelectedWithdrawal(null)}
        onMarkAsPaid={onMarkAsPaid}
      />
    </div>
  );
};
