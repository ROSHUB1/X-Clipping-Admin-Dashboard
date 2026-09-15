import React, { useState, useMemo, useEffect } from 'react';
import {
  AdminSection,
  Withdrawal,
  CampaignGroup,
  ReviewedClip,
  ClipToReview,
  ToastMessage,
  BankType,
} from './types';
import {
  INITIAL_WITHDRAWALS,
  INITIAL_CAMPAIGN_GROUPS,
  INITIAL_REVIEWED_CLIPS,
  INITIAL_TEAM_MEMBERS,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WithdrawalsSection } from './components/WithdrawalsSection';
import { ClipsToReviewSection } from './components/ClipsToReviewSection';
import { ReviewedClipsSection } from './components/ReviewedClipsSection';
import { TeamSection } from './components/TeamSection';
import { BackgroundMotion } from './components/BackgroundMotion';
import { ToastContainer } from './components/Toast';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AddUserModal } from './components/AddUserModal';
import { SubmitClipModal } from './components/SubmitClipModal';
import { BottomNavBar } from './components/BottomNavBar';
import { DiscordAuthModal } from './components/DiscordAuthModal';
import { DiscordUser, TeamMember } from './types';
import { teamPresence } from './lib/presenceService';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation State
  const [activeSection, setActiveSection] = useState<AdminSection>('withdrawals');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Command Palette & Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitClipOpen, setIsSubmitClipOpen] = useState(false);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);

  // Active Discord / Reviewer Identity (null if not logged in yet)
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(() => {
    try {
      const saved = localStorage.getItem('cliphub_active_reviewer');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });

  // Core Data States
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(INITIAL_WITHDRAWALS);
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>(INITIAL_CAMPAIGN_GROUPS);
  const [reviewedClips, setReviewedClips] = useState<ReviewedClip[]>(INITIAL_REVIEWED_CLIPS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('cliphub_team_members');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TEAM_MEMBERS;
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Heartbeat ping when user is logged in
  useEffect(() => {
    // Check if redirected directly with Discord code or token in search/hash (for Netlify/Vercel SPAs)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const discordCode = urlParams.get('code');
      const discordToken = hashParams.get('access_token');

      if (discordToken) {
        // Fetch user profile with client access token
        fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${discordToken}` },
        })
          .then((r) => r.json())
          .then((discordUser) => {
            if (discordUser?.id) {
              const avatarUrl = discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
                : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0', 10) % 5}.png`;
              const userObj: DiscordUser = {
                id: `discord_${discordUser.id}`,
                username: discordUser.username,
                globalName: discordUser.global_name || discordUser.username,
                discordTag:
                  discordUser.discriminator && discordUser.discriminator !== '0'
                    ? `${discordUser.username}#${discordUser.discriminator}`
                    : `@${discordUser.username}`,
                avatarUrl,
                email: discordUser.email || '',
                role: 'Reviewer',
              };
              handleDiscordLoginSuccess(userObj);
              // Clean up URL without reload
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      } else if (discordCode && !currentUser) {
        // Exchange code via server API if available
        fetch(`/api/auth/discord/exchange?code=${encodeURIComponent(discordCode)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && data?.user) {
              handleDiscordLoginSuccess(data.user);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      }
    } catch {}

    if (!currentUser) return;

    // Sync active user presence to shared relay
    teamPresence.setUser(currentUser);

    const pingHeartbeat = () => {
      fetch('/api/team/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          name: currentUser.globalName || currentUser.username,
          username: currentUser.username,
          discordTag: currentUser.discordTag,
          avatarUrl: currentUser.avatarUrl,
          role: currentUser.role || 'Reviewer',
          activeTask: `Active in ${activeSection}`,
        }),
      }).catch(() => {});
    };

    pingHeartbeat();
    const heartbeatInterval = setInterval(pingHeartbeat, 15000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [currentUser, activeSection]);

  // Real-time listener for team presence updates from peers / server
  useEffect(() => {
    // 1. Subscribe to local BroadcastChannel and roster updates
    const unsubscribe = teamPresence.subscribe((members) => {
      if (members && members.length > 0) {
        setTeamMembers(members);
      }
    });

    // 2. Poll server every 8 seconds to get freshly logged in reviewers
    const fetchServerTeam = () => {
      fetch('/api/team/members')
        .then((r) => r.json())
        .then((data) => {
          if (data?.success && Array.isArray(data?.members)) {
            data.members.forEach((m: TeamMember) => {
              teamPresence.upsertMember(m);
            });
          }
        })
        .catch(() => {});
    };

    fetchServerTeam();
    const pollInterval = setInterval(fetchServerTeam, 8000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const handleDiscordLoginSuccess = (user: DiscordUser) => {
    setCurrentUser(user);
    localStorage.setItem('cliphub_active_reviewer', JSON.stringify(user));

    // Announce to global presence relay
    teamPresence.setUser(user);

    // Also ensure the logged-in Discord user is in the team list as online
    setTeamMembers((prev) => {
      const exists = prev.find((m) => m.username === user.username || m.id === user.id);
      let updated: TeamMember[];
      if (exists) {
        updated = prev.map((m) =>
          m.username === user.username || m.id === user.id
            ? { ...m, isOnline: true, lastSeen: Date.now(), name: user.globalName || user.username, avatarUrl: user.avatarUrl }
            : m
        );
      } else {
        const newTeamMember: TeamMember = {
          id: user.id || `discord_${Date.now()}`,
          name: user.globalName || user.username,
          username: user.username,
          discordTag: user.discordTag,
          avatarUrl: user.avatarUrl,
          role: user.role || 'Reviewer',
          isOnline: true,
          lastSeen: Date.now(),
          activeTask: 'Active on Dashboard',
        };
        updated = [newTeamMember, ...prev];
      }
      localStorage.setItem('cliphub_team_members', JSON.stringify(updated));
      return updated;
    });

    addToast(
      'success',
      'Discord Connected!',
      `Logged in as ${user.globalName || user.username} (${user.discordTag || '@' + user.username}). You are now marked ONLINE 🟢.`
    );
  };

  const handleAddTeamMember = (member: TeamMember) => {
    teamPresence.upsertMember(member);
    setTeamMembers((prev) => {
      const updated = [member, ...prev.filter((m) => m.id !== member.id)];
      localStorage.setItem('cliphub_team_members', JSON.stringify(updated));
      return updated;
    });
    addToast('success', 'Member Added', `${member.name} has been added to the moderation team.`);
  };

  const handleRemoveTeamMember = (id: string) => {
    teamPresence.removeMember(id);
    setTeamMembers((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      localStorage.setItem('cliphub_team_members', JSON.stringify(updated));
      return updated;
    });
    addToast('info', 'Member Removed', 'Team member was removed from the list.');
  };

  const handleLogoutDiscord = () => {
    setCurrentUser(null);
    localStorage.removeItem('cliphub_active_reviewer');
    addToast('info', 'Disconnected', 'You have disconnected your Discord account.');
  };

  // Toast Helper
  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Derived Metrics
  const pendingCount = useMemo(
    () => withdrawals.filter((w) => w.status === 'Pending').length,
    [withdrawals]
  );
  const paidCount = useMemo(
    () => withdrawals.filter((w) => w.status === 'Paid').length,
    [withdrawals]
  );
  const totalPendingPayoutsAmount = useMemo(
    () =>
      withdrawals
        .filter((w) => w.status === 'Pending')
        .reduce((sum, item) => sum + item.amountNumber, 0),
    [withdrawals]
  );
  const totalPaidAmount = useMemo(
    () =>
      withdrawals
        .filter((w) => w.status === 'Paid')
        .reduce((sum, item) => sum + item.amountNumber, 0),
    [withdrawals]
  );

  const clipsToReviewCount = useMemo(
    () => campaignGroups.reduce((acc, group) => acc + group.clips.length, 0),
    [campaignGroups]
  );
  const reviewedCount = useMemo(() => reviewedClips.length, [reviewedClips]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '1' && !e.metaKey && !e.ctrlKey) {
        setActiveSection('withdrawals');
      } else if (e.key === '2' && !e.metaKey && !e.ctrlKey) {
        setActiveSection('clips-to-review');
      } else if (e.key === '3' && !e.metaKey && !e.ctrlKey) {
        setActiveSection('reviewed-clips');
      } else if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) {
        setIsSubmitClipOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick action: CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Username', 'User ID', 'Bank', 'Account', 'Amount', 'Status'];
    const rows = withdrawals.map((w) => [
      w.id,
      w.date,
      w.time,
      w.username,
      w.userId,
      w.bank,
      `"${w.accountNumber}"`,
      w.amount,
      w.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cliphub_withdrawals_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'CSV Exported', 'Withdrawals ledger exported to CSV successfully.');
  };

  // Quick action: Sync / Refresh
  const handleRefreshData = () => {
    addToast('info', 'Data Synchronized', 'All creator requests, feeds, and campaign clips refreshed.');
  };

  // Handler: Add User / Withdrawal Request
  const handleUserAdded = (newUser: {
    username: string;
    amount: string;
    bank: BankType;
    accountNumber: string;
  }) => {
    const numericAmount = parseFloat(newUser.amount.replace(/[^0-9.]/g, '')) || 0;
    const last4 = newUser.accountNumber.slice(-4) || '1234';
    const item: Withdrawal = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      username: newUser.username.startsWith('@') ? newUser.username : `@${newUser.username}`,
      userId: '#' + Math.floor(1000 + Math.random() * 9000),
      avatar: newUser.username.replace('@', '')[0]?.toUpperCase() || 'U',
      bank: newUser.bank,
      accountLast4: last4,
      accountName: newUser.username.replace('@', ''),
      amount: `$${numericAmount.toFixed(2)}`,
      amountNumber: numericAmount,
      status: 'Pending',
      transactionId: `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      timestamp: Date.now(),
    };

    setWithdrawals((prev) => [item, ...prev]);
    addToast('success', 'Request Created', `Added withdrawal request for ${item.username} (${item.amount}).`);
  };

  // Handler: Mark Single Withdrawal as Paid
  const handleMarkAsPaid = (id: number) => {
    const target = withdrawals.find((w) => w.id === id);
    setWithdrawals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Paid' } : item))
    );

    if (target) {
      addToast(
        'success',
        'Payout Processed',
        `Disbursed ${target.amount} to ${target.username} (${target.bank}) successfully.`
      );
    }
  };

  // Handler: Approve Clip
  const handleApproveClip = (clip: ClipToReview, amount: string, notes: string) => {
    // 1. Remove from campaign groups
    setCampaignGroups((prev) =>
      prev.map((group) => {
        if (group.campaign === clip.campaign) {
          const updatedClips = group.clips.filter((c) => c.id !== clip.id);
          return {
            ...group,
            count: updatedClips.length,
            clips: updatedClips,
          };
        }
        return group;
      })
    );

    // 2. Add to reviewed clips (approved)
    const reviewerInfo = currentUser ? {
      id: currentUser.id,
      name: currentUser.globalName || currentUser.username,
      username: currentUser.username,
      discordTag: currentUser.discordTag,
      avatarUrl: currentUser.avatarUrl,
      role: currentUser.role,
      timestamp: Date.now(),
    } : {
      id: 'reviewer_guest',
      name: 'Admin Reviewer',
      username: 'admin',
      discordTag: '@admin',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: 'Reviewer',
      timestamp: Date.now(),
    };

    const newReviewed: ReviewedClip = {
      id: Date.now(),
      title: clip.title,
      creator: clip.creator,
      campaign: clip.campaign,
      date: clip.date,
      time: clip.time,
      platform: clip.platform,
      views: clip.views,
      likes: clip.likes,
      comments: clip.comments,
      amount: amount,
      clipId: clip.clipId,
      status: 'approved',
      reviewerNotes: notes || 'Approved according to campaign standards.',
      reviewedBy: reviewerInfo,
      videoUrl: clip.videoUrl,
      rawVideoUrl: clip.rawVideoUrl,
      downloadUrl: clip.downloadUrl,
      thumbnailUrl: clip.thumbnailUrl,
      embedHtml: clip.embedHtml,
      duration: clip.duration,
      reviewedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    setReviewedClips((prev) => [newReviewed, ...prev]);

    // 3. Create a pending withdrawal for this creator
    const newWithdrawal: Withdrawal = {
      id: Date.now() + 1,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      username: clip.creator,
      userId: '#' + Math.floor(1000 + Math.random() * 9000),
      avatar: clip.creator.replace('@', '')[0]?.toUpperCase() || 'C',
      bank: 'GCash',
      accountLast4: `${Math.floor(1000 + Math.random() * 9000)}`,
      accountName: clip.creator.replace('@', ''),
      amount: amount,
      amountNumber: parseFloat(amount.replace(/[^0-9.]/g, '')) || 0,
      status: 'Pending',
      transactionId: `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      timestamp: Date.now(),
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);

    addToast(
      'success',
      'Clip Approved & Payout Queued',
      `Approved "${clip.title}" for ${clip.creator} (${amount}). Reviewed by ${reviewerInfo.name}.`
    );
  };

  // Handler: Reject Clip
  const handleRejectClip = (clip: ClipToReview, reason: string) => {
    // 1. Remove from campaign groups
    setCampaignGroups((prev) =>
      prev.map((group) => {
        if (group.campaign === clip.campaign) {
          const updatedClips = group.clips.filter((c) => c.id !== clip.id);
          return {
            ...group,
            count: updatedClips.length,
            clips: updatedClips,
          };
        }
        return group;
      })
    );

    const reviewerInfo = currentUser ? {
      id: currentUser.id,
      name: currentUser.globalName || currentUser.username,
      username: currentUser.username,
      discordTag: currentUser.discordTag,
      avatarUrl: currentUser.avatarUrl,
      role: currentUser.role,
      timestamp: Date.now(),
    } : {
      id: 'reviewer_guest',
      name: 'Admin Reviewer',
      username: 'admin',
      discordTag: '@admin',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      role: 'Reviewer',
      timestamp: Date.now(),
    };

    // 2. Add to reviewed clips (rejected)
    const newReviewed: ReviewedClip = {
      id: Date.now(),
      title: clip.title,
      creator: clip.creator,
      campaign: clip.campaign,
      date: clip.date,
      time: clip.time,
      platform: clip.platform,
      views: clip.views,
      likes: clip.likes,
      comments: clip.comments,
      amount: '$0.00',
      clipId: clip.clipId,
      status: 'rejected',
      reviewerNotes: reason || 'Quality standards or guideline mismatch.',
      reviewedBy: reviewerInfo,
      videoUrl: clip.videoUrl,
      rawVideoUrl: clip.rawVideoUrl,
      downloadUrl: clip.downloadUrl,
      thumbnailUrl: clip.thumbnailUrl,
      embedHtml: clip.embedHtml,
      duration: clip.duration,
      reviewedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    setReviewedClips((prev) => [newReviewed, ...prev]);

    addToast(
      'error',
      'Clip Rejected',
      `Rejected "${clip.title}" by ${clip.creator}. Reason: ${reason}`
    );
  };

  // Handler: Submit New Clip
  const handleSubmitClip = (newClip: {
    title: string;
    creator: string;
    campaign: string;
    platform: 'tiktok' | 'youtube' | 'instagram' | 'x' | 'facebook';
    videoUrl: string;
    views: string;
    likes: string;
    comments: string;
    suggestedPayout: string;
  }) => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const clipObj: ClipToReview = {
      id: Date.now(),
      title: newClip.title,
      creator: newClip.creator.startsWith('@') ? newClip.creator : `@${newClip.creator}`,
      campaign: newClip.campaign,
      date: formattedDate,
      time: formattedTime,
      platform: newClip.platform,
      views: newClip.views || '1.2K',
      viewsNumber: parseInt(newClip.views.replace(/[^0-9]/g, '')) || 1200,
      likes: newClip.likes || '240',
      comments: newClip.comments || '18',
      duration: '0:34',
      guidelinesFollowed: true,
      timestamp: Date.now(),
      suggestedPayout: newClip.suggestedPayout.startsWith('$')
        ? newClip.suggestedPayout
        : `$${newClip.suggestedPayout}`,
      clipId: `#CLP-${Math.floor(1000 + Math.random() * 9000)}`,
      videoUrl: newClip.videoUrl,
    };

    setCampaignGroups((prev) => {
      const existingGroupIndex = prev.findIndex((g) => g.campaign === newClip.campaign);
      if (existingGroupIndex >= 0) {
        const updated = [...prev];
        updated[existingGroupIndex] = {
          ...updated[existingGroupIndex],
          count: updated[existingGroupIndex].clips.length + 1,
          clips: [clipObj, ...updated[existingGroupIndex].clips],
        };
        return updated;
      } else {
        return [
          {
            campaign: newClip.campaign,
            count: 1,
            clips: [clipObj],
          },
          ...prev,
        ];
      }
    });

    addToast(
      'success',
      'Clip Submitted to Queue',
      `Added "${clipObj.title}" for ${clipObj.creator} under "${newClip.campaign}".`
    );
  };

  const existingCampaigns = useMemo(
    () => campaignGroups.map((g) => g.campaign),
    [campaignGroups]
  );

  return (
    <div
      id="app-root"
      className="relative min-h-screen bg-[#07090e] font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white"
    >
      {/* Background Animated Gradient Mesh */}
      <BackgroundMotion />

      {/* Main Layout Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Responsive Desktop / Collapsible Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          pendingPayoutsCount={pendingCount}
          clipsToReviewCount={clipsToReviewCount}
          reviewedCount={reviewedCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          currentUser={currentUser}
          onOpenDiscordModal={() => setIsDiscordModalOpen(true)}
        />

        {/* Primary Content Workspace - offset by sidebar width on desktop */}
        <main
          id="main-content-workspace"
          className={`flex-1 transition-all duration-300 ease-in-out pb-20 md:pb-8 p-3.5 sm:p-5 md:p-7 w-full max-w-[1700px] mx-auto ${
            isSidebarCollapsed ? 'md:pl-[84px]' : 'md:pl-[256px]'
          }`}
        >
          {/* Header Bar with Search, Refresh, Notifications, and Discord Profile */}
          <Header
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            totalPendingPayoutsAmount={totalPendingPayoutsAmount}
            totalPaidAmount={totalPaidAmount}
            pendingCount={pendingCount}
            clipsToReviewCount={clipsToReviewCount}
            reviewedCount={reviewedCount}
            onRefresh={handleRefreshData}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            currentUser={currentUser}
            onOpenDiscordModal={() => setIsDiscordModalOpen(true)}
            onLogoutDiscord={handleLogoutDiscord}
          />

          {/* Dynamic Section Render with subtle slide-fade transition */}
          <div className="flex-1 w-full overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{
                  duration: 0.22,
                  ease: [0.16, 1, 0.3, 1], // fluid cubic bezier
                }}
                className="w-full"
              >
                {activeSection === 'withdrawals' && (
                  <WithdrawalsSection
                    withdrawals={withdrawals}
                    onMarkAsPaid={handleMarkAsPaid}
                  />
                )}

                {activeSection === 'clips-to-review' && (
                  <ClipsToReviewSection
                    campaignGroups={campaignGroups}
                    currentUser={currentUser}
                    onApproveClip={handleApproveClip}
                    onRejectClip={handleRejectClip}
                    onOpenSubmitClip={() => setIsSubmitClipOpen(true)}
                  />
                )}

                {activeSection === 'reviewed-clips' && (
                  <ReviewedClipsSection reviewedClips={reviewedClips} />
                )}

                {activeSection === 'team' && (
                  <TeamSection
                    currentUser={currentUser}
                    teamMembers={teamMembers}
                    onOpenDiscordModal={() => setIsDiscordModalOpen(true)}
                    onAddTeamMember={handleAddTeamMember}
                    onRemoveTeamMember={handleRemoveTeamMember}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <BottomNavBar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        pendingPayoutsCount={pendingCount}
        clipsToReviewCount={clipsToReviewCount}
        onOpenSubmitClip={() => setIsSubmitClipOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSection={setActiveSection}
        withdrawals={withdrawals}
        campaignGroups={campaignGroups}
        reviewedClips={reviewedClips}
        onSyncData={handleRefreshData}
        onExportCSV={handleExportCSV}
        onAddNewUser={() => setIsAddUserOpen(true)}
        onOpenSubmitClip={() => setIsSubmitClipOpen(true)}
      />

      {/* Submit Clip with Campaign Modal */}
      <SubmitClipModal
        isOpen={isSubmitClipOpen}
        onClose={() => setIsSubmitClipOpen(false)}
        onSubmitClip={handleSubmitClip}
        existingCampaigns={existingCampaigns}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Discord OAuth Modal */}
      <DiscordAuthModal
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
        currentUser={currentUser}
        onDiscordLoginSuccess={handleDiscordLoginSuccess}
        onLogoutDiscord={handleLogoutDiscord}
      />

      {/* Keyboard Shortcuts Dialog (?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
