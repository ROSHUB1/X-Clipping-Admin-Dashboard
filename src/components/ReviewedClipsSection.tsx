import React, { useState, useMemo } from 'react';
import { ReviewedClip, ReviewedTabFilter } from '../types';
import { PlatformBadge } from './BrandBadges';
import {
  CheckCircle2,
  XCircle,
  Search,
  LayoutGrid,
  List,
  Copy,
  Check,
  X,
  Play,
  Eye,
  Film,
  ExternalLink,
  Clock,
  RotateCcw,
  Download,
  ChevronDown,
} from 'lucide-react';
import { getDefaultThumbnail, getEmbedUrl, SAMPLE_PLAYABLE_VIDEOS } from '../utils/videoUtils';

interface ReviewedClipsSectionProps {
  reviewedClips: ReviewedClip[];
}

export const ReviewedClipsSection: React.FC<ReviewedClipsSectionProps> = ({
  reviewedClips,
}) => {
  const [clipTab, setClipTab] = useState<ReviewedTabFilter>('approved');
  const [selectedReviewedClip, setSelectedReviewedClip] = useState<ReviewedClip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPlayingDetail, setIsPlayingDetail] = useState(false);

  const campaignsList = useMemo(() => {
    const set = new Set<string>();
    reviewedClips.forEach((c) => set.add(c.campaign));
    return Array.from(set);
  }, [reviewedClips]);

  const filteredClips = useMemo(() => {
    return reviewedClips.filter((c) => {
      const matchesTab = c.status === clipTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q) ||
        c.clipId.toLowerCase().includes(q);
      const matchesCampaign = selectedCampaign === 'all' || c.campaign === selectedCampaign;

      return matchesTab && matchesSearch && matchesCampaign;
    });
  }, [reviewedClips, clipTab, searchQuery, selectedCampaign]);

  const approvedCount = useMemo(
    () => reviewedClips.filter((c) => c.status === 'approved').length,
    [reviewedClips]
  );
  const rejectedCount = useMemo(
    () => reviewedClips.filter((c) => c.status === 'rejected').length,
    [reviewedClips]
  );

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const activeEmbedInfo = selectedReviewedClip
    ? getEmbedUrl(selectedReviewedClip.videoUrl, selectedReviewedClip.platform, selectedReviewedClip.rawVideoUrl)
    : null;
  const activeThumbnail = selectedReviewedClip
    ? selectedReviewedClip.thumbnailUrl || getDefaultThumbnail(selectedReviewedClip.platform, selectedReviewedClip.id)
    : '';
  const fallbackSampleVideo = selectedReviewedClip
    ? SAMPLE_PLAYABLE_VIDEOS[Math.abs(selectedReviewedClip.id) % SAMPLE_PLAYABLE_VIDEOS.length]
    : '';

  return (
    <div id="section-reviewed-clips" className="flex flex-col space-y-5">
      {/* Tab Segmented Control */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div id="reviewed-tabs-bar" className="flex items-center p-1 bg-slate-900/90 border border-slate-800/90 rounded-full shadow-sm backdrop-blur-md">
          <button
            type="button"
            id="tab-btn-approved"
            onClick={() => setClipTab('approved')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              clipTab === 'approved'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Approved Bounties</span>
            <span className="font-mono text-[11px] bg-slate-950/80 px-2 py-0.5 rounded-full text-emerald-300 font-medium border border-slate-800">
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            id="tab-btn-rejected"
            onClick={() => setClipTab('rejected')}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              clipTab === 'rejected'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected Submissions</span>
            <span className="font-mono text-[11px] bg-slate-950/80 px-2 py-0.5 rounded-full text-rose-300 font-medium border border-slate-800">
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* View Mode Toggle (Right Tab) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center bg-slate-900/90 border border-slate-800/90 rounded-full p-1 shadow-sm backdrop-blur-md">
            <button
              type="button"
              id="view-mode-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="view-mode-table"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3 shadow-md backdrop-blur-md">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            id="input-search-reviewed"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviewed items by title, creator, or ID..."
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

        {/* Campaign filter */}
        <div className="relative min-w-[160px]">
          <select
            id="select-campaign-reviewed-filter"
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full appearance-none bg-slate-950/80 border border-slate-700/70 rounded-full px-3.5 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-500 transition-all cursor-pointer pr-8"
          >
            <option value="all">All Campaigns ({campaignsList.length})</option>
            {campaignsList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Content Rendering: Grid or Table */}
      {filteredClips.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <p className="font-medium text-slate-200">No records found</p>
          <p className="text-xs text-slate-400 mt-1">No items match your search or filter criteria.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredClips.map((clip) => {
            const isCopied = copiedId === clip.clipId;
            const noteText = clip.reviewerNotes || clip.rejectionReason || 'No notes attached.';
            const thumb = clip.thumbnailUrl || getDefaultThumbnail(clip.platform, clip.id);

            return (
              <div
                key={clip.id}
                id={`reviewed-clip-card-${clip.id}`}
                onClick={() => {
                  setSelectedReviewedClip(clip);
                  setIsPlayingDetail(false);
                }}
                className="group flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/90 p-3 hover:border-slate-700 transition-colors cursor-pointer"
              >
                {/* Visible Landscape Thumbnail */}
                <div className="relative aspect-video w-full rounded-md overflow-hidden bg-slate-950 mb-2.5 border border-slate-800 group/thumb">
                  <img
                    src={thumb}
                    alt={clip.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/95 text-slate-900 shadow-md transition-transform group-hover/thumb:scale-110">
                      <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute top-2 left-2">
                    <PlatformBadge platform={clip.platform} />
                  </div>

                  <div className="absolute top-2 right-2">
                    {clip.status === 'approved' ? (
                      <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/90 border border-emerald-800/60 px-2 py-0.5 rounded">
                        {clip.amount}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-rose-300 bg-rose-950/90 border border-rose-800/60 px-2 py-0.5 rounded">
                        Rejected
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 font-mono text-[10px] bg-black/80 px-1.5 py-0.5 rounded text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {clip.duration || '0:30'}
                  </div>
                </div>

                {/* Campaign Tag */}
                <div className="mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300 text-[10px] font-medium truncate max-w-full">
                    <Film className="w-2.5 h-2.5 shrink-0 text-indigo-400" />
                    <span className="truncate">{clip.campaign}</span>
                  </span>
                </div>

                {/* Title & Metadata */}
                <div className="space-y-1 mb-2.5">
                  <h3 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-white transition-colors">
                    {clip.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-300">{clip.creator}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                        {clip.clipId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(e, clip.clipId)}
                        title="Copy clip ID"
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auditor Note & Reviewer Attribution Footer */}
                <div className="rounded bg-slate-950/60 border border-slate-800/80 p-2 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span>Audit Note</span>
                    <span className="font-mono">{clip.reviewedDate || clip.date}</span>
                  </div>
                  <p className="line-clamp-2 text-slate-300 italic">&ldquo;{noteText}&rdquo;</p>

                  {/* Who Handled This Review */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/60 text-[10.5px]">
                    <img
                      src={
                        clip.reviewedBy?.avatarUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
                      }
                      alt={clip.reviewedBy?.name || 'Reviewer'}
                      className="w-4 h-4 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <span className="text-slate-300 font-medium truncate">
                      {clip.status === 'approved' ? (
                        <span className="text-emerald-400 font-semibold">{clip.reviewedBy?.name || 'Xynzei'} approved this</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">{clip.reviewedBy?.name || 'Xynzei'} rejected this</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-medium">
                  <th className="px-3 py-3">Audit Date</th>
                  <th className="px-3 py-3">Clip & Campaign</th>
                  <th className="px-3 py-3">Creator</th>
                  <th className="px-3 py-3">Platform</th>
                  <th className="px-3 py-3">Bounty / Status</th>
                  <th className="px-3 py-3">Review Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {filteredClips.map((clip) => (
                  <tr
                    key={clip.id}
                    onClick={() => {
                      setSelectedReviewedClip(clip);
                      setIsPlayingDetail(false);
                    }}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {clip.reviewedDate || clip.date}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-200 line-clamp-1">{clip.title}</div>
                      <div className="text-[11px] text-slate-400">{clip.campaign}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-200">
                      {clip.creator}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <PlatformBadge platform={clip.platform} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {clip.status === 'approved' ? (
                        <span className="font-mono font-semibold text-emerald-400">
                          {clip.amount}
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium">Rejected</span>
                      )}
                    </td>
                    <td className="px-3 py-3 max-w-xs truncate text-slate-400">
                      {clip.reviewerNotes || clip.rejectionReason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Playable Detail Dialog for Reviewed Clip */}
      {selectedReviewedClip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setSelectedReviewedClip(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl overflow-y-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {selectedReviewedClip.status === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span className="text-sm font-semibold">
                  {selectedReviewedClip.status === 'approved' ? 'Approved Bounty Record' : 'Rejected Submission Record'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewedClip(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Playable Video Player in Details */}
            <div className="py-3.5 space-y-3">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                {isPlayingDetail ? (
                  activeEmbedInfo?.type === 'youtube' ? (
                    <iframe
                      src={activeEmbedInfo.src}
                      title={selectedReviewedClip.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : activeEmbedInfo?.type === 'tiktok' ? (
                    <iframe
                      src={activeEmbedInfo.src}
                      title={selectedReviewedClip.title}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <video
                      src={activeEmbedInfo?.src || fallbackSampleVideo}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div
                    className="relative w-full h-full cursor-pointer group"
                    onClick={() => setIsPlayingDetail(true)}
                  >
                    <img
                      src={activeThumbnail}
                      alt={selectedReviewedClip.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 shadow-xl transition-transform group-hover:scale-110">
                        <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Open URL & Download Actions */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                  {(selectedReviewedClip.downloadUrl || selectedReviewedClip.rawVideoUrl || selectedReviewedClip.videoUrl) && (
                    <a
                      href={
                        selectedReviewedClip.downloadUrl ||
                        (selectedReviewedClip.rawVideoUrl
                          ? `/api/download-video?url=${encodeURIComponent(selectedReviewedClip.rawVideoUrl)}&filename=${encodeURIComponent(selectedReviewedClip.clipId + '.mp4')}`
                          : `/api/download-video?url=${encodeURIComponent(selectedReviewedClip.videoUrl || '')}&filename=${encodeURIComponent(selectedReviewedClip.clipId + '.mp4')}`)
                      }
                      download={`${selectedReviewedClip.clipId}.mp4`}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500/50 text-[10px] font-semibold transition-colors shadow-xs"
                      title="Instant Download Video"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  )}
                  {selectedReviewedClip.videoUrl && (
                    <a
                      href={selectedReviewedClip.videoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Original Link</span>
                    </a>
                  )}
                  {isPlayingDetail && (
                    <button
                      type="button"
                      onClick={() => setIsPlayingDetail(false)}
                      className="p-1 rounded bg-black/80 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
                      title="Return to Thumbnail"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Metadata */}
              <div>
                <span className="text-slate-400 block mb-0.5 text-xs">Submission Title</span>
                <p className="text-sm font-semibold text-white">{selectedReviewedClip.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Creator</span>
                  <p className="font-semibold text-slate-200">{selectedReviewedClip.creator}</p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Campaign</span>
                  <p className="text-slate-200">{selectedReviewedClip.campaign}</p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Bounty Payout</span>
                  <p className="font-mono font-bold text-emerald-400">{selectedReviewedClip.amount || '$0.00'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Reviewed Date</span>
                  <p className="text-slate-200">{selectedReviewedClip.reviewedDate || selectedReviewedClip.date}</p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 mt-2 text-xs space-y-2">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1 font-medium">
                    {selectedReviewedClip.status === 'approved' ? 'Auditor Notes & Breakdown' : 'Reason for Rejection'}
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {selectedReviewedClip.reviewerNotes || selectedReviewedClip.rejectionReason || 'No notes provided.'}
                  </p>
                </div>

                {/* Assigned Reviewer Tag */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Handled By:</span>
                  <div className="flex items-center gap-1.5">
                    <img
                      src={
                        selectedReviewedClip.reviewedBy?.avatarUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
                      }
                      alt={selectedReviewedClip.reviewedBy?.name || 'Reviewer'}
                      className="w-4 h-4 rounded-full object-cover border border-slate-700"
                    />
                    <span className="text-xs font-semibold text-white">
                      {selectedReviewedClip.reviewedBy?.name || 'Xynzei'}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      ({selectedReviewedClip.reviewedBy?.discordTag || '@xynzei'})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReviewedClip(null)}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
