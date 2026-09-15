import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Film,
  Link2,
  User,
  DollarSign,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Sparkles,
  CheckCircle2,
  Layers,
  Loader2,
  RefreshCw,
  Play,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { PlatformBadge } from './BrandBadges';
import { ClipToReview, PlatformType } from '../types';
import { getDefaultThumbnail } from '../utils/videoUtils';

interface SubmitClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitClip: (clip: ClipToReview, campaignName: string) => void;
  existingCampaigns: string[];
}

export const SubmitClipModal: React.FC<SubmitClipModalProps> = ({
  isOpen,
  onClose,
  onSubmitClip,
  existingCampaigns,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [campaign, setCampaign] = useState(
    existingCampaigns[0] || 'Apex Legends Clips'
  );
  const [isCustomCampaign, setIsCustomCampaign] = useState(false);
  const [customCampaignName, setCustomCampaignName] = useState('');
  const [creatorHandle, setCreatorHandle] = useState('@');
  const [creatorName, setCreatorName] = useState('');
  const [title, setTitle] = useState('');
  const [views, setViews] = useState('18.5K');
  const [likes, setLikes] = useState('1.8K');
  const [comments, setComments] = useState('142');
  const [duration, setDuration] = useState('0:32');
  const [bounty, setBounty] = useState('35.00');
  const [guidelinesFollowed, setGuidelinesFollowed] = useState(true);

  // Auto-Fetch State
  const [isFetching, setIsFetching] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [rawVideoUrl, setRawVideoUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformType>('TikTok');

  // Auto detect platform from URL
  const detectPlatformFromUrl = (url: string): PlatformType => {
    const low = url.toLowerCase();
    if (low.includes('tiktok.com')) return 'TikTok';
    if (low.includes('youtube.com') || low.includes('youtu.be')) return 'YouTube';
    if (low.includes('instagram.com')) return 'Instagram';
    return 'TikTok';
  };

  // Fetch video metadata from server
  const handleFetchMetadata = useCallback(async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || videoUrl).trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setFetchError('Please enter a valid HTTP/HTTPS video URL.');
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(false);

    try {
      const detected = detectPlatformFromUrl(targetUrl);
      setPlatform(detected);

      const res = await fetch('/api/fetch-video-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: targetUrl }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        if (data.title) setTitle(data.title);
        if (data.authorHandle) setCreatorHandle(data.authorHandle);
        if (data.authorName) setCreatorName(data.authorName);
        if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl);
        if (data.rawVideoUrl) setRawVideoUrl(data.rawVideoUrl);
        if (data.downloadUrl) setDownloadUrl(data.downloadUrl);
        if (data.views) setViews(data.views);
        if (data.likes) setLikes(data.likes);
        if (data.comments) setComments(data.comments);
        if (data.duration) setDuration(data.duration);
        if (data.suggestedPayout) {
          setBounty(data.suggestedPayout.replace('$', ''));
        }
        if (data.platform) setPlatform(data.platform);

        setFetchSuccess(true);
        setFetchError(null);
      } else {
        setFetchError(json.error || 'Could not auto-fetch video details.');
      }
    } catch (err: any) {
      // Fallback local extraction
      const detected = detectPlatformFromUrl(targetUrl);
      setPlatform(detected);
      setFetchError('Server fetch offline, auto-extracted basic parameters.');
    } finally {
      setIsFetching(false);
    }
  }, [videoUrl]);

  // Quick Sample Links for instant testing
  const handleSelectSample = (sampleUrl: string, sampleCampaign: string) => {
    setVideoUrl(sampleUrl);
    setCampaign(sampleCampaign);
    handleFetchMetadata(sampleUrl);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetCampaign = isCustomCampaign
      ? customCampaignName.trim() || 'General Community Clips'
      : campaign;

    const cleanCreator = creatorHandle.trim().startsWith('@')
      ? creatorHandle.trim()
      : `@${creatorHandle.trim()}`;

    const numViews = parseInt(views.replace(/[^0-9]/g, ''), 10) || 18000;
    const viewsStr = views.trim() || '18.0K';

    const assignedThumb = thumbnailUrl || getDefaultThumbnail(platform, Date.now());

    const newClip: ClipToReview = {
      id: Date.now(),
      title: title.trim() || 'Creator Campaign Highlight Clip',
      creator: cleanCreator,
      creatorName: creatorName.trim() || cleanCreator.replace('@', ''),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      platform: platform,
      views: viewsStr,
      viewsNumber: numViews,
      likes: likes.trim() || `${Math.round(numViews * 0.12).toLocaleString()}`,
      comments: comments.trim() || `${Math.round(numViews * 0.015).toLocaleString()}`,
      campaign: targetCampaign,
      duration: duration.trim() || '0:30',
      clipId: 'CLP-' + Math.floor(10000000 + Math.random() * 90000000),
      suggestedPayout: `$${parseFloat(bounty || '0').toFixed(2)}`,
      videoDescription: `Submitted for campaign "${targetCampaign}" via auto-fetch submission portal. Source URL: ${videoUrl || 'Direct Upload'}`,
      videoUrl: videoUrl.trim() || undefined,
      rawVideoUrl: rawVideoUrl || undefined,
      downloadUrl: downloadUrl || undefined,
      thumbnailUrl: assignedThumb,
      guidelinesFollowed,
      timestamp: Date.now(),
    };

    onSubmitClip(newClip, targetCampaign);
    onClose();
  };

  return (
    <div
      id="submit-clip-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="submit-clip-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg my-8 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-200 animate-fadeIn"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Submit Video to Review Queue</h3>
              <p className="text-[11px] text-slate-400">
                Paste any video link to auto-fetch creator, title, metrics, and tag campaign.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target Campaign Selection (Prominently Beside/Above Video) */}
          <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                Target Campaign
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCampaign(!isCustomCampaign)}
                className="text-[11px] text-indigo-300 hover:underline cursor-pointer font-medium"
              >
                {isCustomCampaign ? 'Choose Existing' : '+ New Campaign'}
              </button>
            </div>

            {!isCustomCampaign ? (
              <select
                id="select-submission-campaign"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs font-medium"
              >
                {existingCampaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {existingCampaigns.length === 0 && (
                  <>
                    <option value="Apex Legends Clips">Apex Legends Clips</option>
                    <option value="Summer Gaming Festival">Summer Gaming Festival</option>
                    <option value="Valorant Highlights">Valorant Highlights</option>
                  </>
                )}
              </select>
            ) : (
              <input
                id="input-custom-campaign"
                type="text"
                required
                value={customCampaignName}
                onChange={(e) => setCustomCampaignName(e.target.value)}
                placeholder="e.g. Fall Guys Creator Challenge"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500 text-xs"
              />
            )}

            <div className="flex items-center gap-2 text-[11px] text-indigo-200/80">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-900/50 border border-indigo-700/50 font-mono text-[10px] text-indigo-300">
                <Layers className="w-3 h-3" />
                Campaign Badge: {isCustomCampaign ? (customCampaignName || 'New Campaign') : campaign}
              </span>
              <span>will be linked to this submission</span>
            </div>
          </div>

          {/* Video URL Input + Auto Fetch Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="input-submission-url" className="text-slate-300 font-medium flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                Video Link (TikTok / YouTube Shorts / Instagram Reels)
              </label>
              <PlatformBadge platform={platform} />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="input-submission-url"
                type="url"
                required
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setFetchSuccess(false);
                  setFetchError(null);
                }}
                placeholder="https://www.tiktok.com/@creator/video/72019482710..."
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono text-xs"
              />
              <button
                type="button"
                id="btn-auto-fetch-metadata"
                disabled={isFetching || !videoUrl.trim()}
                onClick={() => handleFetchMetadata()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold transition-colors cursor-pointer text-xs shrink-0"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Auto-Fetch</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Links for Fast Testing */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
              <span className="text-slate-500">Quick Test:</span>
              <button
                type="button"
                onClick={() =>
                  handleSelectSample(
                    'https://www.tiktok.com/@apexlegends/video/7192847291827461930',
                    'Apex Legends Clips'
                  )
                }
                className="text-indigo-400 hover:underline hover:text-indigo-300 cursor-pointer"
              >
                TikTok Sample
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() =>
                  handleSelectSample(
                    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
                    'Valorant Highlights'
                  )
                }
                className="text-indigo-400 hover:underline hover:text-indigo-300 cursor-pointer"
              >
                YouTube Short
              </button>
            </div>

            {/* Fetch Status Feedback */}
            {fetchSuccess && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Link metadata successfully fetched and synced!</span>
              </div>
            )}

            {fetchError && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{fetchError}</span>
              </div>
            )}
          </div>

          {/* Fetched Thumbnail / Video Preview (if available) */}
          {thumbnailUrl && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center">
              <img
                src={thumbnailUrl}
                alt="Video Thumbnail"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5">
                <div className="flex items-center justify-between">
                  <PlatformBadge platform={platform} />
                  <span className="font-mono text-[10px] bg-black/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
                    Bounty: ${bounty}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300 text-[11px] font-mono">
                  <span>{views} views</span>
                  <span>{duration}</span>
                </div>
              </div>
            </div>
          )}

          {/* Video Title */}
          <div className="space-y-1.5">
            <label htmlFor="input-submission-title" className="text-slate-300 font-medium">
              Video Title / Hook
            </label>
            <input
              id="input-submission-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 1v4 Squad Wipe with Kraber Sniper"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-slate-500 text-xs"
            />
          </div>

          {/* Creator Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="input-submission-creator" className="text-slate-300 font-medium flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Creator Handle
              </label>
              <input
                id="input-submission-creator"
                type="text"
                required
                value={creatorHandle}
                onChange={(e) => setCreatorHandle(e.target.value)}
                placeholder="@username"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-slate-500 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="input-submission-name" className="text-slate-300 font-medium">
                Creator Full Name
              </label>
              <input
                id="input-submission-name"
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-slate-500 text-xs"
              />
            </div>
          </div>

          {/* Real Metrics & Suggested Bounty */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" />
                Real Views
              </label>
              <input
                type="text"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                placeholder="25.4K"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" />
                Likes
              </label>
              <input
                type="text"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                placeholder="2.1K"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-amber-400" />
                Comments
              </label>
              <input
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="145"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="0:45"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono text-xs"
              />
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="text-slate-400 text-[11px] flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Bounty ($)
              </label>
              <input
                type="number"
                step="5"
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                placeholder="35.00"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-white font-mono text-xs"
              />
            </div>
          </div>

          {/* Guidelines Checkbox */}
          <label className="flex items-center gap-2 pt-1 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={guidelinesFollowed}
              onChange={(e) => setGuidelinesFollowed(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-indigo-500 cursor-pointer"
            />
            <span className="text-[11px]">Video follows campaign hashtag & watermark guidelines</span>
          </label>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-submit-clip"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer text-xs shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit to Review Queue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
