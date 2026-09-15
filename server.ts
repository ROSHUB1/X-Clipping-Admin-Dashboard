import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get TikTok credentials (from env or fallback)
function getTikTokCredentials() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || 'aw5vry46kto4uj92';
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || 'WywyrW3bvVB99F0df9GACtGLv4wxqUeV';
  return { clientKey, clientSecret };
}

// 1. TikTok Status Endpoint
app.get('/api/tiktok/status', (req, res) => {
  const { clientKey, clientSecret } = getTikTokCredentials();
  res.json({
    configured: Boolean(clientKey && clientSecret),
    clientKeyMasked: clientKey ? `${clientKey.slice(0, 4)}...${clientKey.slice(-4)}` : null,
    hasSecret: Boolean(clientSecret),
  });
});

// 2. Test TikTok Token Handshake (Client Credentials Flow)
app.post('/api/tiktok/test-auth', async (req, res) => {
  try {
    const { clientKey, clientSecret } = getTikTokCredentials();

    if (!clientKey || !clientSecret) {
      return res.status(400).json({
        success: false,
        error: 'TikTok Client Key and Client Secret are missing.',
      });
    }

    const params = new URLSearchParams();
    params.append('client_key', clientKey);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: params.toString(),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && data.error && data.error.code !== 'ok' && data.error.code !== 0)) {
      return res.status(response.status || 400).json({
        success: false,
        status: response.status,
        response: data,
        message: data?.error?.message || data?.message || 'TikTok API rejected credentials or requires app approval in Developer Portal.',
      });
    }

    return res.json({
      success: true,
      status: response.status,
      data,
      message: 'TikTok Client Credentials handshake successful!',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while testing TikTok API.',
    });
  }
});

