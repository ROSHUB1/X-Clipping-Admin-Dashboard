import { TeamMember, DiscordUser } from '../types';

// Global shared cloud room for ClipHub dashboard team presence
const GLOBAL_ROOM_TOPIC = 'cliphub_team_presence_sync_v2';
const STORAGE_KEY = 'cliphub_team_roster_cache';
const CHANNEL_NAME = 'cliphub_team_presence_local_v1';

class TeamPresenceService {
  private localChannel: BroadcastChannel | null = null;
  private sseSource: EventSource | null = null;
  private listeners: ((members: TeamMember[]) => void)[] = [];
  private currentRoster: TeamMember[] = [];
  private heartbeatInterval: any = null;
  private syncCheckInterval: any = null;
  private activeUser: DiscordUser | null = null;
  private isConnectedToCloud: boolean = false;

  constructor() {
    // 1. Initialize Local BroadcastChannel for same-browser multi-tab sync
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.localChannel = new BroadcastChannel(CHANNEL_NAME);
        this.localChannel.onmessage = (event) => {
          this.handleIncomingPayload(event.data);
        };
      }
    } catch {}

    // 2. Load cached roster from LocalStorage
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: TeamMember[] = JSON.parse(cached);
        this.currentRoster = this.computeOnlineStatuses(parsed);
      }
    } catch {}

    // 3. Connect to Worldwide Cloud SSE Relay (works seamlessly on Netlify, Vercel, Localhost, Mobile)
    this.connectCloudRelay();

    // 4. Periodic check to recalculate online/offline statuses (every 10s)
    this.syncCheckInterval = setInterval(() => {
      const updated = this.computeOnlineStatuses(this.currentRoster);
      this.currentRoster = updated;
      this.notifyListeners();
    }, 10000);
  }

  // Connect to free public SSE pub/sub relay on ntfy.sh (No CORS restrictions, supports Netlify static)
  private connectCloudRelay() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    try {
      if (this.sseSource) {
        this.sseSource.close();
      }

      const sseUrl = `https://ntfy.sh/${GLOBAL_ROOM_TOPIC}/sse`;
      this.sseSource = new EventSource(sseUrl);

      this.sseSource.onopen = () => {
        this.isConnectedToCloud = true;
        // Ask all peers currently online to announce themselves
        this.broadcastCloud({ type: 'PEER_DISCOVERY_QUERY' });
        // If we are already logged in, announce our presence
        if (this.activeUser) {
          this.announcePresence(this.activeUser, true);
        }
      };

      this.sseSource.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw && raw.message) {
            const payload = JSON.parse(raw.message);
            this.handleIncomingPayload(payload);
          }
        } catch {
          // Non-JSON or standard ping from SSE
        }
      };

      this.sseSource.onerror = () => {
        this.isConnectedToCloud = false;
        // Reconnect after 5 seconds if disconnected
        setTimeout(() => {
          this.connectCloudRelay();
        }, 5000);
      };
    } catch (e) {
      console.warn('Could not connect to team cloud presence relay:', e);
    }
  }

  // Broadcast payload across local tabs AND worldwide cloud SSE
  private broadcastCloud(payload: any) {
    // A. Local BroadcastChannel
    try {
      if (this.localChannel) {
        this.localChannel.postMessage(payload);
      }
    } catch {}

    // B. Cloud SSE Relay (POST request to ntfy topic)
    try {
      fetch(`https://ntfy.sh/${GLOBAL_ROOM_TOPIC}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {}

    // C. Local server fallback (when running fullstack Node.js)
    try {
      if (payload.member) {
        fetch('/api/team/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload.member),
        }).catch(() => {});
      }
    } catch {}
  }

  private handleIncomingPayload(payload: any) {
    if (!payload || !payload.type) return;

    if (payload.type === 'PRESENCE_UPDATE' && payload.member) {
      const incoming: TeamMember = payload.member;
      this.upsertMember(incoming);
    } else if (payload.type === 'PEER_DISCOVERY_QUERY') {
      // Another teammate just opened their dashboard; if we are logged in, reply with our current status
      if (this.activeUser) {
        this.announcePresence(this.activeUser, true);
      }
    } else if (payload.type === 'REMOVE_MEMBER' && payload.id) {
      this.currentRoster = this.currentRoster.filter((m) => m.id !== payload.id);
      this.saveAndNotify();
    }
  }

  public subscribe(callback: (members: TeamMember[]) => void) {
    this.listeners.push(callback);
    callback(this.computeOnlineStatuses(this.currentRoster));
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public setUser(user: DiscordUser | null) {
    this.activeUser = user;
    if (user) {
      this.announcePresence(user, true);
      this.startHeartbeat(user);
    } else {
      this.stopHeartbeat();
    }
  }

  public announcePresence(user: DiscordUser, isOnline: boolean) {
    const member: TeamMember = {
      id: user.id || `discord_${user.username}`,
      name: user.globalName || user.username,
      username: user.username,
      discordTag: user.discordTag || `@${user.username}`,
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`,
      role: user.role || 'Reviewer',
      isOnline,
      lastSeen: Date.now(),
      lastSeenText: isOnline ? 'Active now' : 'Offline',
      activeTask: 'Reviewing queue',
    };

    this.upsertMember(member);

    // Broadcast update globally to all teammates
    this.broadcastCloud({
      type: 'PRESENCE_UPDATE',
      member,
      timestamp: Date.now(),
    });
  }

  public upsertMember(member: TeamMember) {
    const existingIndex = this.currentRoster.findIndex(
      (m) => m.id === member.id || m.username.toLowerCase() === member.username.toLowerCase()
    );

    const updatedMember: TeamMember = {
      ...(existingIndex >= 0 ? this.currentRoster[existingIndex] : {}),
      ...member,
      lastSeen: member.lastSeen || Date.now(),
      isOnline: true,
      lastSeenText: 'Active now',
    };

    if (existingIndex >= 0) {
      this.currentRoster[existingIndex] = updatedMember;
    } else {
      this.currentRoster.unshift(updatedMember);
    }

    this.saveAndNotify();
  }

  public removeMember(id: string) {
    this.currentRoster = this.currentRoster.filter((m) => m.id !== id);
    this.broadcastCloud({
      type: 'REMOVE_MEMBER',
      id,
    });
    this.saveAndNotify();
  }

  public forceSync() {
    this.broadcastCloud({ type: 'PEER_DISCOVERY_QUERY' });
    if (this.activeUser) {
      this.announcePresence(this.activeUser, true);
    }
  }

  private computeOnlineStatuses(roster: TeamMember[]): TeamMember[] {
    const now = Date.now();
    return roster.map((m) => {
      // If last ping was received within the last 45 seconds, mark as online
      const isStillOnline = m.lastSeen ? now - m.lastSeen < 45000 : false;
      return {
        ...m,
        isOnline: isStillOnline,
        lastSeenText: isStillOnline
          ? 'Active now'
          : m.lastSeen
          ? `${Math.round((now - m.lastSeen) / 60000)}m ago`
          : 'Offline',
      };
    });
  }

  private saveAndNotify() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentRoster));
    } catch {}
    this.notifyListeners();
  }

  private notifyListeners() {
    const computed = this.computeOnlineStatuses(this.currentRoster);
    this.listeners.forEach((cb) => cb([...computed]));
  }

  private startHeartbeat(user: DiscordUser) {
    this.stopHeartbeat();
    // Heartbeat every 12 seconds to maintain live green dot status
    this.heartbeatInterval = setInterval(() => {
      this.announcePresence(user, true);
    }, 12000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const teamPresence = new TeamPresenceService();
