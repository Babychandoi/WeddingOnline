import { requireSecret } from '@dco/shared/server';

export interface ShardInfo {
  roomId: string;
  weddingId: string;
  shardIndex: number;
  clients: number;
  maxClients: number;
}

function getRealtimeHttpUrl(): string {
  return process.env.REALTIME_HTTP_URL || 'http://127.0.0.1:2567';
}

function getInternalSecret(): string {
  return requireSecret('INTERNAL_SERVICE_SECRET');
}

export async function fetchWeddingShards(weddingId: string): Promise<ShardInfo[]> {
  try {
    const res = await fetch(`${getRealtimeHttpUrl()}/shards/${encodeURIComponent(weddingId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { shards?: ShardInfo[] };
    return data.shards ?? [];
  } catch {
    return [];
  }
}

export async function publishRealtimeEvent(event: {
  type:
    | 'GIFT_CELEBRATION_EVENT'
    | 'PLAN_ACTIVATED'
    | 'FORCE_ARCHIVE_ROOM'
    | 'ROOM_EXPIRED'
    | 'MOD_BAN_USER'
    | 'ACCOUNT_LOCKED';
  weddingId: string;
  guestName?: string;
  wishMessage?: string;
  tier?: string;
  userId?: string;
  action?: 'MUTE' | 'UNMUTE' | 'KICK' | 'BAN';
}): Promise<boolean> {
  try {
    const res = await fetch(`${getRealtimeHttpUrl()}/internal/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': getInternalSecret(),
      },
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('[security]')) {
      console.error(err.message);
    }
    return false;
  }
}