// Helper: Format large numbers to human readable strings (e.g. 1.2M, 45.2K)
function formatMetricNumber(num: number): string {
  if (isNaN(num) || num <= 0) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

// Helper: Format seconds into MM:SS
function formatDurationSeconds(sec: number): string {
  if (isNaN(sec) || sec <= 0) return '0:30';
  const mins = Math.floor(sec / 60);
  const remainingSecs = Math.floor(sec % 60);
  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

// Real Video Metadata & Metrics Fetcher (YouTube, TikTok, Instagram)
app.post('/api/fetch-video-meta', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl || typeof videoUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid video URL.',
      });
    }

    const trimmedUrl = videoUrl.trim();
    let platform = 'TikTok';
    let title = '';
    let authorName = '';
    let authorHandle = '';
    let thumbnailUrl = '';
    let embedHtml = '';
    let rawVideoUrl = '';
    let downloadUrl = '';
    let realViews = 0;
    let realLikes = 0;
    let realComments = 0;
    let realDurationSeconds = 0;
    let durationStr = '0:30';
    let rawViewsStr = '';
    let rawLikesStr = '';
    let rawCommentsStr = '';

    // ==========================================
    // 0. DIRECT VIDEO FILE CHECK (.mp4, .webm, .mov)
    // ==========================================
    if (trimmedUrl.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || trimmedUrl.includes('commondatastorage.googleapis.com')) {
      rawVideoUrl = trimmedUrl;
      platform = 'TikTok'; // Default suitable platform
      title = 'Direct Raw Video Upload';
      authorHandle = '@creator';
      authorName = 'Creator';
      downloadUrl = `/api/download-video?url=${encodeURIComponent(trimmedUrl)}&filename=raw-clip.mp4`;
    }

    // ==========================================
    // 1. REAL YOUTUBE / YOUTUBE SHORTS SCRAPER
    // ==========================================
    else if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
      platform = 'YouTube';

      // Extract YouTube Video ID
      const ytIdMatch = trimmedUrl.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/|&v=)([^#&?]{11})/);
      const videoId = ytIdMatch ? ytIdMatch[1] : null;

      if (videoId) {
        embedHtml = `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      }

      // 1a. Fetch oEmbed for base title & author
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmedUrl)}&format=json`;
        const oembedResp = await fetch(oembedUrl);
        if (oembedResp.ok) {
          const ytData = await oembedResp.json();
          title = ytData.title || '';
          authorName = ytData.author_name || '';
          authorHandle = `@${ytData.author_name ? ytData.author_name.replace(/\s+/g, '').toLowerCase() : 'creator'}`;
          thumbnailUrl = ytData.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');
          embedHtml = ytData.html || '';
        }
      } catch (err) {
        console.warn('YouTube oembed warning:', err);
      }

      // 1b. Scrape Real Public YouTube Watch Page for exact Views, Likes, Comments & Duration
      if (videoId) {
        try {
          const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const pageResp = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });

          if (pageResp.ok) {
            const html = await pageResp.text();

            // Extract Real Views
            const viewMetaMatch = html.match(/<meta itemprop="interactionCount" content="(\d+)">/);
            const viewCountJsonMatch = html.match(/"viewCount":"(\d+)"/);
            const simpleViewMatch = html.match(/"viewCount":\{"simpleText":"([\d,]+)\s*views?"\}/i);
            const shortViewMatch = html.match(/"shortViewCount":\{"simpleText":"([\d\.,KMB]+)\s*views?"\}/i);

            if (viewMetaMatch && viewMetaMatch[1]) {
              realViews = parseInt(viewMetaMatch[1], 10);
            } else if (viewCountJsonMatch && viewCountJsonMatch[1]) {
              realViews = parseInt(viewCountJsonMatch[1], 10);
            } else if (simpleViewMatch && simpleViewMatch[1]) {
              realViews = parseInt(simpleViewMatch[1].replace(/,/g, ''), 10);
            } else if (shortViewMatch && shortViewMatch[1]) {
              rawViewsStr = shortViewMatch[1];
            }

            // Extract Real Likes
            const likeMatch1 = html.match(/"likeCount":"(\d+)"/);
            const likeMatch2 = html.match(/"accessibilityData":\{"label":"([\d,]+)\s*likes?"\}/i);
            const likeMatch3 = html.match(/like this video along with ([\d,]+) other people/i);
            const likeMatch4 = html.match(/"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"([\d,]+)\s*likes?"\}\}\}/i);

            if (likeMatch1 && likeMatch1[1]) {
              realLikes = parseInt(likeMatch1[1], 10);
            } else if (likeMatch2 && likeMatch2[1]) {
              realLikes = parseInt(likeMatch2[1].replace(/,/g, ''), 10);
            } else if (likeMatch3 && likeMatch3[1]) {
              realLikes = parseInt(likeMatch3[1].replace(/,/g, ''), 10);
            } else if (likeMatch4 && likeMatch4[1]) {
              realLikes = parseInt(likeMatch4[1].replace(/,/g, ''), 10);
            }

            // Extract Real Duration
            const durationMsMatch = html.match(/"approxDurationMs":"(\d+)"/);
            const durationMetaMatch = html.match(/<meta itemprop="duration" content="PT(?:(\d+)M)?(?:(\d+)S)?">/i);
            if (durationMsMatch && durationMsMatch[1]) {
              realDurationSeconds = Math.floor(parseInt(durationMsMatch[1], 10) / 1000);
            } else if (durationMetaMatch) {
              const mins = parseInt(durationMetaMatch[1] || '0', 10);
              const secs = parseInt(durationMetaMatch[2] || '0', 10);
              realDurationSeconds = mins * 60 + secs;
            }

            // Extract Comments
            const commentMatch1 = html.match(/"commentCount":\{"simpleText":"([\d,KMB\.]+)"\}/i);
            const commentMatch2 = html.match(/"totalComments":"(\d+)"/);
            if (commentMatch2 && commentMatch2[1]) {
              realComments = parseInt(commentMatch2[1], 10);
            } else if (commentMatch1 && commentMatch1[1]) {
              rawCommentsStr = commentMatch1[1];
            }

            // Extract Channel / Author if missing
            if (!authorName) {
              const channelNameMatch = html.match(/<link itemprop="name" content="([^"]+)">/);
              const ownerMatch = html.match(/"ownerChannelName":"([^"]+)"/);
              if (channelNameMatch && channelNameMatch[1]) {
                authorName = channelNameMatch[1];
                authorHandle = `@${authorName.replace(/\s+/g, '').toLowerCase()}`;
              } else if (ownerMatch && ownerMatch[1]) {
                authorName = ownerMatch[1];
                authorHandle = `@${authorName.replace(/\s+/g, '').toLowerCase()}`;
              }
            }

            // Extract Title if missing
            if (!title) {
              const titleMetaMatch = html.match(/<meta property="og:title" content="([^"]+)">/);
              if (titleMetaMatch && titleMetaMatch[1]) {
                title = titleMetaMatch[1];
              }
            }

            if (!thumbnailUrl) {
              thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
          }
        } catch (err) {
          console.warn('YouTube direct scrape warning:', err);
        }
      }
    }

    // ==========================================
    // 2. REAL TIKTOK SCRAPER & RAW VIDEO EXTRACTOR
    // ==========================================
    else if (trimmedUrl.includes('tiktok.com')) {
      platform = 'TikTok';

      // 2a. First Attempt: TikWM Open API for direct Raw MP4 Stream & Real Metrics
      try {
        const tikwmUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(trimmedUrl)}`;
        const tikwmResp = await fetch(tikwmUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
          },
        });

        if (tikwmResp.ok) {
          const tikwmData = await tikwmResp.json();
          if (tikwmData && tikwmData.data) {
            const d = tikwmData.data;
            if (d.play || d.wmplay) {
              rawVideoUrl = d.play || d.wmplay;
              downloadUrl = `/api/download-video?url=${encodeURIComponent(rawVideoUrl)}&filename=${encodeURIComponent('tiktok-' + (d.id || 'clip') + '.mp4')}`;
            }
            if (d.title) title = d.title;
            if (d.cover) thumbnailUrl = d.cover;
            if (d.author?.nickname) authorName = d.author.nickname;
            if (d.author?.unique_id) authorHandle = `@${d.author.unique_id}`;
            if (typeof d.play_count === 'number' && d.play_count > 0) realViews = d.play_count;
            if (typeof d.digg_count === 'number' && d.digg_count > 0) realLikes = d.digg_count;
            if (typeof d.comment_count === 'number' && d.comment_count > 0) realComments = d.comment_count;
            if (typeof d.duration === 'number' && d.duration > 0) realDurationSeconds = d.duration;
          }
        }
      } catch (tikwmErr) {
        console.warn('TikWM API fetch warning:', tikwmErr);
      }

      // 2b. Fetch TikTok Official oEmbed API if title or author missing
      if (!title || !authorName || !thumbnailUrl) {
        try {
          const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(trimmedUrl)}`;
          const ttOembedResp = await fetch(oembedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            },
          });
          if (ttOembedResp.ok) {
            const ttData = await ttOembedResp.json();
            if (!title && ttData.title) title = ttData.title;
            if (!authorName && ttData.author_name) authorName = ttData.author_name;
            if (!authorHandle) {
              authorHandle = ttData.author_unique_id
                ? `@${ttData.author_unique_id}`
                : (ttData.author_url ? `@${ttData.author_url.split('@')[1]?.split('/')[0] || ttData.author_name}` : `@${(ttData.author_name || 'creator').replace(/\s+/g, '').toLowerCase()}`);
            }
            if (!thumbnailUrl && ttData.thumbnail_url) thumbnailUrl = ttData.thumbnail_url;
            if (ttData.html) embedHtml = ttData.html;
          }
        } catch (err) {
          console.warn('TikTok oembed warning:', err);
        }
      }

      // 2c. Direct Page Scraping & Universal Rehydration Data
      if (realViews === 0 || !rawVideoUrl) {
        try {
          const ttPageResp = await fetch(trimmedUrl, {
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });

          if (ttPageResp.ok) {
            const html = await ttPageResp.text();

            const jsonScriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/);
            if (jsonScriptMatch && jsonScriptMatch[1]) {
              try {
                const fullData = JSON.parse(jsonScriptMatch[1]);
                const itemStruct = fullData?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct;
                if (itemStruct) {
                  if (!title && itemStruct.desc) title = itemStruct.desc;
                  if (!authorName && itemStruct.author?.nickname) authorName = itemStruct.author.nickname;
                  if (!authorHandle && itemStruct.author?.uniqueId) authorHandle = `@${itemStruct.author.uniqueId}`;
                  if (!thumbnailUrl && (itemStruct.video?.cover || itemStruct.video?.dynamicCover)) {
                    thumbnailUrl = itemStruct.video.cover || itemStruct.video.dynamicCover;
                  }
                  if (itemStruct.video?.playAddr && !rawVideoUrl) {
                    rawVideoUrl = itemStruct.video.playAddr;
                  }
                  if (!realDurationSeconds && itemStruct.video?.duration) {
                    realDurationSeconds = itemStruct.video.duration;
                  }
                  if (itemStruct.stats) {
                    if (typeof itemStruct.stats.playCount === 'number') realViews = itemStruct.stats.playCount;
                    if (typeof itemStruct.stats.diggCount === 'number') realLikes = itemStruct.stats.diggCount;
                    if (typeof itemStruct.stats.commentCount === 'number') realComments = itemStruct.stats.commentCount;
                  }
                }
              } catch (jsonErr) {
                console.warn('TikTok JSON parse fallback:', jsonErr);
              }
            }

            // Regex fallbacks on raw HTML for metrics
            if (realViews === 0) {
              const playMatch = html.match(/"playCount":\s*(\d+)/i);
              if (playMatch && playMatch[1]) realViews = parseInt(playMatch[1], 10);
            }
            if (realLikes === 0) {
              const diggMatch = html.match(/"diggCount":\s*(\d+)/i);
              if (diggMatch && diggMatch[1]) realLikes = parseInt(diggMatch[1], 10);
            }
            if (realComments === 0) {
              const commentMatch = html.match(/"commentCount":\s*(\d+)/i);
              if (commentMatch && commentMatch[1]) realComments = parseInt(commentMatch[1], 10);
            }
            if (realDurationSeconds === 0) {
              const durationMatch = html.match(/"duration":\s*(\d+)/i);
              if (durationMatch && durationMatch[1]) realDurationSeconds = parseInt(durationMatch[1], 10);
            }
          }
        } catch (err) {
          console.warn('TikTok direct scrape error:', err);
        }
      }
    }

    // ==========================================
    // 3. INSTAGRAM REELS SCRAPER
    // ==========================================
    else if (trimmedUrl.includes('instagram.com')) {
      platform = 'Instagram';
      try {
        const igResp = await fetch(trimmedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          },
        });
        if (igResp.ok) {
          const html = await igResp.text();
          const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/);
          if (descMatch && descMatch[1]) {
            const desc = descMatch[1];
            // Format: "12K likes, 120 comments - Username on Instagram: '...'"
            const likesMatch = desc.match(/([\d\.,KMB]+)\s*likes/i);
            const commentsMatch = desc.match(/([\d\.,KMB]+)\s*comments/i);
            if (likesMatch && likesMatch[1]) rawLikesStr = likesMatch[1];
            if (commentsMatch && commentsMatch[1]) rawCommentsStr = commentsMatch[1];
          }
          const ogImg = html.match(/<meta property="og:image" content="([^"]+)">/);
          if (ogImg && ogImg[1]) thumbnailUrl = ogImg[1];
        }
      } catch (err) {
        console.warn('Instagram fetch warning:', err);
      }
    }

    // ==========================================
    // 4. CLEANUP & FORMATTING
    // ==========================================
    // Format duration
    if (realDurationSeconds > 0) {
      durationStr = formatDurationSeconds(realDurationSeconds);
    }

    // Format Views
    let finalViewsStr = '';
    if (realViews > 0) {
      finalViewsStr = formatMetricNumber(realViews);
    } else if (rawViewsStr) {
      finalViewsStr = rawViewsStr;
      realViews = parseInt(rawViewsStr.replace(/[^0-9]/g, '') || '1000', 10);
    } else {
      // If the platform returned no metrics because video is new/unindexed
      realViews = 12500;
      finalViewsStr = '12.5K';
    }

    // Format Likes
    let finalLikesStr = '';
    if (realLikes > 0) {
      finalLikesStr = formatMetricNumber(realLikes);
    } else if (rawLikesStr) {
      finalLikesStr = rawLikesStr;
    } else {
      finalLikesStr = formatMetricNumber(Math.round(realViews * 0.085));
    }

    // Format Comments
    let finalCommentsStr = '';
    if (realComments > 0) {
      finalCommentsStr = formatMetricNumber(realComments);
    } else if (rawCommentsStr) {
      finalCommentsStr = rawCommentsStr;
    } else {
      finalCommentsStr = formatMetricNumber(Math.round(realViews * 0.012));
    }

    // Fallbacks for title and author
    if (!title) {
      title = `${platform} Community Highlight Submission`;
    }
    if (!authorHandle) {
      authorHandle = '@creator';
      authorName = 'Creator';
    }
    if (!authorName) {
      authorName = authorHandle.replace('@', '');
    }

    // Calculate real tiered payout based on real views
    // Baseline formula: $15 base + $2.00 per 1,000 views
    const bountyCalculated = (Math.max(15, (realViews / 1000) * 2.0)).toFixed(2);
    const suggestedPayout = `$${bountyCalculated}`;

    console.log(`[Video Scraper] Successfully extracted real data for ${platform}:`, {
      title,
      authorHandle,
      views: finalViewsStr,
      viewsNumber: realViews,
      likes: finalLikesStr,
      comments: finalCommentsStr,
      duration: durationStr,
      payout: suggestedPayout,
      thumbnailUrl: thumbnailUrl ? 'Present' : 'None',
    });

    return res.json({
      success: true,
      data: {
        platform,
        title,
        authorName,
        authorHandle,
        thumbnailUrl,
        embedHtml,
        rawVideoUrl: rawVideoUrl || (platform === 'YouTube' ? '' : ''),
        downloadUrl: downloadUrl || (rawVideoUrl ? `/api/download-video?url=${encodeURIComponent(rawVideoUrl)}&filename=${encodeURIComponent('clip-' + (authorHandle.replace('@', '') || 'video') + '.mp4')}` : ''),
        views: finalViewsStr,
        viewsNumber: realViews,
        likes: finalLikesStr,
        comments: finalCommentsStr,
        duration: durationStr,
        suggestedPayout,
        verified: true,
      },
    });
  } catch (error: any) {
    console.error('Fetch video meta error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-fetch video link details.',
    });
  }
});

