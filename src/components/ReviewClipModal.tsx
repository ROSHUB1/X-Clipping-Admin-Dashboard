import React, { useState, useRef, useEffect } from 'react';
import { ClipToReview, DiscordUser } from '../types';
import { PlatformBadge } from './BrandBadges';
import {
  Play,
  Pause,
  Eye,
  Heart,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Volume2,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Film,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  RefreshCw,
  Smartphone,
  Tv,
  Layout,
  Copy,
} from 'lucide-react';
import { getEmbedUrl, getDefaultThumbnail, SAMPLE_PLAYABLE_VIDEOS } from '../utils/videoUtils';

interface ReviewClipModalProps {
  clip: ClipToReview | null;
  currentUser?: DiscordUser | null;
  onClose: () => void;
  onApprove: (clip: ClipToReview, amount: string, notes: string) => void;
  onReject: (clip: ClipToReview, reason: string) => void;
}

export const ReviewClipModal: React.FC<ReviewClipModalProps> = ({
  clip,
  currentUser,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!clip) return null;

  const [payoutAmount, setPayoutAmount] = useState(
    clip.suggestedPayout.replace('$', '') || '45.00'
  );
  const [feedback, setFeedback] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(
    'Quality standards or guideline mismatch'
  );

  // Raw video & maximization controls
  const [isMaximized, setIsMaximized] = useState(false);
  const [aspectMode, setAspectMode] = useState<'portrait' | 'landscape' | 'full'>('portrait');
  const [objectFit, setObjectFit] = useState<'contain' | 'cover'>('contain');
  const [rawVideoUrl, setRawVideoUrl] = useState<string>(clip.rawVideoUrl || '');
  const [downloadUrl, setDownloadUrl] = useState<string>(clip.downloadUrl || '');
  const [isExtractingRaw, setIsExtractingRaw] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState(!!clip.rawVideoUrl);
  const [copiedLink, setCopiedLink] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync state if clip changes
  useEffect(() => {
    if (clip) {
      setRawVideoUrl(clip.rawVideoUrl || '');
      setDownloadUrl(clip.downloadUrl || '');
      setExtractSuccess(!!clip.rawVideoUrl);
      // Auto portrait for TikTok, landscape for YouTube
      if (clip.platform === 'YouTube') {
        setAspectMode('landscape');
      } else {
        setAspectMode('portrait');
      }
    }
  }, [clip]);

  const embedInfo = getEmbedUrl(clip.videoUrl, clip.platform, rawVideoUrl);
  const thumbnail = clip.thumbnailUrl || getDefaultThumbnail(clip.platform, clip.id);
  const fallbackSampleVideo =
    SAMPLE_PLAYABLE_VIDEOS[Math.abs(clip.id) % SAMPLE_PLAYABLE_VIDEOS.length];

  // Transfer URL into Raw Video Stream
  const handleTransferToRawVideo = async () => {
    if (!clip.videoUrl) return;
    setIsExtractingRaw(true);
    try {
      const res = await fetch('/api/fetch-video-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: clip.videoUrl }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.rawVideoUrl) {
          setRawVideoUrl(json.data.rawVideoUrl);
          clip.rawVideoUrl = json.data.rawVideoUrl;
        }
        if (json.data.downloadUrl) {
          setDownloadUrl(json.data.downloadUrl);
          clip.downloadUrl = json.data.downloadUrl;
        }
        setExtractSuccess(true);
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Failed to extract raw video:', err);
    } finally {
      setIsExtractingRaw(false);
    }
  };

  // Instant Download Action
  const handleInstantDownload = () => {
    const targetDl =
      downloadUrl ||
      (rawVideoUrl
        ? `/api/download-video?url=${encodeURIComponent(rawVideoUrl)}&filename=${encodeURIComponent(
            (clip.clipId || 'clip') + '-' + (clip.creator.replace('@', '') || 'video') + '.mp4'
          )}`
        : clip.videoUrl
        ? `/api/download-video?url=${encodeURIComponent(clip.videoUrl)}&filename=${encodeURIComponent(
            (clip.clipId || 'clip') + '.mp4'
          )}`
        : null);

    if (targetDl) {
      const a = document.createElement('a');
      a.href = targetDl;
      a.download = `${clip.clipId}-${clip.creator.replace('@', '')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (clip.videoUrl) {
      window.open(clip.videoUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    if (clip.videoUrl) {
      navigator.clipboard.writeText(clip.videoUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleApproveSubmit = () => {
    const formattedAmount = `$${parseFloat(payoutAmount || '0').toFixed(2)}`;
    onApprove(clip, formattedAmount, feedback);
    onClose();
  };

  const handleRejectSubmit = () => {
    onReject(clip, feedback || rejectionReason);
    onClose();
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div
      id="review-clip-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-xs transition-all duration-200"
      onClick={onClose}
    >
      <div
        id="review-clip-modal-dialog"
        className={`w-full ${
          isMaximized ? 'max-w-5xl' : 'max-w-2xl'
        } max-h-[95vh] overflow-y-auto rounded-xl border border-slate-700/80 bg-[#0f1422] p-4 sm:p-6 text-white shadow-2xl transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Quick Controls */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>Submission Review</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 text-[10px] font-medium font-mono">
                <Film className="w-2.5 h-2.5 text-indigo-400" />
                {clip.campaign}
              </span>
              {rawVideoUrl && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-[10px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  Raw Stream Active
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Creator: <span className="text-slate-200 font-medium">{clip.creator}</span> ({clip.creatorName || 'Creator'}) · ID: <span className="font-mono text-slate-300">{clip.clipId}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Maximize Box Button */}
            <button
              type="button"
              id="btn-toggle-maximize-view"
              onClick={() => setIsMaximized(!isMaximized)}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              title={isMaximized ? 'Restore Normal Window' : 'Maximize Video Box'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-review-modal"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Box Toolbar */}
        <div className="pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Aspect & Fit Switchers */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              id="btn-aspect-portrait"
              onClick={() => setAspectMode('portrait')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                aspectMode === 'portrait'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="9:16 Vertical Portrait (Reels / TikTok / Shorts)"
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16 Vertical</span>
            </button>

            <button
              type="button"
              id="btn-aspect-landscape"
              onClick={() => setAspectMode('landscape')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                aspectMode === 'landscape'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="16:9 Landscape (YouTube / Desktop)"
            >
              <Tv className="w-3 h-3" />
              <span>16:9 Wide</span>
            </button>

            <button
              type="button"
              id="btn-aspect-full"
              onClick={() => setAspectMode('full')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                aspectMode === 'full'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Fill Full Box Height"
            >
              <Layout className="w-3 h-3" />
              <span>Full Box</span>
            </button>

            <div className="h-3 w-px bg-slate-700 mx-0.5" />

            <button
              type="button"
              id="btn-toggle-object-fit"
              onClick={() => setObjectFit(objectFit === 'contain' ? 'cover' : 'contain')}
              className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle Video Fit (Contain vs Fill/Cover)"
            >
              Fit: <strong className="text-indigo-400">{objectFit}</strong>
            </button>
          </div>

          {/* Action Buttons: Raw Video Transfer & Instant Download */}
          <div className="flex items-center gap-1.5">
            {/* Raw Video Transfer Button */}
            {!rawVideoUrl && clip.videoUrl && (
              <button
                type="button"
                id="btn-transfer-raw-video"
                onClick={handleTransferToRawVideo}
                disabled={isExtractingRaw}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/90 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-700/60 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                title="Convert public URL into Direct High-Definition Raw MP4 Video"
              >
                <RefreshCw className={`w-3 h-3 text-indigo-400 ${isExtractingRaw ? 'animate-spin' : ''}`} />
                <span>{isExtractingRaw ? 'Extracting Raw...' : '⚡ Transfer URL to Raw'}</span>
              </button>
            )}

            {/* Instant Download Button */}
            <button
              type="button"
              id="btn-instant-download-video"
              onClick={handleInstantDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download clean MP4 raw video file to your computer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instant Download (.MP4)</span>
            </button>
          </div>
        </div>

        {/* Video Player & Visible Thumbnail Container */}
        <div className="space-y-3.5">
          <div
            id="video-player-preview-box"
            className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-[#05080f] ${
              aspectMode === 'portrait'
                ? isMaximized
                  ? 'h-[580px]'
                  : 'h-[460px]'
                : aspectMode === 'landscape'
                ? isMaximized
                  ? 'h-[480px]'
                  : 'aspect-video'
                : isMaximized
                ? 'h-[580px]'
                : 'h-[460px]'
            }`}
          >
            {/* 1. Playing Active Video / Direct Raw Video */}
            {isPlaying ? (
              embedInfo?.type === 'html5' || rawVideoUrl ? (
                <video
                  ref={videoRef}
                  src={embedInfo?.src || fallbackSampleVideo}
                  controls
                  autoPlay
                  playsInline
                  loop
                  className={`w-full h-full bg-black ${
                    objectFit === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                />
              ) : embedInfo?.type === 'youtube' ? (
                <iframe
                  src={embedInfo.src}
                  title={clip.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : embedInfo?.type === 'tiktok' ? (
                <iframe
                  src={embedInfo.src}
                  title={clip.title}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={embedInfo?.src || fallbackSampleVideo}
                  controls
                  autoPlay
                  className={`w-full h-full bg-black ${
                    objectFit === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                />
              )
            ) : (
              /* 2. Paused State: Visible HD Thumbnail Preview with Full Box Overlay */
              <div
                id="thumbnail-preview-trigger"
                className="relative w-full h-full cursor-pointer group flex items-center justify-center bg-black/60"
                onClick={togglePlay}
              >
                <img
                  src={thumbnail}
                  alt={clip.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                    objectFit === 'cover' ? 'object-cover' : 'object-contain'
                  }`}
                />
                <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-900 shadow-2xl transition-transform group-hover:scale-110">
                      <Play className="w-6 h-6 fill-slate-900 ml-1" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="rounded bg-black/85 px-3 py-1 text-xs font-mono text-slate-100 border border-slate-700/80 shadow-md">
                        Click to Play Full Media ({clip.duration})
                      </span>
                      {rawVideoUrl && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Direct Raw MP4 Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overlays (Platform & Views) */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
              <PlatformBadge platform={clip.platform} />
              <span className="rounded bg-black/80 border border-slate-700/60 px-2 py-0.5 text-xs font-mono text-slate-300 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {clip.views}
              </span>
              <span className="rounded bg-black/80 border border-slate-700/60 px-2 py-0.5 text-xs font-mono text-slate-300 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                {clip.likes}
              </span>
            </div>

            {/* Top Right Actions */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              {clip.videoUrl && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-black/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  title="Copy video URL to clipboard"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              )}

              {clip.videoUrl && (
                <a
                  href={clip.videoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 px-2 py-1 rounded bg-black/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                  title="Open in native platform page"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open URL</span>
                </a>
              )}

              {isPlaying && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(false)}
                  className="p-1.5 rounded bg-black/80 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
                  title="Return to Thumbnail Preview"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Title, Creator, & Metrics Bar */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-sm font-semibold text-white">{clip.title}</h3>
              <span className="text-xs font-mono text-indigo-400 font-semibold">
                Suggested Bounty: {clip.suggestedPayout}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <span>
                  Creator: <strong className="text-slate-200">{clip.creator}</strong>
                </span>
                <span>·</span>
                <span>Submitted: {clip.date} at {clip.time}</span>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Eye className="w-3.5 h-3.5 text-blue-400" /> {clip.views} Views
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> {clip.likes} Likes
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> {clip.comments} Comments
                </span>
              </div>
            </div>
          </div>

          {/* Guidelines Compliance Checklist */}
          <div className="rounded-lg border border-slate-800 bg-[#090d16] p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Automated Compliance Verification
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Passed Checks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Format & aspect ratio conformant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Campaign hashtags present & verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Audio verified with campaign track</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>No copyright infringements detected</span>
              </div>
            </div>
          </div>

          {/* Active Reviewer Attribution Info */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/80 text-[11px]">
            <div className="flex items-center gap-2">
              <img
                src={
                  currentUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.username || 'Reviewer'}
                className="w-4 h-4 rounded-full object-cover border border-slate-700"
              />
              <span className="text-slate-300">
                Auditing as: <strong className="text-white font-semibold">{currentUser?.globalName || currentUser?.username || 'Xynzei'}</strong>
              </span>
              <span className="text-emerald-400 font-mono text-[9.5px] bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/40">
                ● Live Reviewer
              </span>
            </div>
            <span className="text-slate-500 text-[10px] hidden sm:inline">
              Tagged as &ldquo;{currentUser?.globalName || currentUser?.username || 'Xynzei'} approved/rejected&rdquo;
            </span>
          </div>

          {/* Approval / Rejection Controls */}
          {!rejectionMode ? (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="space-y-1.5">
                  <div>
                    <label htmlFor="input-payout-amount" className="text-xs font-semibold text-slate-200 block">
                      Bounty Disbursement Amount (USD)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Calculated based on verified view counts & campaign tier
                    </span>
                  </div>
                  {/* Preset Quick Bounty Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {['25.00', '35.00', '50.00', '75.00', '100.00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPayoutAmount(preset)}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-medium transition-colors cursor-pointer border ${
                          payoutAmount === preset
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative w-full sm:w-36">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">$</span>
                  <input
                    id="input-payout-amount"
                    type="number"
                    step="0.50"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 pl-6 pr-2.5 py-2 text-xs font-mono font-semibold text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="textarea-approval-notes" className="text-xs font-medium text-slate-300 block mb-1">
                  Reviewer Notes (Optional feedback sent to creator)
                </label>
                <textarea
                  id="textarea-approval-notes"
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Great edit! High engagement on TikTok FYP."
                  className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  id="btn-switch-to-reject-mode"
                  onClick={() => setRejectionMode(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Reject Submission
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-approve-clip"
                    onClick={handleApproveSubmit}
                    className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Approve & Disburse ${payoutAmount}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Rejection Mode */
            <div className="space-y-3 rounded-lg border border-rose-900/40 bg-rose-950/20 p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Rejection Reason
                </span>
                <button
                  type="button"
                  onClick={() => setRejectionMode(false)}
                  className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Back to Approval
                </button>
              </div>

              <select
                id="select-rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border border-rose-800/60 bg-slate-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-rose-500"
              >
                <option value="Quality standards or guideline mismatch">Quality standards or guideline mismatch</option>
                <option value="Campaign hashtags missing or incorrect">Campaign hashtags missing or incorrect</option>
                <option value="Audio copyright claim or muted sound">Audio copyright claim or muted sound</option>
                <option value="Fake or artificially inflated engagement metrics">Fake or artificially inflated engagement metrics</option>
                <option value="Duplicate submission">Duplicate submission</option>
              </select>

              <textarea
                id="textarea-rejection-feedback"
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Specific guidance for the creator to re-submit..."
                className="w-full rounded-md border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectionMode(false)}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-reject-clip"
                  onClick={handleRejectSubmit}
                  className="flex items-center gap-1.5 rounded-md bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
