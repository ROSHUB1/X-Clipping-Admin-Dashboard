// Helper utility to parse video URLs and generate embeds and thumbnails

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function extractTikTokId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/video\/(\d+)/) || url.match(/\/v\/(\d+)/);
  return match ? match[1] : null;
}

export function getEmbedUrl(
  videoUrl?: string,
  platform?: string,
  rawVideoUrl?: string
): {
  type: 'html5' | 'youtube' | 'tiktok' | 'embed';
  src: string;
  isRaw: boolean;
} | null {
  // 1. If explicit raw video URL is present, use it with native HTML5 player
  if (rawVideoUrl) {
    // If it's a remote URL from tikwm or third-party, wrap with stream-video proxy if needed, or direct
    const streamSrc = rawVideoUrl.startsWith('http') && !rawVideoUrl.includes(window.location.host)
      ? `/api/stream-video?url=${encodeURIComponent(rawVideoUrl)}`
      : rawVideoUrl;
    return {
      type: 'html5',
      src: streamSrc,
      isRaw: true,
    };
  }

  if (!videoUrl) return null;

  // 2. Direct Video Files (MP4/WebM/MOV)
  if (
    videoUrl.endsWith('.mp4') ||
    videoUrl.endsWith('.webm') ||
    videoUrl.endsWith('.mov') ||
    videoUrl.includes('commondatastorage.googleapis.com') ||
    videoUrl.includes('tikwm.com')
  ) {
    const streamSrc = videoUrl.startsWith('http') && !videoUrl.includes(window.location.host)
      ? `/api/stream-video?url=${encodeURIComponent(videoUrl)}`
      : videoUrl;
    return {
      type: 'html5',
      src: streamSrc,
      isRaw: true,
    };
  }

  // 3. YouTube / YouTube Shorts
  const ytId = extractYouTubeId(videoUrl);
  if (ytId) {
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`,
      isRaw: false,
    };
  }

  // 4. TikTok Direct Embed URL
  const ttId = extractTikTokId(videoUrl);
  if (ttId) {
    return {
      type: 'tiktok',
      src: `https://www.tiktok.com/embed/v2/${ttId}`,
      isRaw: false,
    };
  }

  return {
    type: 'embed',
    src: videoUrl,
    isRaw: false,
  };
}

export function getDefaultThumbnail(platform: string, id: number | string): string {
  // Diverse gaming high-octane background wallpapers
  const sampleThumbnails = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
  ];
  const numId = typeof id === 'number' ? id : parseInt(id.replace(/\D/g, '') || '0', 10);
  return sampleThumbnails[Math.abs(numId) % sampleThumbnails.length];
}

// Sample playable clips for immediate testing
export const SAMPLE_PLAYABLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];