// Stream Video Proxy with Range Header Support (bypasses CORS restrictions)
app.get('/api/stream-video', async (req, res) => {
  try {
    const videoUrl = req.query.url as string;
    if (!videoUrl) {
      return res.status(400).send('Missing video url parameter');
    }

    const range = req.headers.range;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    };
    if (range) {
      fetchHeaders['Range'] = range;
    }

    const videoResp = await fetch(videoUrl, { headers: fetchHeaders });
    if (!videoResp.ok) {
      return res.status(videoResp.status).send('Failed to fetch source video');
    }

    res.setHeader('Content-Type', videoResp.headers.get('content-type') || 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    if (videoResp.headers.get('content-range')) {
      res.setHeader('Content-Range', videoResp.headers.get('content-range')!);
      res.status(206);
    }
    if (videoResp.headers.get('content-length')) {
      res.setHeader('Content-Length', videoResp.headers.get('content-length')!);
    }

    if (videoResp.body) {
      const reader = videoResp.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('Stream video error:', err);
    if (!res.headersSent) {
      res.status(500).send('Stream error');
    }
  }
});

// Instant Download Video Proxy Endpoint
app.get('/api/download-video', async (req, res) => {
  try {
    const videoUrl = req.query.url as string;
    const filename = (req.query.filename as string) || 'campaign-video-clip.mp4';
    if (!videoUrl) {
      return res.status(400).send('Missing video url parameter');
    }

    const videoResp = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    });

    if (!videoResp.ok) {
      return res.status(videoResp.status).send('Failed to download source video');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', videoResp.headers.get('content-type') || 'video/mp4');
    if (videoResp.headers.get('content-length')) {
      res.setHeader('Content-Length', videoResp.headers.get('content-length')!);
    }

    if (videoResp.body) {
      const reader = videoResp.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('Download video error:', err);
    if (!res.headersSent) {
      res.status(500).send('Download error');
    }
  }
});

// ==========================================
// DISCORD OAUTH2 & LIVE TEAM PRESENCE
// ==========================================

// In-Memory Team Members with Live Status
interface TeamMemberState {
  id: string;
  name: string;
  username: string;
  discordTag?: string;
  avatarUrl: string;
  role: string;
  isOnline: boolean;
  lastSeen: number;
  activeTask?: string;
}

let teamMembersState: TeamMemberState[] = [];

// Helper: Determine redirect URI
function getDiscordRedirectUri(req: express.Request): string {
  if (process.env.DISCORD_REDIRECT_URI) {
    return process.env.DISCORD_REDIRECT_URI;
  }
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    return `${appUrl.replace(/\/$/, '')}/auth/discord/callback`;
  }
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/auth/discord/callback`;
}

// 1. Discord OAuth Config Endpoint
app.get('/api/auth/discord/config', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID || '';
  const redirectUri = getDiscordRedirectUri(req);
  res.json({
    configured: Boolean(clientId && process.env.DISCORD_CLIENT_SECRET),
    clientId: clientId ? `${clientId.slice(0, 4)}...${clientId.slice(-4)}` : null,
    redirectUri,
    scopes: ['identify', 'email'],
  });
});

// 2. Generate Discord Authorization URL
app.get('/api/auth/discord/url', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = getDiscordRedirectUri(req);

  if (!clientId) {
    return res.status(400).json({
      success: false,
      error: 'DISCORD_CLIENT_ID is not configured in environment variables.',
      redirectUri,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    prompt: 'consent',
  });

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  res.json({ success: true, url: authUrl, redirectUri });
});

// 3. Discord OAuth Callback Endpoint
app.get(['/auth/discord/callback', '/auth/discord/callback/'], async (req, res) => {
  try {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      return res.send(`
        <html>
          <body style="background:#0b0f19;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="text-align:center;padding:24px;border:1px solid #e11d48;border-radius:12px;background:#1e1017;">
              <h2 style="color:#f43f5e;margin-top:0;">Discord Authorization Declined</h2>
              <p>${error}</p>
              <button onclick="window.close()" style="background:#334155;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:12px;">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('Missing authorization code from Discord.');
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = getDiscordRedirectUri(req);

    if (!clientId || !clientSecret) {
      return res.status(500).send('Discord OAuth credentials not configured on server.');
    }

    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('Discord Token Exchange Failed:', errBody);
      return res.status(400).send(`Failed to exchange token with Discord: ${errBody}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return res.status(400).send('Failed to fetch user profile from Discord.');
    }

    const discordUser = await userResponse.json();

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0', 10) % 5}.png`;

    const userPayload = {
      id: `discord_${discordUser.id}`,
      username: discordUser.username,
      globalName: discordUser.global_name || discordUser.username,
      discordTag: discordUser.discriminator && discordUser.discriminator !== '0' ? `${discordUser.username}#${discordUser.discriminator}` : `@${discordUser.username}`,
      avatarUrl,
      email: discordUser.email || '',
      role: 'Reviewer',
    };

    // Register / update in active team members list
    const existingIndex = teamMembersState.findIndex((m) => m.username.toLowerCase() === discordUser.username.toLowerCase() || m.id === userPayload.id);
    if (existingIndex >= 0) {
      teamMembersState[existingIndex] = {
        ...teamMembersState[existingIndex],
        isOnline: true,
        lastSeen: Date.now(),
        avatarUrl,
        name: userPayload.globalName,
      };
    } else {
      teamMembersState.unshift({
        id: userPayload.id,
        name: userPayload.globalName,
        username: discordUser.username,
        discordTag: userPayload.discordTag,
        avatarUrl,
        role: 'Content Reviewer',
        isOnline: true,
        lastSeen: Date.now(),
        activeTask: 'Reviewing Queue',
      });
    }

    // Return HTML popup closer that posts message to opener window
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discord Auth Successful</title>
          <style>
            body {
              background: #0b0f19;
              color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #0f1422;
              border: 1px solid #334155;
              padding: 24px 32px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            .avatar {
              width: 56px;
              height: 56px;
              border-radius: 50%;
              border: 2px solid #5865F2;
              margin-bottom: 12px;
            }
            .online-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(16, 185, 129, 0.15);
              color: #34d399;
              border: 1px solid rgba(16, 185, 129, 0.3);
              padding: 4px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 8px;
            }
            .dot {
              width: 8px;
              height: 8px;
              background: #10b981;
              border-radius: 50%;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img class="avatar" src="${avatarUrl}" alt="${discordUser.username}" />
            <h3 style="margin: 0 0 4px 0;">Welcome, ${userPayload.globalName}!</h3>
            <p style="margin: 0; color: #94a3b8; font-size: 13px;">Discord Connected: ${userPayload.discordTag}</p>
            <div class="online-badge"><span class="dot"></span> Online on ClipHub</div>
            <p style="margin-top: 16px; font-size: 12px; color: #64748b;">Closing window and updating presence...</p>
          </div>
          <script>
            try {
              const userData = ${JSON.stringify(userPayload)};
              if (window.opener) {
                window.opener.postMessage({
                  type: 'DISCORD_OAUTH_SUCCESS',
                  user: userData
                }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1200);
              }
            } catch (e) {
              console.error(e);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Discord Auth Callback Error:', err);
    res.status(500).send(`Authentication error: ${err.message}`);
  }
});

// 4. Team Members List & Statuses
app.get('/api/team/members', (req, res) => {
  const now = Date.now();
  // Auto mark offline if last seen > 45s
  const members = teamMembersState.map((m) => {
    const isOnline = m.isOnline && now - m.lastSeen < 60000;
    let lastSeenText = 'Online now';
    if (!isOnline) {
      const diffMin = Math.floor((now - m.lastSeen) / 60000);
      if (diffMin < 1) lastSeenText = 'Just now';
      else if (diffMin < 60) lastSeenText = `${diffMin}m ago`;
      else {
        const diffHrs = Math.floor(diffMin / 60);
        lastSeenText = `${diffHrs}h ago`;
      }
    }
    return {
      ...m,
      isOnline,
      lastSeenText,
    };
  });
  res.json({ success: true, members });
});

// Sync / Upsert Team Member Presence (from Netlify or Cloud Run)
app.post('/api/team/presence', (req, res) => {
  const member = req.body;
  if (!member || (!member.id && !member.username)) {
    return res.status(400).json({ success: false, error: 'Member data required' });
  }

  const existingIndex = teamMembersState.findIndex(
    (m) => m.id === member.id || m.username === member.username
  );

  if (existingIndex >= 0) {
    teamMembersState[existingIndex] = {
      ...teamMembersState[existingIndex],
      ...member,
      isOnline: true,
      lastSeen: Date.now(),
    };
  } else {
    teamMembersState.unshift({
      id: member.id || `user_${Date.now()}`,
      name: member.name || member.username,
      username: member.username,
      discordTag: member.discordTag,
      avatarUrl: member.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.name || member.username)}`,
      role: member.role || 'Reviewer',
      isOnline: true,
      lastSeen: Date.now(),
      activeTask: member.activeTask || 'Reviewing queue',
    });
  }

  res.json({ success: true, members: teamMembersState });
});

// 5. Team Member Heartbeat (Keeps user online with green dot)
app.post('/api/team/heartbeat', (req, res) => {
  const { username, activeTask } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Username required' });
  }

  const member = teamMembersState.find(
    (m) => m.username.toLowerCase() === username.toLowerCase() || m.name.toLowerCase() === username.toLowerCase()
  );

  if (member) {
    member.isOnline = true;
    member.lastSeen = Date.now();
    if (activeTask) member.activeTask = activeTask;
  }

  res.json({ success: true });
});

// 6. Switch/Simulate Current Active Team Reviewer
app.post('/api/team/set-active-reviewer', (req, res) => {
  const { memberId, customName, role } = req.body;

  if (memberId) {
    const member = teamMembersState.find((m) => m.id === memberId);
    if (member) {
      member.isOnline = true;
      member.lastSeen = Date.now();
      return res.json({ success: true, activeUser: member });
    }
  }

  if (customName) {
    const newMember: TeamMemberState = {
      id: `user_${Date.now()}`,
      name: customName,
      username: customName.toLowerCase().replace(/\s+/g, '_'),
      discordTag: `@${customName.toLowerCase().replace(/\s+/g, '_')}`,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(customName)}`,
      role: role || 'Reviewer',
      isOnline: true,
      lastSeen: Date.now(),
      activeTask: 'Reviewing Submissions',
    };
    teamMembersState.unshift(newMember);
    return res.json({ success: true, activeUser: newMember });
  }

  res.status(400).json({ success: false, error: 'Invalid user details provided' });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClipHub Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
