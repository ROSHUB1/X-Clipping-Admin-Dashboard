export type AdminSection = 'withdrawals' | 'clips-to-review' | 'reviewed-clips' | 'team';

export type BankType = 'BDO' | 'GCash' | 'BPI' | 'PayPal' | 'Maya' | 'UnionBank';

export type PaymentStatus = 'Paid' | 'Pending';

export interface Withdrawal {
  id: number;
  date: string; // "Aug 27, 2025"
  time: string; // "09:14 PM"
  username: string; // "@ZenoClips"
  userId: string; // "#4851"
  avatar: string; // "Z"
  bank: BankType;
  accountLast4: string | null; // "4321" (null if PayPal)
  email?: string; // "vexclips@gmail.com" (PayPal)
  accountName: string; // "Juan Dela Cruz"
  status: PaymentStatus;
  amount: string; // "$28.00"
  amountNumber: number;
  transactionId: string; // "TRX-89342918"
  timestamp: number;
}

export type PlatformType = 'TikTok' | 'YouTube' | 'Instagram' | 'X' | 'Facebook' | string;

export interface DiscordUser {
  id: string;
  username: string;
  globalName?: string;
  discordTag?: string;
  avatar?: string | null;
  avatarUrl: string;
  email?: string;
  role?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  username: string;
  discordTag?: string;
  avatarUrl: string;
  role: string;
  isOnline: boolean;
  lastSeen?: number;
  lastSeenText?: string;
  activeTask?: string;
}

export interface ReviewerAttribution {
  id?: string;
  name: string;
  username: string;
  discordTag?: string;
  avatarUrl?: string;
  role?: string;
  timestamp?: string | number;
}

export interface ClipToReview {
  id: number;
  title: string;
  creator: string; // "@thekid092"
  creatorName?: string;
  date: string;
  time: string;
  platform: PlatformType;
  views: string;
  viewsNumber: number;
  likes: string;
  comments: string;
  campaign: string;
  duration: string;
  clipId: string;
  suggestedPayout: string;
  videoDescription?: string;
  guidelinesFollowed: boolean;
  videoPreviewUrl?: string;
  videoUrl?: string;
  rawVideoUrl?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  embedHtml?: string;
  timestamp: number;
  currentlyReviewingBy?: ReviewerAttribution | null;
}

export interface CampaignGroup {
  campaign: string;
  count: number;
  description?: string;
  badge?: string;
  clips: ClipToReview[];
}

export interface ReviewedClip {
  id: number;
  title: string;
  creator: string; // "@thekid092"
  campaign: string; // "Summer Vibes Campaign"
  date: string;
  time: string;
  platform: PlatformType;
  views: string;
  likes: string;
  comments: string;
  amount: string;
  clipId: string; // "CLP-7F3A2B9C4E1D"
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  reviewerNotes?: string;
  reviewedDate?: string;
  reviewedBy?: ReviewerAttribution;
  videoUrl?: string;
  rawVideoUrl?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  embedHtml?: string;
  duration?: string;
}

export type StatusFilter = 'all' | 'Pending' | 'Paid';
export type DateFilter = 'all' | 'week' | 'month';
export type ReviewedTabFilter = 'approved' | 'rejected';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}
