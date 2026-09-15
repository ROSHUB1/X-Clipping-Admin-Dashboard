import React, { useState } from 'react';
import { TeamMember, DiscordUser } from '../types';
import { teamPresence } from '../lib/presenceService';
import {
  Users,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Activity,
  Trash2,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface TeamSectionProps {
  currentUser: DiscordUser | null;
  teamMembers: TeamMember[];
  onOpenDiscordModal: () => void;
  onAddTeamMember?: (member: TeamMember) => void;
  onRemoveTeamMember?: (id: string) => void;
}

export const TeamSection: React.FC<TeamSectionProps> = ({
  currentUser,
  teamMembers,
  onOpenDiscordModal,
  onAddTeamMember,
  onRemoveTeamMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberHandle, setNewMemberHandle] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Reviewer');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = () => {
    setIsSyncing(true);
    teamPresence.forceSync();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Filter members
  const filteredMembers = teamMembers.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q) ||
      (m.role && m.role.toLowerCase().includes(q)) ||
      (m.discordTag && m.discordTag.toLowerCase().includes(q))
    );
  });

  const onlineCount = teamMembers.filter((m) => m.isOnline).length;

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      name: newMemberName.trim(),
      username: newMemberHandle.trim().replace('@', '') || newMemberName.toLowerCase().replace(/\s+/g, '_'),
      discordTag: newMemberHandle.includes('#') ? newMemberHandle : `@${newMemberHandle.replace('@', '') || newMemberName.toLowerCase()}`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newMemberName)}`,
      role: newMemberRole,
      isOnline: true,
      lastSeen: Date.now(),
      lastSeenText: 'Active now',
      activeTask: 'Reviewing queue',
    };

    if (onAddTeamMember) {
      onAddTeamMember(newMember);
    }
    setNewMemberName('');
    setNewMemberHandle('');
    setIsAddModalOpen(false);
  };

  return (
    <div id="team-moderation-section" className="space-y-6 animate-fadeIn">
      {/* Top Banner with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0d1322] via-[#0f172a] to-[#0c101d] border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Moderation Team & Reviewers
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} Online Now
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized reviewers managing payout disbursements and video campaign audits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-xs backdrop-blur-md ${
              isSyncing
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/70 hover:border-slate-600'
            }`}
            title="Force refresh live peer presence across all devices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Peers'}</span>
          </button>

          {!currentUser && (
            <button
              type="button"
              onClick={onOpenDiscordModal}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#3c45a5] text-white text-xs font-semibold shadow-md shadow-[#5865F2]/20 transition-all active:scale-98 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.49,0,11.6,5.77,11.49,12.74C53.92,60,48.82,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.6,5.77,11.48,12.74C96.17,60,91.07,65.69,84.69,65.69Z" />
              </svg>
              <span>Connect Discord</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 shadow-md backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search moderator name, role, handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/70 rounded-full text-xs text-white placeholder-slate-500 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50 transition-all"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800/80">
          <span>Showing <strong className="text-white font-mono">{filteredMembers.length}</strong> team members</span>
        </div>
      </div>

      {/* Grid of Team Cards */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <Users className="w-7 h-7 opacity-70" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Team Members Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5">
            When you and your team login via Discord, your profiles, avatars, and live online presences will automatically appear here!
          </p>
          <div className="flex items-center gap-3">
            {!currentUser && (
              <button
                type="button"
                onClick={onOpenDiscordModal}
                className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold shadow-lg transition-all"
              >
                Connect Your Discord
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              + Add Member Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isCurrent = currentUser && (currentUser.username === member.username || `discord_${currentUser.id}` === member.id);

            return (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#141b30] to-[#0c101d] border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-indigo-950/30 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Header: Avatar, Name, Role */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700/80 bg-slate-950"
                        />
                        {member.isOnline ? (
                          <span
                            className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center"
                            title="Online Active"
                          >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-slate-900" />
                          </span>
                        ) : (
                          <span
                            className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-slate-600 ring-2 ring-slate-900"
                            title="Offline"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-white truncate">
                            {member.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8ea1ff] font-mono mt-0.5 truncate">
                          {member.discordTag || `@${member.username}`}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border ${
                        member.role === 'Lead Reviewer' || member.role === 'Admin'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                          : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>

                  {/* Status / Activity info */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 text-[11.5px]">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        Active Task:
                      </span>
                      <span className="font-medium text-slate-200 truncate max-w-[140px]">
                        {member.activeTask || 'Active on Dashboard'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 text-[11.5px]">
                        <Radio className={`w-3.5 h-3.5 ${member.isOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
                        Presence:
                      </span>
                      <span className={`font-mono text-[11px] ${member.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {member.isOnline ? '● Online & Reviewing' : '○ Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: #{member.id.replace('member_', '').replace('discord_', '').slice(-4)}
                  </span>

                  {onRemoveTeamMember && !isCurrent && (
                    <button
                      type="button"
                      onClick={() => onRemoveTeamMember(member.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to Add Team Member */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f1422] p-5 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Add Reviewer / Team Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full / Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Mark"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Discord Tag / Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. @johnmark o johnmark#1234"
                  value={newMemberHandle}
                  onChange={(e) => setNewMemberHandle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Reviewer">Reviewer</option>
                  <option value="Lead Reviewer">Lead Reviewer</option>
                  <option value="Payout Moderator">Payout Moderator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
