import React, { useState, useMemo } from 'react';
import { CampaignGroup, ClipToReview, DiscordUser } from '../types';
import { ReviewClipModal } from './ReviewClipModal';
import { PlatformBadge } from './BrandBadges';
import { getDefaultThumbnail } from '../utils/videoUtils';
import {
  Layers,
  Film,
  Play,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Search,
  ChevronRight,
  Upload,
} from 'lucide-react';

interface ClipsToReviewSectionProps {
  campaignGroups: CampaignGroup[];
  currentUser?: DiscordUser | null;
  onApproveClip: (clip: ClipToReview, amount: string, notes: string) => void;
  onRejectClip: (clip: ClipToReview, reason: string) => void;
  onOpenSubmitClip?: () => void;
}

export const ClipsToReviewSection: React.FC<ClipsToReviewSectionProps> = ({
  campaignGroups,
  currentUser,
  onApproveClip,
  onRejectClip,
  onOpenSubmitClip,
}) => {
  const [selectedClip, setSelectedClip] = useState<ClipToReview | null>(null);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const displayedGroups = useMemo(() => {
    let groups = selectedCampaignFilter
      ? campaignGroups.filter((g) => g.campaign === selectedCampaignFilter)
      : campaignGroups;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      groups = groups
        .map((g) => ({
          ...g,
          clips: g.clips.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.creator.toLowerCase().includes(q) ||
              c.campaign.toLowerCase().includes(q) ||
              c.clipId.toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.clips.length > 0);
    }
    return groups;
  }, [campaignGroups, selectedCampaignFilter, searchFilter]);

  const totalClipsWaiting = campaignGroups.reduce((acc, curr) => acc + curr.clips.length, 0);

  return (
    <div id="section-clips-to-review" className="flex flex-col space-y-5">
      {/* Search Header, Submit Clip Button & Campaign Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 shadow-md backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            id="input-search-clips-to-review"
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search submissions by title, creator, campaign, or ID..."
            className="w-full bg-slate-950/80 border border-slate-700/70 rounded-full pl-9 pr-7 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500/50 transition-all"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <div className="text-xs text-slate-400 font-mono bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800/80">
            <span className="font-semibold text-white">{totalClipsWaiting}</span> submissions queued
          </div>

          {onOpenSubmitClip && (
            <button
              type="button"
              id="btn-open-submit-clip"
              onClick={onOpenSubmitClip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-indigo-950/50 active:scale-98"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Clip</span>
            </button>
          )}
        </div>
      </div>

      {/* Campaign Quick Link Pills */}
      <div
        id="campaign-quick-links-grid"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          id="quick-link-all-campaigns"
          onClick={() => setSelectedCampaignFilter(null)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            selectedCampaignFilter === null
              ? 'bg-slate-800 border-slate-600 text-white shadow-xs'
              : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>All Campaigns</span>
          <span className="font-mono text-[11px] text-slate-400">
            ({totalClipsWaiting})
          </span>
        </button>

        {campaignGroups.map((group) => {
          const isSelected = selectedCampaignFilter === group.campaign;
          return (
            <button
              type="button"
              key={group.campaign}
              id={`quick-link-${group.campaign.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() =>
                setSelectedCampaignFilter(isSelected ? null : group.campaign)
              }
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200 shadow-xs'
                  : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-slate-400" />
              <span>{group.campaign}</span>
              <span className="font-mono text-[11px] text-slate-400">
                ({group.clips.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Campaign Groups */}
      <div id="campaign-review-groups-list" className="space-y-6">
        {displayedGroups.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400 space-y-3">
            <p className="font-medium text-slate-200">No submissions found</p>
            <p className="text-xs text-slate-400">
              There are no pending submissions in this queue. Submit a creator video to review.
            </p>
            {onOpenSubmitClip && (
              <button
                type="button"
                id="btn-empty-state-submit-clip"
                onClick={onOpenSubmitClip}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs mt-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Submit Video with Campaign</span>
              </button>
            )}
          </div>
        ) : (
          displayedGroups.map((group) => (
            <div
              key={group.campaign}
              id={`campaign-group-${group.campaign.toLowerCase().replace(/\s+/g, '-')}`}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-950/80 border border-indigo-800/50 text-indigo-300">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{group.campaign}</span>
                      <span className="font-mono text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2 py-0.2 rounded">
                        {group.clips.length} pending
                      </span>
                    </h2>
                    {group.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCampaignFilter(
                      selectedCampaignFilter === group.campaign ? null : group.campaign
                    )
                  }
                  className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {selectedCampaignFilter === group.campaign ? 'Show all' : 'Filter by campaign'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Clip Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3.5">
                {group.clips.map((clip) => (
                  <div
                    key={clip.id}
                    id={`clip-card-${clip.id}`}
                    className="group flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/90 p-3 hover:border-slate-700 transition-colors"
                  >
                    {/* Landscape Video Thumbnail Preview */}
                    <div
                      className="relative aspect-video w-full rounded-md overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer mb-2.5 border border-slate-800 group/thumb"
                      onClick={() => setSelectedClip(clip)}
                    >
                      <img
                        src={clip.thumbnailUrl || getDefaultThumbnail(clip.platform, clip.id)}
                        alt={clip.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                      />

                      <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/95 text-slate-900 shadow-md transition-transform group-hover/thumb:scale-110">
                          <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
                        </div>
                      </div>

                      <div className="absolute bottom-2 right-2 font-mono text-[10px] font-medium bg-black/80 px-1.5 py-0.5 rounded text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {clip.duration}
                      </div>

                      <div className="absolute top-2 left-2">
                        <PlatformBadge platform={clip.platform} />
                      </div>

                      <div className="absolute top-2 right-2 font-mono text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
                        Bounty: {clip.suggestedPayout}
                      </div>
                    </div>

                    {/* Campaign Badge Beside Video */}
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/50 text-[10px] font-medium truncate max-w-full">
                        <Film className="w-2.5 h-2.5 shrink-0 text-indigo-400" />
                        <span className="truncate">Campaign: {clip.campaign}</span>
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1 mb-2.5">
                      <h3 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-white transition-colors">
                        {clip.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-300">{clip.creator}</span>
                        <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700/60">
                          {clip.clipId}
                        </span>
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs text-slate-400 mb-3 font-mono">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{clip.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-slate-400" />
                        <span>{clip.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{clip.comments}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      type="button"
                      id={`btn-review-clip-${clip.id}`}
                      onClick={() => setSelectedClip(clip)}
                      className="w-full flex items-center justify-center gap-2 rounded-md bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer border border-slate-700/80"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Review Submission
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      <ReviewClipModal
        clip={selectedClip}
        currentUser={currentUser}
        onClose={() => setSelectedClip(null)}
        onApprove={onApproveClip}
        onReject={onRejectClip}
      />
    </div>
  );
};
